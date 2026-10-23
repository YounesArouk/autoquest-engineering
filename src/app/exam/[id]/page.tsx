import {catalog} from '@/lib/catalog';
import {ExamPlayer} from '@/components/ExamPlayer';
export const dynamicParams=false;
export function generateStaticParams(){return catalog.exams.map(e=>({id:e.id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ExamPlayer id={id}/>;}
