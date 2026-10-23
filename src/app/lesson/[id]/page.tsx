import {catalog} from '@/lib/catalog';
import {AppView} from '@/components/AppView';
export const dynamicParams=false;
export function generateStaticParams(){return catalog.lessons.map(l=>({id:l.id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AppView view="lesson" id={id}/>;}
