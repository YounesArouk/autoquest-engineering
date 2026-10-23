'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import {catalog,loadExam} from '@/lib/catalog';
import {applyExamResult,canValidateExam,gradeExam,validateNotebook} from '@/lib/exams';
import {uuid} from '@/lib/learning';
import type {ExamAnswerSet,ExamResult,ExamSession} from '@/lib/types';
import {applyGradedAttempt,applyLocalAttempt,awardLocalBadges,emptyProgress,isProgress,localDate,migrateV1Progress,safeExternalUrl} from '@/lib/learning';
import {cloudConfigured,supabase} from '@/lib/supabase';
import type {Activity,Answer,GradeResult,Lang,Progress,Solution} from '@/lib/types';

const STORAGE='autoquest:engineering:demo:v2',LANG_KEY='autoquest:language';
type Profile=Progress['profile'];
type ContextValue={
  lang:Lang;setLang:(lang:Lang)=>void;tr:(fr:string,en:string)=>string;
  progress:Progress;ready:boolean;session:Session|null;mode:'demo'|'cloud';cloudConfigured:boolean;
  syncBusy:boolean;syncError:boolean;refresh:()=>Promise<void>;
  submit:(activity:Activity,response:Answer,eventId:string)=>Promise<GradeResult>;
  submitMission:(id:string,url:string,reflection:string)=>Promise<void>;
  saveNotebook:(id:string,body:string,checks:boolean[])=>Promise<void>;
  startExam:(id:string,mode:ExamSession['mode'],eventId?:string)=>Promise<ExamSession>;
  finishExam:(exam:ExamSession,answers:ExamAnswerSet)=>Promise<ExamResult>;
  saveProfile:(profile:Profile)=>Promise<void>;resetDemo:()=>void;
  notify:(fr:string,en?:string)=>void;search:string;setSearch:(value:string)=>void;
  recovery:boolean;setRecovery:(value:boolean)=>void;
};
const Context=createContext<ContextValue|null>(null);
let solutionPromise:Promise<Record<string,Solution>>|null=null;
async function demoSolutions(){
  if(!solutionPromise)solutionPromise=fetch('/data/demo-solutions.json').then(r=>{if(!r.ok)throw new Error('Demo answers unavailable');return r.json();}).catch(e=>{solutionPromise=null;throw e;});
  return solutionPromise;
}
function readDemo():Progress {
  const raw=localStorage.getItem(STORAGE);
  if(raw){const data=JSON.parse(raw);if(isProgress(data)&&data.contentVersion===catalog.version)return data;}
  const previous=localStorage.getItem('autoquest:demo:v1');
  if(previous){try{const old=JSON.parse(previous);if(isProgress(old)&&old.contentVersion==='1.0.0'){const upgraded=migrateV1Progress(old,catalog);localStorage.setItem(STORAGE,JSON.stringify(upgraded));return upgraded;}}catch{}}
  const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
  return emptyProgress(catalog.version,timezone);
}
export function Provider({children}:{children:ReactNode}) {
  const [lang,setLangState]=useState<Lang>('fr'),[progress,setProgress]=useState<Progress>(()=>emptyProgress(catalog.version));
  const [ready,setReady]=useState(false),[session,setSession]=useState<Session|null>(null);
  const [syncBusy,setSyncBusy]=useState(false),[syncError,setSyncError]=useState(false),[recovery,setRecovery]=useState(false);
  const [toast,setToast]=useState(''),[search,setSearch]=useState('');
  const progressRef=useRef(progress),ownerRef=useRef<string|null>(null),mounted=useRef(true),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  progressRef.current=progress;
  const tr=useCallback((fr:string,en:string)=>lang==='fr'?fr:en,[lang]);
  const notify=useCallback((fr:string,en?:string)=>{
    setToast(lang==='fr'?fr:en||fr);
    if(toastTimer.current)clearTimeout(toastTimer.current);
    toastTimer.current=setTimeout(()=>setToast(''),5000);
  },[lang]);
  const setLang=useCallback((value:Lang)=>{setLangState(value);try{localStorage.setItem(LANG_KEY,value);}catch{}},[]);
  const persistDemo=useCallback((state:Progress)=>{
    try{localStorage.setItem(STORAGE,JSON.stringify(state));}
    catch{throw new Error('Stockage local indisponible. / Local storage unavailable.');}
    progressRef.current=state;setProgress(state);
  },[]);
  const acceptCloud=useCallback((state:unknown,owner:string)=>{
    if(ownerRef.current!==owner||!mounted.current)return;
    if(!isProgress(state)||state.contentVersion!==catalog.version)throw new Error('Content version mismatch');
    if((state.serverRevision??0)>=(progressRef.current.serverRevision??-1)){
      progressRef.current=state;setProgress(state);
    }
    setSyncError(false);
  },[]);
  const refresh=useCallback(async()=>{
    const owner=ownerRef.current,client=supabase();
    if(!owner||!client)return;
    setSyncBusy(true);
    try{
      const {data,error}=await client.rpc('get_my_state');
      if(error)throw error;
      acceptCloud(data,owner);
    }catch{if(ownerRef.current===owner)setSyncError(true);}
    finally{if(mounted.current){setSyncBusy(false);setReady(true);}}
  },[acceptCloud]);
  useEffect(()=>{
    mounted.current=true;
    try{const stored=localStorage.getItem(LANG_KEY);if(stored==='fr'||stored==='en')setLangState(stored);const demo=readDemo();progressRef.current=demo;setProgress(demo);}catch{}
    const client=supabase();
    if(!client){setReady(true);return;}
    const {data:listener}=client.auth.onAuthStateChange((event,next)=>{
      ownerRef.current=next?.user.id??null;
      setSession(next);
      if(event==='PASSWORD_RECOVERY')setRecovery(true);
      if(!next)setReady(true);
    });
    client.auth.getSession().then(({data,error})=>{
      if(!mounted.current)return;
      if(error)setSyncError(true);
      ownerRef.current=data.session?.user.id??null;setSession(data.session);
      if(!data.session)setReady(true);
    });
    return()=>{mounted.current=false;listener.subscription.unsubscribe();if(toastTimer.current)clearTimeout(toastTimer.current);};
  },[]);
  useEffect(()=>{
    if(session?.user.id){
      setReady(false);const initial=emptyProgress(catalog.version);progressRef.current=initial;setProgress(initial);
      void refresh();
    }else if(mounted.current){
      try{const demo=readDemo();progressRef.current=demo;setProgress(demo);}catch{}
      setSyncError(false);
    }
  },[session?.user.id,refresh]);
  useEffect(()=>{
    document.documentElement.lang=lang;
  },[lang]);
  useEffect(()=>{
    if(!session)return;
    const onFocus=()=>{if(document.visibilityState==='visible')void refresh();};
    window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);
    const interval=setInterval(onFocus,30000);
    const client=supabase()!;
    const channel=client.channel(`progress:${session.user.id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'learner_stats',filter:`user_id=eq.${session.user.id}`},()=>{void refresh();}).subscribe();
    return()=>{window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus);clearInterval(interval);void client.removeChannel(channel);};
  },[session?.user.id,refresh]);
  const submit=useCallback(async(activity:Activity,response:Answer,eventId:string)=>{
    const owner=ownerRef.current;
    if(owner){
      const {data,error}=await supabase()!.rpc('submit_answer',{p_activity_id:activity.id,p_response:response,p_event_id:eventId});
      if(error){setSyncError(true);throw new Error(tr('Envoi non confirmé. Réessaie pour synchroniser ta réponse.','Submission not confirmed. Retry to sync your answer.'));}
      const result=data as GradeResult;acceptCloud(result.state,owner);return result;
    }
    let result:GradeResult;
    if(cloudConfigured){
      const {data,error}=await supabase()!.rpc('grade_preview',{p_activity_id:activity.id,p_response:response});
      if(error)throw new Error(tr('Le défi n’a pas pu être corrigé. Vérifie ta connexion et réessaie.','The challenge could not be checked. Check your connection and retry.'));
      result=applyGradedAttempt(progressRef.current,catalog,activity,response,data,eventId);
    }else{
      const solutions=await demoSolutions();
      result=applyLocalAttempt(progressRef.current,catalog,activity,response,solutions[activity.id],eventId);
    }
    persistDemo(result.state);return result;
  },[acceptCloud,persistDemo,tr]);
  const saveProfile=useCallback(async(profile:Profile)=>{
    const owner=ownerRef.current;
    if(owner){
      const {data,error}=await supabase()!.rpc('save_profile',{p_display_name:profile.displayName,p_locale:profile.locale,p_timezone:profile.timezone,p_leaderboard_opt_in:profile.leaderboardOptIn});
      if(error)throw new Error(tr('Le profil n’a pas pu être enregistré.','The profile could not be saved.'));
      acceptCloud(data,owner);
    }else persistDemo({...progressRef.current,profile});
  },[acceptCloud,persistDemo,tr]);
  const submitMission=useCallback(async(id:string,url:string,reflection:string)=>{
    if(!catalog.missions.some(x=>x.id===id)||!safeExternalUrl(url)||!reflection.trim()||reflection.length>4000)throw new Error(tr('Ajoute un lien HTTPS et une courte réflexion.','Add an HTTPS link and a short reflection.'));
    const owner=ownerRef.current;
    if(owner){
      const {data,error}=await supabase()!.rpc('submit_mission',{p_step_id:id,p_evidence_url:url,p_reflection:reflection});
      if(error)throw new Error(tr('Livrable non confirmé. Réessaie.','Submission not confirmed. Please retry.'));
      acceptCloud(data,owner);
    }else{
      const state=structuredClone(progressRef.current);
      state.garage[id]={status:'submitted',evidenceUrl:url,reflection,updatedAt:new Date().toISOString()};
      awardLocalBadges(state,catalog,localDate(new Date(),state.profile.timezone));persistDemo(state);
    }
  },[acceptCloud,persistDemo,tr]);
  const saveNotebook=useCallback(async(id:string,body:string,checks:boolean[])=>{
    validateNotebook(body,checks);if(!catalog.lessons.some(l=>l.id===id))throw new Error('Unknown lesson');
    const owner=ownerRef.current;
    if(owner){
      const {data,error}=await supabase()!.rpc('save_notebook',{p_lesson_id:id,p_body:body,p_checks:checks});
      if(error)throw new Error(tr('Carnet non enregistré. Réessaie.','Notebook not saved. Please retry.'));acceptCloud(data,owner);
    }else{const state=structuredClone(progressRef.current);state.notebooks[id]={body,checks,updatedAt:new Date().toISOString()};persistDemo(state);}
  },[acceptCloud,persistDemo,tr]);
  const startExam=useCallback(async(id:string,mode:ExamSession['mode'],eventId=uuid()):Promise<ExamSession>=>{
    if(!catalog.exams.some(e=>e.id===id))throw new Error('Unknown exam');
    const owner=ownerRef.current;
    if(owner){
      const {data,error}=await supabase()!.rpc('start_exam',{p_exam_id:id,p_mode:mode,p_event_id:eventId});
      if(error)throw new Error(tr('Démarrage non confirmé. Vérifie que les leçons du module sont terminées.','Start not confirmed. Check module lesson completion.'));return data as ExamSession;
    }
    if(mode==='validation'&&!canValidateExam(progressRef.current,catalog,id))throw new Error(tr('Termine les leçons du module avant la validation.','Complete module lessons before validation.'));
    return {attemptId:eventId,examId:id,mode,form:(progressRef.current.exams[id]?.attempts??0)%2===0?'A':'B',startedAt:new Date().toISOString()};
  },[tr]);
  const finishExam=useCallback(async(exam:ExamSession,answers:ExamAnswerSet):Promise<ExamResult>=>{
    const owner=ownerRef.current;
    if(owner){
      const {data,error}=await supabase()!.rpc('finish_exam',{p_attempt_id:exam.attemptId,p_answers:answers});
      if(error)throw new Error(tr('Remise non confirmée. Réessaie avec les mêmes réponses.','Submission not confirmed. Retry with the same answers.'));acceptCloud(data.state,owner);return data.result as ExamResult;
    }
    const existing=progressRef.current.exams[exam.examId]?.lastResult;
    if(existing?.attemptId===exam.attemptId){if(JSON.stringify(existing.answers)!==JSON.stringify(answers))throw new Error('Exam attempt reused');return existing;}
    if(exam.mode==='validation'&&!canValidateExam(progressRef.current,catalog,exam.examId))throw new Error('Module incomplete');
    let result:ExamResult;
    if(cloudConfigured){
      const {data,error}=await supabase()!.rpc('preview_exam',{p_exam_id:exam.examId,p_form:exam.form,p_answers:answers});
      if(error)throw new Error(tr('Correction indisponible. Réessaie.','Marking unavailable. Please retry.'));
      const meta=catalog.exams.find(e=>e.id===exam.examId)!;
      result={...data,attemptId:exam.attemptId,examId:exam.examId,form:exam.form,mode:exam.mode,passed:exam.mode==='validation'&&data.score>=meta.threshold,at:new Date().toISOString(),answers};
    }else{
      const [detail,correction]=await Promise.all([loadExam(exam.examId,exam.form),fetch('/data/demo-exam-solutions.json').then(r=>{if(!r.ok)throw new Error('Exam marking unavailable');return r.json();})]);
      result=gradeExam(detail,answers,correction,exam);
    }
    persistDemo(applyExamResult(progressRef.current,result));return result;
  },[acceptCloud,persistDemo,tr]);
  const resetDemo=useCallback(()=>{if(ownerRef.current)return;persistDemo(emptyProgress(catalog.version,progressRef.current.profile.timezone));notify('La démo repart de zéro.','The demo starts fresh.');},[persistDemo,notify]);
  return <Context.Provider value={{lang,setLang,tr,progress,ready,session,mode:session?'cloud':'demo',cloudConfigured,syncBusy,syncError,refresh,submit,submitMission,saveNotebook,startExam,finishExam,saveProfile,resetDemo,notify,search,setSearch,recovery,setRecovery}}>
    {children}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </Context.Provider>;
}
export function useLearning(){const ctx=useContext(Context);if(!ctx)throw new Error('Missing Provider');return ctx;}
