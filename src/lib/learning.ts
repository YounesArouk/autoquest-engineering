import type {Activity,Answer,Catalog,GradeResult,Lang,Outcome,Progress,Solution} from './types';

export function localDate(date=new Date(),timezone='UTC') {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(key=>parts.find(p=>p.type===key)!.value).join('-');
}
export function shiftDay(day:string,offset:number) {
  const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);
}
export function activeStreak(daily:Record<string,number>,today:string) {
  let day=daily[today]?today:shiftDay(today,-1),count=0;
  while(daily[day]){count++;day=shiftDay(day,-1);}return count;
}
export function levelFor(xp:number){return Math.floor(xp/200)+1;}
export function parseDecimal(raw:unknown):number|null {
  if(typeof raw==='number')return Number.isFinite(raw)?raw:null;
  if(typeof raw!=='string')return null;
  const normalized=raw.trim().replace(',','.');
  if(!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$/.test(normalized))return null;
  const value=Number(normalized);return Number.isFinite(value)?value:null;
}
export function emptyProgress(contentVersion:string,timezone='UTC'):Progress {
  return {version:1,contentVersion,profile:{displayName:'Pilote',locale:'fr',timezone,leaderboardOptIn:false},notebooks:{},exams:{},xp:0,completed:[],started:[],correct:[],reviews:{},daily:{},garage:{},badges:[],history:[]};
}
export function uuid() {
  if(typeof crypto!=='undefined' && 'randomUUID' in crypto)return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=typeof crypto!=='undefined'?crypto.getRandomValues(new Uint8Array(1))[0]%16:Math.floor(Math.random()*16);
    return (c==='x'?r:(r&3)|8).toString(16);
  });
}
export function gradeLocal(activity:Activity,response:Answer,solution:Solution):{outcome:Outcome;explanation:Solution['explanation'];rubric?:Solution['rubric']} {
  const expected=solution.answer;let correct=false;
  switch(activity.kind) {
    case 'single_choice':
      if(typeof response!=='string'||!activity.choices.some(x=>x.id===response))throw new Error('Invalid choice ID');
      correct=response===expected.choice_id;break;
    case 'numeric': {
      if(!response||typeof response!=='object'||Array.isArray(response)||!('value' in response)||!('unit' in response))throw new Error('Invalid numeric response');
      const raw=response.value;
      if((typeof raw!=='number'&&typeof raw!=='string')||(typeof raw==='string'&&!raw.trim())||response.unit!==expected.unit)throw new Error('Invalid number or unit');
      const value=parseDecimal(raw);
      if(value===null)throw new Error('Finite decimal number required');
      correct=Math.abs(value-Number(expected.value))<=Number(expected.abs_tolerance);break;
    }
    case 'ordering': {
      const ids=activity.settings.items!.map(x=>x.id);
      if(!Array.isArray(response)||response.length!==ids.length||new Set(response).size!==ids.length||!response.every(x=>ids.includes(x)))throw new Error('Use every item exactly once');
      correct=JSON.stringify(response)===JSON.stringify(expected.ordered_ids);break;
    }
    case 'matching': {
      if(!response||typeof response!=='object'||Array.isArray(response))throw new Error('Invalid pairs');
      const r=response as Record<string,string>,left=activity.settings.left!.map(x=>x.id),right=activity.settings.right!.map(x=>x.id);
      if(Object.keys(r).length!==left.length||!left.every(x=>Object.hasOwn(r,x))||new Set(Object.values(r)).size!==right.length||!Object.values(r).every(x=>right.includes(x)))throw new Error('Complete each pair exactly once');
      const pairs=expected.pairs as Record<string,string>;
      correct=left.every(key=>r[key]===pairs[key]);break;
    }
    case 'open_response':
      if(typeof response!=='string'||!response.trim()||response.length>4000)throw new Error('Write a response, maximum 4000 characters');
      return {outcome:'pending_review',explanation:solution.explanation,rubric:solution.rubric};
  }
  return {outcome:correct?'correct':'incorrect',explanation:solution.explanation};
}
export function awardLocalBadges(state:Progress,catalog:Catalog,today:string) {
  const add=(id:string)=>{if(!state.badges.includes(id))state.badges.push(id);};
  if(state.completed.length>=1)add('first_lesson');
  if(state.completed.length>=10)add('ten_lessons');
  if(Array.from({length:7},(_,i)=>shiftDay(today,-i)).every(d=>state.daily[d]))add('streak_7');
  if(catalog.lessons.filter(l=>l.moduleId==='module_01').every(l=>state.completed.includes(l.id)))add('mechanical_complete');
  if(Object.keys(state.garage).length>=20)add('ecity_submitted');
}
export function applyLocalAttempt(previous:Progress,catalog:Catalog,activity:Activity,response:Answer,solution:Solution,eventId:string,now=new Date()):GradeResult {
  return applyGradedAttempt(previous,catalog,activity,response,gradeLocal(activity,response,solution),eventId,now);
}
export function applyGradedAttempt(previous:Progress,catalog:Catalog,activity:Activity,response:Answer,grading:Pick<GradeResult,'outcome'|'explanation'|'rubric'>,eventId:string,now=new Date()):GradeResult {
  const old=previous.history.find(x=>x.eventId===eventId);
  if(old) {
    if(old.activityId!==activity.id||JSON.stringify(old.response)!==JSON.stringify(response))throw new Error('Event ID reused with different response');
    return {outcome:old.outcome,explanation:grading.explanation,awardedXp:0,state:previous,duplicate:true};
  }
  const result=grading,state=structuredClone(previous),at=now.toISOString();
  let awardedXp=0;
  if(result.outcome==='correct'&&!state.correct.includes(activity.id)) {
    awardedXp=activity.points;state.xp+=awardedXp;state.correct.push(activity.id);
  }
  if(!state.started.includes(activity.lessonId))state.started.push(activity.lessonId);
  const lesson=catalog.lessons.find(x=>x.id===activity.lessonId)!;
  if(lesson.requiredIds.every(x=>state.correct.includes(x))&&!state.completed.includes(lesson.id))state.completed.push(lesson.id);
  if(result.outcome!=='pending_review') {
    const last=state.reviews[activity.id];
    if(!(result.outcome==='correct'&&last?.lastOutcome==='correct'&&new Date(last.dueAt)>now)) {
      const intervalDays=result.outcome==='incorrect'?1:last?.lastOutcome==='correct'?Math.min(30,last.intervalDays*2):1;
      state.reviews[activity.id]={dueAt:new Date(now.getTime()+intervalDays*86400000).toISOString(),intervalDays,streak:result.outcome==='correct'?(last?.streak??0)+1:0,lastOutcome:result.outcome};
    }
  }
  const today=localDate(now,state.profile.timezone);state.daily[today]=(state.daily[today]??0)+1;
  state.history.push({eventId,activityId:activity.id,response,outcome:result.outcome,at,points:awardedXp});
  awardLocalBadges(state,catalog,today);
  return {...result,awardedXp,state};
}
export function safeExternalUrl(value:string) {
  try {const u=new URL(value);return u.protocol==='https:'&&!!u.hostname;}catch{return false;}
}
export function isProgress(value:unknown):value is Progress {
  if(!value||typeof value!=='object')return false;
  const v=value as Partial<Progress>;
  return v.version===1&&typeof v.xp==='number'&&Number.isFinite(v.xp)&&Array.isArray(v.completed)&&Array.isArray(v.correct)&&Array.isArray(v.history)&&!!v.profile&&!!v.daily&&!!v.reviews&&!!v.garage;
}

/** Preserve v1 demo work while reopening lessons that gained required engineering exercises. */
export function migrateV1Progress(old:Progress,catalog:Catalog):Progress{
 const state=emptyProgress(catalog.version,old.profile.timezone);state.profile=old.profile;
 const ids=new Set(catalog.activities.map(a=>a.id));state.correct=Array.from(new Set(old.correct.filter(id=>ids.has(id))));
 state.xp=catalog.activities.filter(a=>state.correct.includes(a.id)).reduce((sum,a)=>sum+a.points,0);
 state.started=Array.from(new Set([...old.started,...old.completed])).filter(id=>catalog.lessons.some(l=>l.id===id));
 state.completed=catalog.lessons.filter(l=>l.requiredIds.every(id=>state.correct.includes(id))).map(l=>l.id);
 state.reviews=Object.fromEntries(Object.entries(old.reviews).filter(([id])=>ids.has(id)));state.daily=old.daily;state.garage=old.garage;
 state.history=old.history.filter(h=>ids.has(h.activityId));awardLocalBadges(state,catalog,localDate(new Date(),state.profile.timezone));return state;
}
