'use client';
import {ArrowDown,ArrowRight,ArrowUp,Check,CheckCircle2,GripVertical,LoaderCircle,RotateCcw,Sparkles,Wrench,X,Zap} from 'lucide-react';
import {useMemo,useRef,useState} from 'react';
import type {Activity,Answer,GradeResult} from '@/lib/types';
import {useLearning} from './Provider';
import {parseDecimal,uuid} from '@/lib/learning';

export function Question({activity,onContinue}:{activity:Activity;onContinue?:()=>void}) {
 const {lang,tr,submit}=useLearning();
 const [selected,setSelected]=useState(''),[number,setNumber]=useState(''),[text,setText]=useState('');
 const [order,setOrder]=useState(activity.settings.items?.map(x=>x.id)??[]),[pairs,setPairs]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[result,setResult]=useState<GradeResult|null>(null),[error,setError]=useState('');
 const pending=useRef<{signature:string;id:string}|null>(null);
 const labels={single_choice:tr('CHOISIS LA BONNE RÉPONSE','CHOOSE THE CORRECT ANSWER'),numeric:tr('À TOI DE CALCULER','YOUR TURN TO CALCULATE'),ordering:tr('REMETS DANS L’ORDRE','PUT IN THE RIGHT ORDER'),matching:tr('ASSOCIE LES ÉLÉMENTS','MATCH THE ITEMS'),open_response:tr('APPLIQUE À TON PROJET','APPLY IT TO YOUR PROJECT')};
 const response:Answer=activity.kind==='single_choice'?selected:activity.kind==='numeric'?{value:number,unit:activity.settings.unit!}:activity.kind==='ordering'?order:activity.kind==='matching'?pairs:text;
 const canSubmit=activity.kind==='single_choice'?!!selected:activity.kind==='numeric'?parseDecimal(number)!==null:activity.kind==='matching'?Object.keys(pairs).length===activity.settings.left!.length&&new Set(Object.values(pairs)).size===activity.settings.right!.length:activity.kind==='open_response'?!!text.trim():true;
 const send=async()=>{
  if(!canSubmit||busy)return;setError('');setBusy(true);
  const signature=JSON.stringify(response);
  if(!pending.current||pending.current.signature!==signature)pending.current={signature,id:uuid()};
  try{setResult(await submit(activity,response,pending.current.id));}
  catch(e){setError(e instanceof Error?e.message:tr('Envoi impossible. Réessaie.','Could not submit. Try again.'));}
  finally{setBusy(false);}
 };
 const move=(index:number,direction:number)=>{
  const next=order.slice(),target=index+direction;if(target<0||target>=next.length)return;
  [next[index],next[target]]=[next[target],next[index]];setOrder(next);
 };
 return <section className="question-panel" aria-busy={busy}>
  <div className="question-kicker"><span><Sparkles size={16}/>{labels[activity.kind]}</span>{activity.points>0?<span className="xp-tag"><Zap size={13}/>{activity.points} XP</span>:<span className="soft-tag"><Wrench size={13}/>{tr('Relecture','Review')}</span>}</div>
  <h2 className="question-title">{activity.prompt[lang]}</h2>
  {activity.kind==='single_choice'&&<div className="choices" role="radiogroup" aria-label={activity.prompt[lang]}>{activity.choices.map((choice,index)=><button key={choice.id} className={`choice ${selected===choice.id?'selected':''} ${result&&selected===choice.id?(result.outcome==='correct'?'correct':'incorrect'):''}`} role="radio" aria-checked={selected===choice.id} disabled={busy||!!result} onClick={()=>setSelected(choice.id)}><span className="choice-letter">{String.fromCharCode(65+index)}</span><span>{choice.labels[lang]}</span><span className="choice-radio">{selected===choice.id&&<Check size={14}/>}</span></button>)}</div>}
  {activity.kind==='numeric'&&<div className="numeric-answer"><label htmlFor={`number-${activity.id}`}>{tr('Ton résultat','Your result')}</label><div><input id={`number-${activity.id}`} type="text" inputMode="decimal" value={number} onChange={e=>setNumber(e.target.value)} placeholder="0" disabled={busy||!!result} onKeyDown={e=>{if(e.key==='Enter')void send();}} autoComplete="off"/><span>{activity.settings.unit}</span></div><p>{(activity.settings.toleranceLabel as {fr:string;en:string})?.[lang]||tr('Utilise l’unité indiquée. Les arrondis raisonnables sont acceptés.','Use the displayed unit. Reasonable rounding is accepted.')}</p></div>}
  {activity.kind==='ordering'&&<div className="order-items"><p className="muted">{tr('Utilise les flèches pour déplacer chaque étape.','Use the arrows to move each step.')}</p>{order.map((id,index)=><div className="order-item" key={id}><span className="order-number">{index+1}</span><GripVertical size={16} className="muted"/><span className="order-label">{activity.settings.items!.find(x=>x.id===id)!.labels[lang]}</span><button className="icon-button" onClick={()=>move(index,-1)} disabled={index===0||busy||!!result} aria-label={tr('Monter cette étape','Move step up')}><ArrowUp size={17}/></button><button className="icon-button" onClick={()=>move(index,1)} disabled={index===order.length-1||busy||!!result} aria-label={tr('Descendre cette étape','Move step down')}><ArrowDown size={17}/></button></div>)}</div>}
  {activity.kind==='matching'&&<div className="matching-items">{activity.settings.left!.map(left=><label className="matching-row" key={left.id}><span>{left.labels[lang]}</span><ArrowRight size={17}/><select value={pairs[left.id]??''} onChange={e=>setPairs({...pairs,[left.id]:e.target.value})} disabled={busy||!!result} aria-label={tr('Associer : ','Match: ')+left.labels[lang]}><option value="" disabled>{tr('Choisir…','Choose…')}</option>{activity.settings.right!.map(right=><option key={right.id} value={right.id}>{right.labels[lang]}</option>)}</select></label>)}</div>}
  {activity.kind==='open_response'&&<div className="open-answer"><label htmlFor={`task-${activity.id}`}>{tr('Ton raisonnement ou le lien vers ton livrable','Your reasoning or a link to your work')}</label><textarea id={`task-${activity.id}`} rows={6} maxLength={4000} value={text} onChange={e=>setText(e.target.value)} placeholder={tr('Décris tes hypothèses, ta démarche et les limites de ton résultat…','Describe your assumptions, reasoning and the limits of your result…')} disabled={busy||!!result}/><small>{text.length}/4000 · {tr('Pas de correction automatique ni de XP pour cette activité.','This activity is reviewed manually and awards no XP.')}</small></div>}
  {error&&<div className="inline-error" role="alert">{error}</div>}
  {result&&<div className={`answer-feedback ${result.outcome}`} role="status"><div className="feedback-heading">{result.outcome==='correct'?<CheckCircle2 size={25}/>:result.outcome==='incorrect'?<RotateCcw size={24}/>:<Wrench size={24}/>}<strong>{result.outcome==='correct'?tr('Réponse correcte','Correct answer'):result.outcome==='incorrect'?tr('Résultat à reprendre','Review the result'):tr('Livrable enregistré, à relire.','Work saved for review.')}</strong>{result.awardedXp>0&&<span>+{result.awardedXp} XP</span>}</div><p>{result.explanation[lang]}</p>{result.rubric?.[lang]&&<ul>{result.rubric[lang]!.map(line=><li key={line}>{line}</li>)}</ul>}{result.outcome==='correct'&&result.awardedXp===0&&<small>{tr('Exercice déjà réussi : ta révision est enregistrée.','Already completed: your practice has been recorded.')}</small>}</div>}
  <div className="question-actions">{!result?<><span className="question-hint">{tr('Comprendre vaut mieux que deviner.','Understanding beats guessing.')}</span><button className="btn primary" disabled={!canSubmit||busy} onClick={()=>void send()}>{busy?<LoaderCircle size={18} className="spin"/>:<Check size={18}/>} {activity.kind==='open_response'?tr('Enregistrer','Save work'):tr('Vérifier','Check answer')}</button></>:result.outcome==='incorrect'?<><span/><button className="btn primary" onClick={()=>{setResult(null);pending.current=null;}}><RotateCcw size={17}/>{tr('Réessayer','Try again')}</button></>:<><span/><button className="btn primary" onClick={onContinue||(()=>{setResult(null);pending.current=null;})}>{tr('Continuer','Continue')}<ArrowRight size={18}/></button></>}</div>
 </section>;
}
