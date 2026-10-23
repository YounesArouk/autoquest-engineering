import type {Answer,Catalog,Exam,ExamAnswerSet,ExamResult,ExamSession,Progress,Solution} from './types';
import {gradeLocal} from './learning';
export function canValidateExam(state:Progress,catalog:Catalog,examId:string){
 const meta=catalog.exams.find(e=>e.id===examId);if(!meta)return false;
 return catalog.lessons.filter(l=>l.moduleId===meta.moduleId).every(l=>state.completed.includes(l.id));
}
export function gradeExam(exam:Exam,answers:ExamAnswerSet,solutions:Record<string,Solution>,session:ExamSession,now=new Date()):ExamResult{
 if(session.examId!==exam.id||session.form!==exam.form)throw new Error('Exam session mismatch');
 if(Object.keys(answers).length!==exam.questions.length||!exam.questions.every(q=>Object.hasOwn(answers,q.id)))throw new Error('Answer every question');
 const feedback:ExamResult['feedback']={};let correct=0;
 for(const q of exam.questions){
  if(!solutions[q.id])throw new Error('Missing exam answer');
  const result=gradeLocal(q,answers[q.id],solutions[q.id]);if(result.outcome==='correct')correct++;
  feedback[q.id]={outcome:result.outcome,explanation:result.explanation};
 }
 const score=Math.round(correct/exam.questions.length*10000)/100;
 return {attemptId:session.attemptId,examId:exam.id,form:exam.form,mode:session.mode,score,correct,total:exam.questions.length,passed:session.mode==='validation'&&score>=exam.threshold,at:now.toISOString(),answers,feedback};
}
export function applyExamResult(previous:Progress,result:ExamResult):Progress{
 const state=structuredClone(previous),last=state.exams[result.examId];
 if(last?.lastResult.attemptId===result.attemptId){if(JSON.stringify(last.lastResult.answers)!==JSON.stringify(result.answers))throw new Error('Exam attempt reused with different answers');return state;}
 state.exams[result.examId]={attempts:(last?.attempts??0)+1,bestScore:Math.max(last?.bestScore??0,result.score),passed:!!last?.passed||result.passed,lastResult:result};
 return state;
}
export function validateNotebook(body:string,checks:boolean[]){
 if(typeof body!=='string'||body.length>16000||checks.length!==6||checks.some(x=>typeof x!=='boolean'))throw new Error('Invalid notebook');
}
