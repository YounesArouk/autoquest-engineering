-- AutoQuest v1. Dedicated Supabase project; execute before 002_seed.sql.
-- Scores and answer validation run inside Postgres, never from client values.
begin;
create schema if not exists autoquest_private;
revoke all on schema autoquest_private from public, anon, authenticated;

create table if not exists public.app_metadata(id integer primary key check(id=1),content_version text not null);
create table if not exists public.modules(id text primary key,position integer unique not null,title jsonb not null);
create table if not exists public.lessons(
 id text primary key,module_id text not null references public.modules(id),source_day integer unique not null,
 title jsonb not null,content_revision integer not null default 1
);
create table if not exists public.activities(
 id text primary key,lesson_id text not null references public.lessons(id),
 kind text not null check(kind in ('single_choice','numeric','ordering','matching','open_response')),
 points integer not null check(points between 0 and 100),required boolean not null,revision integer not null,
 settings jsonb not null,choices jsonb not null,
 check(kind<>'open_response' or (points=0 and not required))
);
create table if not exists autoquest_private.activity_solutions(
 activity_id text primary key references public.activities(id),answer jsonb not null,rubric jsonb not null,explanation jsonb not null
);
create table if not exists public.project_steps(id text primary key,day integer unique not null,title jsonb not null);
create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 30),
 locale text not null default 'fr' check(locale in ('fr','en')),timezone text not null default 'UTC',
 leaderboard_opt_in boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists public.learner_stats(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 total_xp integer not null default 0 check(total_xp>=0),completed_count integer not null default 0 check(completed_count>=0),
 revision bigint not null default 0,updated_at timestamptz not null default now()
);
create table if not exists autoquest_private.attempts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 activity_id text not null references public.activities(id),activity_revision integer not null,
 event_id uuid not null,response jsonb not null,outcome text not null check(outcome in ('correct','incorrect','pending_review')),
 created_at timestamptz not null default now(),unique(user_id,event_id)
);
create table if not exists autoquest_private.xp_events(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 activity_id text not null references public.activities(id),activity_revision integer not null,
 attempt_id uuid not null references autoquest_private.attempts(id) on delete cascade,points integer not null check(points>0),
 unique(user_id,activity_id,activity_revision)
);
create table if not exists public.lesson_progress(
 user_id uuid not null references public.profiles(id) on delete cascade,lesson_id text not null references public.lessons(id),
 status text not null check(status in ('started','completed')),completed_at timestamptz,
 primary key(user_id,lesson_id),check((status='completed')=(completed_at is not null))
);
create table if not exists public.review_schedule(
 user_id uuid not null references public.profiles(id) on delete cascade,activity_id text not null references public.activities(id),
 due_at timestamptz not null,interval_days integer not null check(interval_days between 1 and 30),
 streak integer not null check(streak>=0),last_outcome text not null check(last_outcome in ('correct','incorrect')),
 primary key(user_id,activity_id)
);
create table if not exists public.daily_activity(
 user_id uuid not null references public.profiles(id) on delete cascade,local_date date not null,
 attempt_count integer not null check(attempt_count>0),primary key(user_id,local_date)
);
create table if not exists public.project_progress(
 user_id uuid not null references public.profiles(id) on delete cascade,step_id text not null references public.project_steps(id),
 status text not null default 'submitted' check(status in ('submitted','reviewed')),
 evidence_url text not null,reflection text not null,updated_at timestamptz not null default now(),
 primary key(user_id,step_id)
);
create table if not exists public.user_badges(
 user_id uuid not null references public.profiles(id) on delete cascade,badge_id text not null,
 awarded_at timestamptz not null default now(),primary key(user_id,badge_id)
);
create index if not exists aq_attempt_lookup on autoquest_private.attempts(user_id,activity_id,activity_revision,outcome);
create index if not exists aq_attempt_history on autoquest_private.attempts(user_id,created_at desc);
create index if not exists aq_reviews_due on public.review_schedule(user_id,due_at);

