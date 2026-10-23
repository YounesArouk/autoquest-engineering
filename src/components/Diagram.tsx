'use client';
import {Download,Maximize2,Minus,Plus,X} from 'lucide-react';
import {useRef,useState} from 'react';
import {useLearning} from './Provider';
export function Diagram({path,alt}:{path:string;alt:string}){
 const {tr}=useLearning(),dialog=useRef<HTMLDialogElement>(null);const [zoom,setZoom]=useState(100);
 return <><figure className="lesson-diagram"><img src={path} alt={alt} width="1100" height="620"/><figcaption><span>{alt}</span><button onClick={()=>dialog.current?.showModal()}><Maximize2 size={14}/>{tr('Agrandir','Enlarge')}</button></figcaption></figure><dialog ref={dialog} className="diagram-dialog" aria-label={tr('Schéma en grand format','Enlarged diagram')} onClose={()=>setZoom(100)}><div className="diagram-toolbar"><strong>{tr('Explore le schéma','Explore the diagram')}</strong><div className="diagram-zoom"><button className="icon-button" onClick={()=>setZoom(x=>Math.max(50,x-25))} disabled={zoom===50} aria-label={tr('Réduire','Zoom out')}><Minus size={16}/></button><span>{zoom}%</span><button className="icon-button" onClick={()=>setZoom(x=>Math.min(150,x+25))} disabled={zoom===150} aria-label={tr('Agrandir davantage','Zoom in')}><Plus size={16}/></button></div><button className="icon-button" onClick={()=>dialog.current?.close()} aria-label={tr('Fermer le schéma','Close diagram')}><X size={18}/></button></div><div className="diagram-scroll"><img src={path} alt={alt} style={{width:1100*zoom/100,maxWidth:'none'}}/></div><p>{tr('Fais défiler pour explorer les détails.','Scroll to explore the details.')}</p></dialog></>;
}
