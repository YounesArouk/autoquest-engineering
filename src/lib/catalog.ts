import json from '@/data/catalog.json';
import type {Catalog,Lesson} from './types';
export const catalog = json as unknown as Catalog;
export const lessonById = (id:string) => catalog.lessons.find(x=>x.id===id);
export const moduleById = (id:string) => catalog.modules.find(x=>x.id===id);
export const lessonCache = new Map<string,Lesson>();
export async function loadLesson(id:string):Promise<Lesson> {
  if(lessonCache.has(id)) return lessonCache.get(id)!;
  if(!lessonById(id)) throw new Error('Unknown lesson');
  const response = await fetch(`/data/lessons/${id}.json`);
  if(!response.ok) throw new Error('Lesson unavailable');
  const lesson=await response.json() as Lesson;
  lessonCache.set(id,lesson);return lesson;
}
export function normalize(text:string) {return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}

export async function loadExam(id:string,form:string):Promise<import('./types').Exam>{
 if(!catalog.exams.some(e=>e.id===id)||!['A','B'].includes(form))throw new Error('Unknown exam');
 const r=await fetch(`/data/exams/${id}_${form}.json`);if(!r.ok)throw new Error('Exam unavailable');return r.json();
}
