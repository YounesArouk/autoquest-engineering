-- AutoQuest Engineering v2: notebooks and atomic module examinations.
-- Run 001, 002, 003, 004 in order. No privileged browser key is required.
begin;
create table if not exists public.module_exams(
 id text primary key,module_id text unique not null references public.modules(id),
 threshold integer not null check(threshold between 1 and 100),revision integer not null
);
create table if not exists public.lesson_notebooks(
 user_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id text not null references public.lessons(id),body text not null check(char_length(body)<=16000),
 checks jsonb not null,updated_at timestamptz not null default now(),primary key(user_id,lesson_id)
);
create table if not exists autoquest_private.exam_forms(
 exam_id text not null references public.module_exams(id),form text not null check(form in ('A','B')),
 questions jsonb not null,solutions jsonb not null,primary key(exam_id,form)
);
create table if not exists autoquest_private.exam_attempts(
 user_id uuid not null references public.profiles(id) on delete cascade,id uuid not null,
 exam_id text not null references public.module_exams(id),form text not null,
 mode text not null check(mode in ('practice','validation')),started_at timestamptz not null default now(),
 result jsonb,finished_at timestamptz,primary key(user_id,id),
 foreign key(exam_id,form) references autoquest_private.exam_forms(exam_id,form),
 check((result is null)=(finished_at is null))
);
create index if not exists aq_exam_history on autoquest_private.exam_attempts(user_id,exam_id,finished_at desc);
alter table public.module_exams enable row level security;
revoke all on public.module_exams from public,anon,authenticated;
grant select on public.module_exams to anon,authenticated;
drop policy if exists aq_exam_read on public.module_exams;
create policy aq_exam_read on public.module_exams for select to anon,authenticated using(true);
alter table public.lesson_notebooks enable row level security;
revoke all on public.lesson_notebooks from public,anon,authenticated;
grant select on public.lesson_notebooks to authenticated;
drop policy if exists aq_notebook_read on public.lesson_notebooks;
create policy aq_notebook_read on public.lesson_notebooks for select to authenticated using((select auth.uid())=user_id);
revoke all on all tables in schema autoquest_private from public,anon,authenticated;

create or replace function autoquest_private.exam_ready(p_user uuid,p_exam text) returns boolean
language sql security definer set search_path='' as $$
select exists(select 1 from public.module_exams where id=p_exam) and not exists(
 select 1 from public.lessons l join public.module_exams e on e.module_id=l.module_id
 where e.id=p_exam and not exists(select 1 from public.lesson_progress p where p.user_id=p_user and p.lesson_id=l.id and p.status='completed')
);
$$;