-- Every exposed table has RLS. Profiles/stats/progress have SELECT-own only.
do $$declare t text;begin
 foreach t in array array['app_metadata','modules','lessons','activities','project_steps'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to anon,authenticated',t);
  execute format('drop policy if exists aq_content_read on public.%I',t);
  execute format('create policy aq_content_read on public.%I for select to anon,authenticated using(true)',t);
 end loop;
 foreach t in array array['profiles','learner_stats','lesson_progress','review_schedule','daily_activity','project_progress','user_badges'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('drop policy if exists aq_own_read on public.%I',t);
  execute format('create policy aq_own_read on public.%I for select to authenticated using((select auth.uid())=%I)',t,case when t='profiles' then 'id' else 'user_id' end);
 end loop;
end$$;
revoke all on all tables in schema autoquest_private from public,anon,authenticated;

create or replace function autoquest_private.ensure_profile(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$begin
 insert into public.profiles(id,display_name) values(p_user,'Pilote-'||left(p_user::text,6)) on conflict do nothing;
 insert into public.learner_stats(user_id) values(p_user) on conflict do nothing;
end$$;
create or replace function autoquest_private.on_new_user() returns trigger
language plpgsql security definer set search_path='' as $$begin
 perform autoquest_private.ensure_profile(new.id);return new;
end$$;
drop trigger if exists autoquest_new_user on auth.users;
create trigger autoquest_new_user after insert on auth.users for each row execute function autoquest_private.on_new_user();

create or replace function autoquest_private.award_badges(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare n integer;d date;begin
 select count(*) into n from public.lesson_progress where user_id=p_user and status='completed';
 if n>=1 then insert into public.user_badges values(p_user,'first_lesson',now()) on conflict do nothing;end if;
 if n>=10 then insert into public.user_badges values(p_user,'ten_lessons',now()) on conflict do nothing;end if;
 if (select count(*) from public.lesson_progress p join public.lessons l on l.id=p.lesson_id where p.user_id=p_user and p.status='completed' and l.module_id='module_01')=35 then
  insert into public.user_badges values(p_user,'mechanical_complete',now()) on conflict do nothing;
 end if;
 select timezone(p.timezone,now())::date into d from public.profiles p where id=p_user;
 if (select count(*) from public.daily_activity where user_id=p_user and local_date between d-6 and d)=7 then
  insert into public.user_badges values(p_user,'streak_7',now()) on conflict do nothing;
 end if;
 if (select count(*) from public.project_progress where user_id=p_user)>=20 then
  insert into public.user_badges values(p_user,'ecity_submitted',now()) on conflict do nothing;
 end if;
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
 'badges',coalesce((select jsonb_agg(badge_id) from public.user_badges where user_id=p_user),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(item order by at) from (
   select a.created_at as at,jsonb_build_object('eventId',a.event_id,'activityId',a.activity_id,'response',a.response,'outcome',a.outcome,'at',a.created_at,'points',coalesce(x.points,0)) as item
   from autoquest_private.attempts a left join autoquest_private.xp_events x on x.attempt_id=a.id where a.user_id=p_user order by a.created_at desc,a.id limit 100
 )h),'[]'::jsonb)
) from public.profiles p join public.learner_stats s on s.user_id=p.id where p.id=p_user;
$$;

create or replace function public.get_my_state() returns jsonb
language plpgsql security definer set search_path='' as $$declare u uuid:=auth.uid();begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 perform autoquest_private.ensure_profile(u);return autoquest_private.snapshot(u);
end$$;

create or replace function public.save_profile(p_display_name text,p_locale text,p_timezone text,p_leaderboard_opt_in boolean) returns jsonb
language plpgsql security definer set search_path='' as $$declare u uuid:=auth.uid();begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 if char_length(trim(coalesce(p_display_name,''))) not between 2 and 30 or p_display_name ~ '[[:cntrl:]]' or p_locale not in ('fr','en') or p_locale is null or p_leaderboard_opt_in is null then raise exception 'Invalid profile' using errcode='22023';end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 perform autoquest_private.ensure_profile(u);
 update public.profiles set display_name=trim(p_display_name),locale=p_locale,timezone=p_timezone,leaderboard_opt_in=p_leaderboard_opt_in where id=u;
 update public.learner_stats set revision=revision+1,updated_at=now() where user_id=u;
 return autoquest_private.snapshot(u);
end$$;

create or replace function autoquest_private.grade_activity(p_activity_id text,p_response jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.activities%rowtype;sol autoquest_private.activity_solutions%rowtype;ok boolean:=false;outcome_ text;value_ numeric;count_ integer;
begin
 if p_response is null or octet_length(p_response::text)>12000 then raise exception 'Invalid submission' using errcode='22023';end if;
 select * into a from public.activities where id=p_activity_id;
 if not found then raise exception 'Unknown activity' using errcode='22023';end if;
 select * into sol from autoquest_private.activity_solutions where activity_id=a.id;
 if not found then raise exception 'Missing answer definition';end if;
 if a.kind='single_choice' then
  if jsonb_typeof(p_response)<>'string' or not exists(select 1 from jsonb_array_elements(a.choices)c where c->>'id'=p_response#>>'{}') then raise exception 'Invalid choice ID' using errcode='22023';end if;
  ok:=(p_response#>>'{}')=sol.answer->>'choice_id';
 elsif a.kind='numeric' then
  if jsonb_typeof(p_response)<>'object' or not(p_response?'value') or p_response->>'unit' is distinct from sol.answer->>'unit' then raise exception 'Invalid number or unit' using errcode='22023';end if;
  if jsonb_typeof(p_response->'value') not in ('number','string') or not(replace(trim(p_response->>'value'),',','.') ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$') then raise exception 'Finite number required' using errcode='22023';end if;
  value_:=replace(trim(p_response->>'value'),',','.')::numeric;
  ok:=abs(value_-(sol.answer->>'value')::numeric)<=(sol.answer->>'abs_tolerance')::numeric;
 elsif a.kind='ordering' then
  if jsonb_typeof(p_response)<>'array' then raise exception 'Array required' using errcode='22023';end if;
  count_:=jsonb_array_length(sol.answer->'ordered_ids');
  if jsonb_array_length(p_response)<>count_ or (select count(distinct v) from jsonb_array_elements(p_response)v)<>count_ or not(p_response @> (sol.answer->'ordered_ids')) then raise exception 'Use every item exactly once' using errcode='22023';end if;
  ok:=p_response=sol.answer->'ordered_ids';
 elsif a.kind='matching' then
  if jsonb_typeof(p_response)<>'object' then raise exception 'Object required' using errcode='22023';end if;
  count_:=(select count(*) from jsonb_object_keys(sol.answer->'pairs'));
  if (select count(*) from jsonb_object_keys(p_response))<>count_ or exists(select 1 from jsonb_object_keys(sol.answer->'pairs')k where not(p_response?k)) or
     (select count(distinct v) from jsonb_each_text(p_response)e(k,v))<>count_ or
     exists(select 1 from jsonb_each_text(p_response)e(k,v) where not exists(select 1 from jsonb_array_elements(a.settings->'right')ri(item) where ri.item->>'id'=e.v)) then raise exception 'Invalid one-to-one pairs' using errcode='22023';end if;
  ok:=p_response=sol.answer->'pairs';
 else
  if jsonb_typeof(p_response)<>'string' or char_length(trim(p_response#>>'{}')) not between 1 and 4000 then raise exception 'Write a response' using errcode='22023';end if;
 end if;
 outcome_:=case when a.kind='open_response' then 'pending_review' when ok then 'correct' else 'incorrect' end;
 return jsonb_build_object('outcome',outcome_,'explanation',sol.explanation,'rubric',sol.rubric);
end$$;

create or replace function public.grade_preview(p_activity_id text,p_response jsonb) returns jsonb
language sql security definer set search_path='' as $$
 select autoquest_private.grade_activity(p_activity_id,p_response);
$$;

create or replace function public.submit_answer(p_activity_id text,p_response jsonb,p_event_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid();a public.activities%rowtype;sol autoquest_private.activity_solutions%rowtype;
 previous autoquest_private.attempts%rowtype;r public.review_schedule%rowtype;
 ok boolean:=false;outcome_ text;value_ numeric;count_ integer;points_ integer:=0;attempt_ uuid;
 interval_ integer;streak_ integer;local_day date;
begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 if p_event_id is null or p_response is null or octet_length(p_response::text)>12000 then raise exception 'Invalid submission' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 perform autoquest_private.ensure_profile(u);
 select * into a from public.activities where id=p_activity_id;
 if not found then raise exception 'Unknown activity' using errcode='22023';end if;
 select * into sol from autoquest_private.activity_solutions where activity_id=a.id;
 if not found then raise exception 'Missing answer definition';end if;
 select * into previous from autoquest_private.attempts where user_id=u and event_id=p_event_id;
 if found then
  if previous.activity_id<>p_activity_id or previous.response<>p_response then raise exception 'Event ID reused with different response' using errcode='22023';end if;
  return jsonb_build_object('outcome',previous.outcome,'awardedXp',0,'duplicate',true,'explanation',sol.explanation,'rubric',sol.rubric,'state',autoquest_private.snapshot(u));
 end if;
 outcome_:=autoquest_private.grade_activity(p_activity_id,p_response)->>'outcome';
 insert into autoquest_private.attempts(user_id,activity_id,activity_revision,event_id,response,outcome)
 values(u,a.id,a.revision,p_event_id,p_response,outcome_) returning id into attempt_;
 if outcome_='correct' and a.points>0 then
  insert into autoquest_private.xp_events(user_id,activity_id,activity_revision,attempt_id,points) values(u,a.id,a.revision,attempt_,a.points)
  on conflict do nothing returning points into points_;
  points_:=coalesce(points_,0);
 end if;
 insert into public.lesson_progress(user_id,lesson_id,status) values(u,a.lesson_id,'started') on conflict do nothing;
 if not exists(select 1 from public.activities c where c.lesson_id=a.lesson_id and c.required and not exists(
  select 1 from autoquest_private.attempts t where t.user_id=u and t.activity_id=c.id and t.activity_revision=c.revision and t.outcome='correct'
 )) then update public.lesson_progress set status='completed',completed_at=coalesce(completed_at,now()) where user_id=u and lesson_id=a.lesson_id;end if;
 if outcome_<>'pending_review' then
  select * into r from public.review_schedule where user_id=u and activity_id=a.id;
  if not(outcome_='correct' and r.last_outcome='correct' and r.due_at>now()) or r.user_id is null then
   interval_:=case when outcome_='incorrect' then 1 when r.last_outcome='correct' then least(30,r.interval_days*2) else 1 end;
   streak_:=case when outcome_='correct' then coalesce(r.streak,0)+1 else 0 end;
   insert into public.review_schedule values(u,a.id,now()+interval_*interval '1 day',interval_,streak_,outcome_)
   on conflict(user_id,activity_id) do update set due_at=excluded.due_at,interval_days=excluded.interval_days,streak=excluded.streak,last_outcome=excluded.last_outcome;
  end if;
 end if;
 select timezone(p.timezone,now())::date into local_day from public.profiles p where id=u;
 insert into public.daily_activity values(u,local_day,1) on conflict(user_id,local_date) do update set attempt_count=public.daily_activity.attempt_count+1;
 update public.learner_stats set total_xp=total_xp+points_,completed_count=(select count(*) from public.lesson_progress where user_id=u and status='completed'),revision=revision+1,updated_at=now() where user_id=u;
 perform autoquest_private.award_badges(u);
 return jsonb_build_object('outcome',outcome_,'awardedXp',points_,'duplicate',false,'explanation',sol.explanation,'rubric',sol.rubric,'state',autoquest_private.snapshot(u));
end$$;

create or replace function public.submit_mission(p_step_id text,p_evidence_url text,p_reflection text) returns jsonb
language plpgsql security definer set search_path='' as $$declare u uuid:=auth.uid();begin
 if u is null then raise exception 'Authentication required' using errcode='28000';end if;
 if not exists(select 1 from public.project_steps where id=p_step_id) or char_length(coalesce(p_evidence_url,'')) not between 9 and 2048 or p_evidence_url !~ '^https://[^[:space:]]+$' or char_length(trim(coalesce(p_reflection,''))) not between 1 and 4000 then raise exception 'Invalid mission submission' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));perform autoquest_private.ensure_profile(u);
 insert into public.project_progress(user_id,step_id,evidence_url,reflection) values(u,p_step_id,p_evidence_url,trim(p_reflection))
 on conflict(user_id,step_id) do update set status='submitted',evidence_url=excluded.evidence_url,reflection=excluded.reflection,updated_at=now();
 update public.learner_stats set revision=revision+1,updated_at=now() where user_id=u;
 perform autoquest_private.award_badges(u);return autoquest_private.snapshot(u);
end$$;

create or replace function public.get_leaderboard(p_limit integer default 20) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(item order by n),'[]'::jsonb) from (
  select row_number() over(order by s.total_xp desc,s.completed_count desc,p.created_at,p.id) as n,
  jsonb_build_object('rank',row_number() over(order by s.total_xp desc,s.completed_count desc,p.created_at,p.id),'displayName',p.display_name,'xp',s.total_xp,'completed',s.completed_count,'isMe',coalesce(p.id=auth.uid(),false)) as item
  from public.profiles p join public.learner_stats s on s.user_id=p.id where p.leaderboard_opt_in
  order by s.total_xp desc,s.completed_count desc,p.created_at,p.id limit greatest(1,least(coalesce(p_limit,20),50))
 )r;
$$;
revoke all on all functions in schema autoquest_private from public,anon,authenticated;
revoke all on function public.get_my_state() from public,anon;
revoke all on function public.save_profile(text,text,text,boolean) from public,anon;
revoke all on function public.submit_answer(text,jsonb,uuid) from public,anon;
revoke all on function public.submit_mission(text,text,text) from public,anon;
revoke all on function public.get_leaderboard(integer) from public;
revoke all on function public.grade_preview(text,jsonb) from public;
grant execute on function public.get_my_state(),public.save_profile(text,text,text,boolean),public.submit_answer(text,jsonb,uuid),public.submit_mission(text,text,text) to authenticated;
grant execute on function public.get_leaderboard(integer),public.grade_preview(text,jsonb) to anon,authenticated;

-- Realtime improves cross-device refresh; polling/focus refresh remains active.
do $$begin
 if exists(select 1 from pg_catalog.pg_publication where pubname='supabase_realtime') then
  begin execute 'alter publication supabase_realtime add table public.learner_stats';exception when duplicate_object then null;end;
 end if;
end$$;
commit;
