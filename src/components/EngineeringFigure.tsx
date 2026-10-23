'use client';
import {useLearning} from './Provider';

/** Exact SVG plots from declared educational equations; generated artwork is never used for engineering data. */
export function EngineeringFigure({kind}:{kind:string}){
 const {tr}=useLearning();
 const x0=60,y0=242,w=580,h=190;
 let title='',caption='',xlabel='',ylabel='',xs:number[]=[],series:{label:string;color:string;values:number[]}[]=[],xmin=0,xmax=1,ymax=1;
 if(['system','electric','integration'].includes(kind)){
  title=tr('Autonomie : énergie utile et consommation','Range: usable energy and consumption');xlabel=tr('Énergie utile (kWh)','Usable energy (kWh)');ylabel='km';xs=[12,16,20,24,28];xmin=12;xmax=28;ymax=240;
  series=[130,150].map((c,i)=>({label:`${c} Wh/km`,color:i?'#d87b31':'#325aff',values:xs.map(e=>e*1000/c)}));caption=tr('Modèle R = 1000 E/c. Consommation constante ; comparer les deux hypothèses, sans y voir une autonomie garantie.','Model R = 1000 E/c. Constant consumption; compare assumptions without treating range as guaranteed.');
 }else if(kind==='dynamics'){
  title=tr('La distance d’arrêt dépend du scénario','Stopping distance depends on scenario');xlabel='km/h';ylabel='m';xs=[20,30,40,50,60,70,80];xmin=20;xmax=80;ymax=90;
  series=[.8,.35].map((mu,i)=>({label:`μ = ${mu}`,color:i?'#d87b31':'#325aff',values:xs.map(v=>v/3.6*.3+(v/3.6)**2/(2*Math.min(5,mu*9.81)))}));caption=tr('Référence : délai 0,30 s, a = min(5, μg), route plane. Décélération constante après délai.','Reference: 0.30 s delay, a = min(5, μg), level road. Constant deceleration after delay.');
 }else if(kind==='mechanics'){
  title=tr('Puissance roues à vitesse stabilisée','Steady-speed wheel power');xlabel='km/h';ylabel='kW';xs=[20,30,40,50,60,70,80,90];xmin=20;xmax=90;ymax=42;
  series=[0,.08].map((p,i)=>({label:i?tr('Pente 8 %','8% grade'):tr('Plat','Level'),color:i?'#d87b31':'#325aff',values:xs.map(k=>{const v=k/3.6,t=Math.atan(p);return (.012*1200*9.81*Math.cos(t)+.5*1.225*.64*v*v+1200*9.81*Math.sin(t))*v/1000;})}));caption=tr('Référence : 1 200 kg, Crr 0,012, CdA 0,64 m², ρ 1,225 kg/m³, sans vent. Puissance aux roues, avant pertes et auxiliaires.','Reference: 1,200 kg, Crr 0.012, CdA 0.64 m², ρ 1.225 kg/m³, still air. Wheel power before losses and auxiliaries.');
 }else if(kind==='structure'){
  title=tr('Alléger une section augmente la contrainte','Reducing area raises stress');xlabel='A (mm²)';ylabel='MPa';xs=[40,60,80,100,120,140,160];xmin=40;xmax=160;ymax=220;
  series=[{label:'F = 8 000 N',color:'#325aff',values:xs.map(a=>8000/a)}];caption=tr('Barre uniforme en traction : σ = F/A. Ne couvre ni trou, ni flexion, ni fatigue.','Uniform tension bar: σ = F/A. Excludes holes, bending and fatigue.');
 }else if(['network','software'].includes(kind)){
  title=tr('La période influence la charge moyenne','Period affects average utilisation');xlabel=tr('Période (ms)','Period (ms)');ylabel='%';xs=[5,10,15,20,25,30,40,50];xmin=5;xmax=50;ymax=6;
  series=[{label:tr('1 trame, 130 bits, 500 kbit/s','1 frame, 130 bits, 500 kbit/s'),color:'#325aff',values:xs.map(t=>130*1000/t/500000*100)}];caption=tr('U = (130/T)/R, avec T en secondes. Le graphe indique une moyenne, sans garantie de deadline.','U = (130/T)/R with T in seconds. This is average load, not a deadline guarantee.');
 }else return null;
 const xp=(x:number)=>x0+(x-xmin)/(xmax-xmin)*w,yp=(y:number)=>y0-y/ymax*h;
 return <figure className="engineering-plot"><h3>{title}</h3><svg viewBox="0 0 700 300" role="img" aria-label={title}><title>{title}</title>{[0,1,2,3,4].map(i=><g key={i}><line x1={x0} x2={x0+w} y1={yp(ymax*i/4)} y2={yp(ymax*i/4)} stroke="#dbe3ef"/><text x={x0-9} y={yp(ymax*i/4)+4} textAnchor="end" fontSize="12" fill="#465870">{+(ymax*i/4).toFixed(1)}</text></g>)}<path d={`M${x0} ${y0-h}V${y0}H${x0+w}`} fill="none" stroke="#66738b"/>{xs.filter((_,i)=>i%2===0).map(x=><text key={x} x={xp(x)} y={y0+20} textAnchor="middle" fontSize="12" fill="#465870">{x}</text>)}<text x={x0} y="24" fill="#465870" fontSize="12">{ylabel}</text><text x={x0+w} y="287" textAnchor="end" fill="#465870" fontSize="12">{xlabel}</text>{series.map(s=><g key={s.label}><polyline points={xs.map((x,i)=>`${xp(x)},${yp(s.values[i])}`).join(' ')} fill="none" stroke={s.color} strokeWidth="3"/>{xs.map((x,i)=><circle key={x} cx={xp(x)} cy={yp(s.values[i])} r="3" fill={s.color}/>)}</g>)}</svg><div className="plot-legend">{series.map(s=><span key={s.label}><i style={{background:s.color}}/>{s.label}</span>)}</div><figcaption>{caption}</figcaption></figure>;
}