create or replace function autoquest_private.mark_exam(p_exam text,p_form text,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare f autoquest_private.exam_forms%rowtype;q jsonb;s jsonb;r jsonb;ok boolean;v numeric;
 feedback jsonb:='{}'::jsonb;n integer:=0;right_ integer:=0;
begin
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>30000 then raise exception 'Invalid exam answers';end if;
 select * into f from autoquest_private.exam_forms where exam_id=p_exam and form=p_form;
 if not found then raise exception 'Unknown exam form';end if;
 if (select count(*) from jsonb_object_keys(p_answers))<>jsonb_array_length(f.questions) then raise exception 'Answer every question';end if;
 for q in select value from jsonb_array_elements(f.questions) loop
  if not(p_answers ? (q->>'id')) then raise exception 'Answer every question';end if;
  s:=f.solutions->(q->>'id');r:=p_answers->(q->>'id');ok:=false;n:=n+1;
  if q->>'kind'='single_choice' then
   if jsonb_typeof(r)<>'string' or not exists(select 1 from jsonb_array_elements(q->'choices')c where c->>'id'=r#>>'{}') then raise exception 'Invalid exam choice';end if;
   ok:=(r#>>'{}')=s->'answer'->>'choice_id';
  elsif q->>'kind'='numeric' then
   if jsonb_typeof(r)<>'object' or r->>'unit' is distinct from s->'answer'->>'unit' or jsonb_typeof(r->'value') not in ('number','string') then raise exception 'Invalid exam number or unit';end if;
   if not(replace(trim(r->>'value'),',','.') ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$') then raise exception 'Finite exam number required';end if;
   v:=replace(trim(r->>'value'),',','.')::numeric;
   ok:=abs(v-(s->'answer'->>'value')::numeric)<=(s->'answer'->>'abs_tolerance')::numeric;
  else raise exception 'Unsupported exam question';end if;
  if ok then right_:=right_+1;end if;
  feedback:=feedback||jsonb_build_object(q->>'id',jsonb_build_object('outcome',case when ok then 'correct' else 'incorrect' end,'explanation',s->'explanation'));
 end loop;
 return jsonb_build_object('correct',right_,'total',n,'score',round(right_::numeric/n*100,2),'feedback',feedback);
end$$;

-- Stateless anonymous marking exposes feedback only after a complete form is submitted.
-- It cannot write an attempt, XP or a module pass.
create or replace function public.preview_exam(p_exam_id text,p_form text,p_answers jsonb) returns jsonb
language sql security definer set search_path='' as $$select autoquest_private.mark_exam(p_exam_id,p_form,p_answers);$$;

create or replace function public.start_exam(p_exam_id text,p_mode text,p_event_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();a autoquest_private.exam_attempts%rowtype;f text;n integer;
begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 if p_mode is null or p_mode not in ('practice','validation') or p_event_id is null or not exists(select 1 from public.module_exams where id=p_exam_id) then raise exception 'Invalid exam start';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));perform autoquest_private.ensure_profile(u);
 select * into a from autoquest_private.exam_attempts where user_id=u and id=p_event_id;
 if found then
  if a.exam_id<>p_exam_id or a.mode<>p_mode then raise exception 'Exam event ID reused';end if;
 else
  if p_mode='validation' and not autoquest_private.exam_ready(u,p_exam_id) then raise exception 'Complete module lessons before validation';end if;
  select count(*) into n from autoquest_private.exam_attempts where user_id=u and exam_id=p_exam_id;
  f:=case when n%2=0 then 'A' else 'B' end;
  insert into autoquest_private.exam_attempts(user_id,id,exam_id,form,mode) values(u,p_event_id,p_exam_id,f,p_mode) returning * into a;
 end if;
 return jsonb_strip_nulls(jsonb_build_object('attemptId',a.id,'examId',a.exam_id,'form',a.form,'mode',a.mode,'startedAt',a.started_at,'result',a.result));
end$$;

create or replace function public.finish_exam(p_attempt_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();a autoquest_private.exam_attempts%rowtype;marked jsonb;threshold_ integer;result_ jsonb;
begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select * into a from autoquest_private.exam_attempts where user_id=u and id=p_attempt_id;
 if not found then raise exception 'Unknown exam attempt';end if;
 if a.result is not null then
  if a.result->'answers' is distinct from p_answers then raise exception 'Exam attempt reused with different answers';end if;
  return jsonb_build_object('result',a.result,'state',autoquest_private.snapshot(u),'duplicate',true);
 end if;
 if a.mode='validation' and not autoquest_private.exam_ready(u,a.exam_id) then raise exception 'Module no longer ready';end if;
 marked:=autoquest_private.mark_exam(a.exam_id,a.form,p_answers);
 select threshold into threshold_ from public.module_exams where id=a.exam_id;
 result_:=marked||jsonb_build_object('attemptId',a.id,'examId',a.exam_id,'form',a.form,'mode',a.mode,'passed',a.mode='validation' and (marked->>'score')::numeric>=threshold_,'at',now(),'answers',p_answers);
 update autoquest_private.exam_attempts set result=result_,finished_at=now() where user_id=u and id=a.id;
 update public.learner_stats set revision=revision+1,updated_at=now() where user_id=u;
 return jsonb_build_object('result',result_,'state',autoquest_private.snapshot(u));
end$$;

create or replace function public.save_notebook(p_lesson_id text,p_body text,p_checks jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$declare u uuid:=auth.uid();begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 if p_body is null or char_length(p_body)>16000 or p_checks is null or jsonb_typeof(p_checks)<>'array' or jsonb_array_length(p_checks)<>6 or exists(select 1 from jsonb_array_elements(p_checks)c where jsonb_typeof(c)<>'boolean') or not exists(select 1 from public.lessons where id=p_lesson_id) then raise exception 'Invalid notebook';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));perform autoquest_private.ensure_profile(u);
 insert into public.lesson_notebooks values(u,p_lesson_id,p_body,p_checks,now()) on conflict(user_id,lesson_id) do update set body=excluded.body,checks=excluded.checks,updated_at=excluded.updated_at;
 update public.learner_stats set revision=revision+1,updated_at=now() where user_id=u;
 return autoquest_private.snapshot(u);
end$$;

create or replace function autoquest_private.snapshot(p_user uuid) returns jsonb
language sql security definer set search_path='' as $$
select jsonb_build_object(
 'version',1,'contentVersion',(select content_version from public.app_metadata where id=1),'serverRevision',s.revision,
 'profile',jsonb_build_object('displayName',p.display_name,'locale',p.locale,'timezone',p.timezone,'leaderboardOptIn',p.leaderboard_opt_in),
 'xp',s.total_xp,
 'completed',coalesce((select jsonb_agg(lesson_id order by lesson_id) from public.lesson_progress where user_id=p_user and status='completed'),'[]'::jsonb),
 'started',coalesce((select jsonb_agg(lesson_id order by lesson_id) from public.lesson_progress where user_id=p_user),'[]'::jsonb),
 'correct',coalesce((select jsonb_agg(aid) from (select distinct a.activity_id as aid from autoquest_private.attempts a join public.activities c on c.id=a.activity_id and c.revision=a.activity_revision where a.user_id=p_user and a.outcome='correct')q),'[]'::jsonb),
 'reviews',coalesce((select jsonb_object_agg(activity_id,jsonb_build_object('dueAt',due_at,'intervalDays',interval_days,'streak',streak,'lastOutcome',last_outcome)) from public.review_schedule where user_id=p_user),'{}'::jsonb),
 'daily',coalesce((select jsonb_object_agg(local_date::text,attempt_count) from public.daily_activity where user_id=p_user),'{}'::jsonb),
 'garage',coalesce((select jsonb_object_agg(step_id,jsonb_build_object('status',status,'evidenceUrl',evidence_url,'reflection',reflection,'updatedAt',updated_at)) from public.project_progress where user_id=p_user),'{}'::jsonb),
 'notebooks',coalesce((select jsonb_object_agg(lesson_id,jsonb_build_object('body',body,'checks',checks,'updatedAt',updated_at)) from public.lesson_notebooks where user_id=p_user),'{}'::jsonb),
 'exams',coalesce((select jsonb_object_agg(exam_id,item) from (
  select exam_id,jsonb_build_object('attempts',count(*),'bestScore',max((result->>'score')::numeric),'passed',bool_or((result->>'passed')::boolean),'lastResult',(array_agg(result order by finished_at desc,id desc))[1])item
  from autoquest_private.exam_attempts where user_id=p_user and result is not null group by exam_id
 )e),'{}'::jsonb),
 'badges',coalesce((select jsonb_agg(badge_id) from public.user_badges where user_id=p_user),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(item order by at) from (
   select a.created_at as at,jsonb_build_object('eventId',a.event_id,'activityId',a.activity_id,'response',a.response,'outcome',a.outcome,'at',a.created_at,'points',coalesce(x.points,0)) as item
   from autoquest_private.attempts a left join autoquest_private.xp_events x on x.attempt_id=a.id where a.user_id=p_user order by a.created_at desc,a.id limit 100
 )h),'[]'::jsonb)
) from public.profiles p join public.learner_stats s on s.user_id=p.id where p.id=p_user;
$$;


revoke all on all functions in schema autoquest_private from public,anon,authenticated;
revoke all on function public.preview_exam(text,text,jsonb),public.start_exam(text,text,uuid),public.finish_exam(uuid,jsonb),public.save_notebook(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.preview_exam(text,text,jsonb) to anon,authenticated;
grant execute on function public.start_exam(text,text,uuid),public.finish_exam(uuid,jsonb),public.save_notebook(text,text,jsonb) to authenticated;
commit;
