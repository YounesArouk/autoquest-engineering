'use client';
import Link from 'next/link';
import {ArrowRight,CarFront,Check,Flag,Gauge,Trophy,Zap} from 'lucide-react';
import {useLearning} from './Provider';
import {catalog} from '@/lib/catalog';
import type {ReactNode} from 'react';

export function Brand(){const {tr}=useLearning();return <Link href="/" className="brand" aria-label={tr('AutoQuest — accueil','AutoQuest — home')}><span className="brand-mark"><Gauge size={24} strokeWidth={2.4}/></span><span>auto<span className="brand-second">quest</span><small>LEARNING GARAGE</small></span></Link>;}
export function Eyebrow({children}:{children:ReactNode}){return <div className="eyebrow">{children}</div>;}
export function SectionTitle({title,caption,action}:{title:string;caption?:string;action?:ReactNode}){return <div className="section-heading"><div><h2>{title}</h2>{caption&&<p>{caption}</p>}</div>{action}</div>;}
export function ProgressBar({value,label}:{value:number;label?:string}){return <div className="progress-track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label||'Progression'}><span style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>;}
export function Ring({value,size=46}:{value:number;size?:number}){return <svg width={size} height={size} viewBox="0 0 48 48" className="ring" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" opacity=".13"/><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${value*1.2566} 125.66`} strokeLinecap="round" transform="rotate(-90 24 24)"/><text x="24" y="28" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="700">{Math.round(value)}%</text></svg>;}
export function EmptyState({icon='flag',title,body,action}:{icon?:'flag'|'trophy'|'car';title:string;body:string;action?:ReactNode}){return <div className="empty-state"><span className="empty-icon">{icon==='trophy'?<Trophy size={32}/>:icon==='car'?<CarFront size={32}/>:<Flag size={32}/>}</span><h3>{title}</h3><p>{body}</p>{action}</div>;}
export function Loading(){const {tr}=useLearning();return <div className="loading-state" role="status"><span className="spinner"/>{tr('Préparation de ton atelier…','Preparing your workshop…')}</div>;}
export function ErrorBox({retry}:{retry:()=>void}){const {tr}=useLearning();return <div className="error-box" role="alert"><p>{tr('Le contenu n’a pas pu être chargé.','The content could not be loaded.')}</p><button className="btn secondary" onClick={retry}>{tr('Réessayer','Try again')}</button></div>;}
export const moduleIcons=['01','02','03','04','05','06','07','08','09','10'];
export function CarGraphic({interactive=false}:{interactive?:boolean}) {
 const {tr}=useLearning();
 return <div className={`car-graphic ${interactive?'interactive':''}`}>
  <svg viewBox="0 0 600 340" role="img" aria-label={tr('Schéma du véhicule électrique E-City : batterie sous le plancher, moteur à l’avant.','E-City electric vehicle concept: underfloor battery and front motor.')}>
   <defs><linearGradient id="bodyAQ" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#eef5ff"/><stop offset="1" stopColor="#98b9fb"/></linearGradient><linearGradient id="glassAQ" x2="1" y2="1"><stop stopColor="#172c55"/><stop offset="1" stopColor="#4573b5"/></linearGradient><pattern id="gridAQ" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#8ba6d7" strokeWidth=".5" opacity=".3"/></pattern></defs>
   <path d="M0 0H600V340H0Z" fill="url(#gridAQ)"/>
   <ellipse cx="308" cy="258" rx="235" ry="32" fill="#06152e" opacity=".22"/>
   <path d="M92 196 122 160 219 134 318 143 394 176 476 194 500 219 475 247 136 247 92 226Z" fill="url(#bodyAQ)" stroke="#d7e7ff" strokeWidth="2"/>
   <path d="M122 160 202 101 306 106 393 154 394 176 318 143 219 134Z" fill="#c5d9fc" stroke="#e3edff" strokeWidth="2"/>
   <path d="M204 108 225 132 313 139 315 113Z" fill="url(#glassAQ)" stroke="#e0ecff" strokeWidth="2"/>
   <path d="M321 114 380 151 388 169 321 140Z" fill="url(#glassAQ)" stroke="#e0ecff" strokeWidth="2"/>
   <path d="M199 111 139 158 211 138Z" fill="#597fb9" stroke="#e0ecff" strokeWidth="2"/>
   <path d="M223 145 222 223M318 153 318 228M137 188 472 216" stroke="#7098d6" strokeWidth="1.5" fill="none"/>
   <path d="M452 197 477 206 471 217 447 210Z" fill="#f0fcff"/>
   <path d="M100 201 119 199 120 209 98 215Z" fill="#b9d5ff"/>
   <path d="M245 160 263 162M341 172 358 177" stroke="#5176ad" strokeWidth="4" strokeLinecap="round"/>
   <g fill="#142744" stroke="#7393c1" strokeWidth="2"><ellipse cx="168" cy="232" rx="31" ry="39" transform="rotate(-8 168 232)"/><ellipse cx="423" cy="242" rx="33" ry="39" transform="rotate(-8 423 242)"/></g>
   <g fill="#86a6d5" stroke="#d8e6fa" strokeWidth="2"><ellipse cx="168" cy="232" rx="17" ry="25" transform="rotate(-8 168 232)"/><ellipse cx="423" cy="242" rx="18" ry="26" transform="rotate(-8 423 242)"/></g>
   <path d="M228 221 329 228 367 237 273 234Z" fill="#b8f578" stroke="#dbffb3" strokeWidth="2"/>
   <path d="M243 223 280 231M266 225 302 233M289 227 324 234M312 229 345 236" stroke="#609f42" strokeWidth="1.5"/>
   <path d="M397 201 423 209 425 223 397 215Z" fill="#6a91fb" stroke="#adc7ff" strokeWidth="2"/>
   <path d="M300 230V292H360M412 211V89H450M169 233 100 282H60" stroke="#b6d3ff" strokeWidth="1.3" strokeDasharray="4 5" fill="none"/>
   <g fill="#c8ff93"><circle cx="300" cy="230" r="5"/><circle cx="412" cy="211" r="5"/><circle cx="169" cy="233" r="5"/></g>
   <g fontFamily="system-ui,sans-serif" fontSize="11" fill="#d8e9ff"><text x="367" y="296">BATTERY PACK</text><text x="455" y="93">E-MOTOR</text><text x="32" y="278">CHASSIS</text></g>
  </svg>
  {interactive&&<div className="car-links"><Link href="/lesson/lesson_020/">{tr('Batterie','Battery')}<ArrowRight size={13}/></Link><Link href="/lesson/lesson_021/">{tr('Moteur','Motor')}<ArrowRight size={13}/></Link><Link href="/lesson/lesson_028/">{tr('Freinage','Braking')}<ArrowRight size={13}/></Link></div>}
 </div>;
}
export function BadgeGrid(){const {progress,tr}=useLearning();const badges=[
 ['first_lesson','Premier départ','First start','1 leçon terminée','1 lesson completed'],
 ['ten_lessons','Sur ta lancée','On a roll','10 leçons terminées','10 lessons completed'],
 ['streak_7','Régulier','Consistent','7 jours consécutifs','7 consecutive days'],
 ['mechanical_complete','Mécanique en poche','Mechanical foundations','35 leçons de mécanique','35 mechanical lessons'],
 ['ecity_submitted','Dossier E-City','E-City package','20 missions soumises','20 missions submitted'],
 ];return <div className="badge-grid">{badges.map(([id,fr,en,dfr,den])=><div className={`achievement ${progress.badges.includes(id)?'earned':''}`} key={id}><span className="achievement-medal">{progress.badges.includes(id)?<Trophy size={26}/>:<Flag size={26}/>}</span><strong>{tr(fr,en)}</strong><small>{tr(dfr,den)}</small>{progress.badges.includes(id)&&<Check size={14} className="earned-check"/>}</div>)}</div>;}
export function CourseStats(){const {tr}=useLearning();return <div className="course-stats"><span><Zap size={14}/>180 {tr('leçons','lessons')}</span><span><Check size={14}/>940 {tr('exercices corrigés','graded activities')}</span><span><CarFront size={15}/>{catalog.missions.length} {tr('missions','missions')}</span></div>;}
