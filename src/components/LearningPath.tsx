'use client';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {BookOpen,Check,ChevronDown,ChevronRight,Clock3,GraduationCap,Flag,Layers3,Search,Zap} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import {catalog,normalize} from '@/lib/catalog';
import {useLearning} from './Provider';
import {EmptyState,Eyebrow,ProgressBar,Ring,SectionTitle} from './UI';

export function LearningPath(){
 const {tr,lang,progress,search,setSearch}=useLearning(),params=useSearchParams();
 const [selected,setSelected]=useState(params.get('module')||'module_01'),[status,setStatus]=useState('all');
 useEffect(()=>{const m=params.get('module');if(m&&catalog.modules.some(x=>x.id===m))setSelected(m);},[params]);
 const current=catalog.modules.find(x=>x.id===selected)??catalog.modules[0];
 const lessons=catalog.lessons.filter(l=>(search.trim()?normalize(l.title[lang]).includes(normalize(search)):l.moduleId===current.id)&&(status==='all'||(status==='completed'?progress.completed.includes(l.id):!progress.completed.includes(l.id))));
 const modLessons=catalog.lessons.filter(l=>l.moduleId===current.id),done=modLessons.filter(l=>progress.completed.includes(l.id)).length;
 const next=catalog.lessons.find(l=>!progress.completed.includes(l.id));
 return <>
  <div className="page-intro"><div><Eyebrow><Layers3 size={14}/>{tr('TA FEUILLE DE ROUTE','YOUR ROADMAP')}</Eyebrow><h1>{tr('180 journées d’ingénierie automobile.','180 days of automotive engineering.')}</h1><p>{tr('Cours, exemples résolus, défis techniques et examen à chaque module.','Courses, worked examples, engineering challenges and a module exam.')}</p></div><div className="path-overall"><Ring value={progress.completed.length/180*100} size={56}/><span><strong>{progress.completed.length}/180</strong><small>{tr('leçons terminées','lessons completed')}</small></span></div></div>
  <div className="path-layout">
   <aside className="module-selector panel"><div className="module-selector-title">{tr('LES 10 MODULES','THE 10 MODULES')}</div>{catalog.modules.map(m=>{const ls=catalog.lessons.filter(l=>l.moduleId===m.id),n=ls.filter(l=>progress.completed.includes(l.id)).length;return <button key={m.id} className={current.id===m.id?'selected':''} onClick={()=>{setSelected(m.id);setSearch('');}}><span className={`module-number ${n===ls.length?'done':''}`}>{n===ls.length?<Check size={15}/>:String(m.position).padStart(2,'0')}</span><span><strong>{m.title[lang]}</strong><small>{n}/{ls.length} {tr('leçons','lessons')}</small></span><ChevronRight size={15}/></button>;})}</aside>
   <div className="path-lessons">
    <section className="module-header"><div><span className="mini-label">MODULE {String(current.position).padStart(2,'0')} · {tr('JOURS','DAYS')} {current.startDay}–{current.endDay}</span><h2>{current.title[lang]}</h2><p>{current.summary[lang]}</p></div><div className="module-header-progress"><strong>{done}<small>/{modLessons.length}</small></strong><span>{tr('leçons terminées','lessons completed')}</span><ProgressBar value={done/modLessons.length*100}/></div></section>
    <section className="module-exam-callout"><div><span className="mini-label">{tr('ÉPREUVE DE FIN DE MODULE','END-OF-MODULE EXAM')}</span><h3><GraduationCap size={22}/>{tr('Examen de validation','Validation exam')}</h3><p>{tr('12 questions sur des cas de calcul et de décision · 60 min conseillées · seuil 80 %.','12 calculation and decision questions · 60 min suggested · pass mark 80%.')}</p><strong>{progress.exams[`exam_${String(current.position).padStart(2,'0')}`]?.passed?tr('Module validé','Module passed'):done===modLessons.length?tr('Validation disponible','Validation available'):tr('Examen blanc disponible ; termine les leçons pour la validation.','Practice available; complete lessons to unlock validation.')}</strong></div><Link className="btn secondary" href={`/exam/exam_${String(current.position).padStart(2,'0')}/`}>{tr('Ouvrir l’examen','Open exam')}<ChevronRight size={16}/></Link></section>
    <div className="lesson-filters"><label className="search-inline"><Search size={17}/><input aria-label={tr('Filtrer les leçons','Filter lessons')} placeholder={tr('Rechercher dans les 180 leçons…','Search all 180 lessons…')} value={search} onChange={e=>setSearch(e.target.value)}/></label><select value={status} onChange={e=>setStatus(e.target.value)} aria-label={tr('Statut des leçons','Lesson status')}><option value="all">{tr('Toutes','All lessons')}</option><option value="todo">{tr('À découvrir','To explore')}</option><option value="completed">{tr('Terminées','Completed')}</option></select></div>
    {search&&<p className="search-caption">{lessons.length} {tr('résultat(s) dans tout le parcours','result(s) across the whole path')}</p>}
    <div className="lesson-timeline">{lessons.map(l=>{const completed=progress.completed.includes(l.id),active=next?.id===l.id,started=progress.started.includes(l.id);return <Link key={l.id} href={`/lesson/${l.id}/`} className={`lesson-row ${completed?'completed':''} ${active?'current':''}`}><div className="timeline-node">{completed?<Check size={22}/>:active?<Zap size={22} fill="currentColor"/>:<BookOpen size={20}/>}</div><div className="lesson-row-copy"><div className="mini-label">{tr('LEÇON','LESSON')} {String(l.day).padStart(3,'0')}{active&&<span className="next-pill">{tr('Prochaine étape','Next stop')}</span>}</div><h3>{l.title[lang]}</h3><div className="lesson-meta"><span><Clock3 size={13}/>{l.minutes} min</span><i/><span>{completed?tr('Entraînement réussi · dossier à relire','Practice passed · record for review'):started?tr('En cours','In progress'):tr('Comprendre & pratiquer','Learn & practise')}</span></div></div><span className="lesson-row-action">{completed?tr('Réviser','Review'):tr('Ouvrir','Open')}<ArrowIcon/></span></Link>;})}</div>
    {!lessons.length&&<EmptyState title={tr('Une autre piste ?','Try another route?')} body={tr('Aucune leçon ne correspond à ces filtres.','No lessons match these filters.')} action={<button className="btn secondary" onClick={()=>{setSearch('');setStatus('all');}}>{tr('Effacer les filtres','Clear filters')}</button>}/>}
    <p className="path-note"><Flag size={15}/>{tr('L’ordre est conseillé. Toutes les leçons restent accessibles pour réviser.','The order is recommended. Every lesson stays accessible for review.')}</p>
   </div>
  </div>
 </>;
}
function ArrowIcon(){return <ChevronRight size={18}/>;}
