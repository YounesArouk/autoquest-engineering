'use client';
import {Fragment} from 'react';
import {useLearning} from './Provider';
import {Diagram} from './Diagram';
import type {EngineeringCourse} from '@/lib/types';
/** Render the author's limited rich-text notation as React elements, never executable HTML. */
function Rich({text}:{text:string}){
 let bold=false,italic=false;
 return <>{text.split(/(<\/?b>|<\/?i>|<br\s*\/?>)/g).map((token,i)=>{
  if(token==='<b>'){bold=true;return null;}if(token==='</b>'){bold=false;return null;}
  if(token==='<i>'){italic=true;return null;}if(token==='</i>'){italic=false;return null;}
  if(/^<br/.test(token))return <br key={i}/>;
  const clean=token.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  return <Fragment key={i}>{bold?<strong>{italic?<em>{clean}</em>:clean}</strong>:italic?<em>{clean}</em>:clean}</Fragment>;
 })}</>;
}
const PHOTO_CREDITS:Record<string,{url:string;author:string}>={
 'battery.jpg':{url:'https://commons.wikimedia.org/wiki/File:Battery_pack_of_an_EV.jpg',author:'Mugel2110'},
 'brake.jpg':{url:'https://commons.wikimedia.org/wiki/File:Disc_brakes.jpg',author:'Envy fstop'},
 'motor.jpg':{url:'https://commons.wikimedia.org/wiki/File:Vitesco_Technologies_EMR3.jpg',author:'Caprolactam123'}
};
export function ReferenceChapter({chapter}:{chapter:EngineeringCourse['referenceFr']}){
 const {lang,tr}=useLearning();
 const content=<><h2>{chapter.title}</h2><div className="reference-blocks">{chapter.blocks.map((b,i)=>{
  switch(b[0]){
   case 'p':return <p key={i}><Rich text={String(b[1])}/></p>;
   case 'h':return <h3 key={i}><Rich text={String(b[1])}/></h3>;
   case 'table':return <div className="reference-table-wrap" key={i}><table><thead><tr>{(b[1] as string[]).map((v,j)=><th key={j}><Rich text={v}/></th>)}</tr></thead><tbody>{(b[2] as string[][]).map((row,j)=><tr key={j}>{row.map((cell,k)=><td key={k}><Rich text={String(cell)}/></td>)}</tr>)}</tbody></table></div>;
   case 'diagram':return <div key={i} className="reference-diagram"><Diagram path={String(b[b.length-1])} alt={String(b[2])}/></div>;
   case 'image':{const credit=PHOTO_CREDITS[String(b[1])];return <figure className="reference-photo" key={i}><img src={'/images/reference/'+b[1]} alt={String(b[2])} loading="lazy"/><figcaption><Rich text={String(b[2])}/>{credit&&<><br/><a href={credit.url} target="_blank" rel="noreferrer">{credit.author} · Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></>}</figcaption></figure>;}
   case 'exercise':return <div className="reference-exercise" key={i}><strong>{tr('Exercice de compréhension','Comprehension exercise')}</strong><p><Rich text={String(b[1])}/></p><details><summary>{tr('Afficher le raisonnement après avoir essayé','Show the reasoning after trying')}</summary><p><Rich text={String(b[2])}/></p></details></div>;
   case 'callout':return <div className="reference-callout" key={i}><h3><Rich text={String(b[1])}/></h3><p><Rich text={String(b[2])}/></p></div>;
   case 'code':return <pre key={i}><code>{String(b[1])}</code></pre>;
   default:return null;
  }
 })}</div></>;
 return <section className="panel course-block applied-course"><span className="mini-label">{tr('APPROFONDISSEMENT · COURS APPLIQUÉ','FURTHER READING · ORIGINAL FRENCH CHAPTER')}</span>{lang==='fr'?content:<details><summary>{tr('Lire le chapitre','Read the additional French chapter')}</summary>{content}</details>}</section>;
}
