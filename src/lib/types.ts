export type Lang = 'fr' | 'en';
export type Localized = Record<Lang,string>;
export type ActivityKind = 'single_choice' | 'numeric' | 'ordering' | 'matching' | 'open_response';
export type Choice = {id:string; position:number; labels:Localized};
export type Item = {id:string; labels:Localized};
export type Activity = {
  id:string; lessonId:string; position:number; kind:ActivityKind; points:number; required:boolean;
  revision:number; prompt:Localized; choices:Choice[];
  settings:{unit?:string;items?:Item[];left?:Item[];right?:Item[];[key:string]:unknown};
};
export type LessonMeta = {id:string;moduleId:string;day:number;title:Localized;minutes:number;difficulty:number;activityIds:string[];requiredIds:string[];assetId:string|null};
export type Module = {id:string;position:number;startDay:number;endDay:number;title:Localized;summary:Localized;};
export type Lesson = LessonMeta & {objective:Localized;cards:{id:string;kind:string;title:Localized;body:Localized;assetId:string|null}[];activities:Activity[];course:EngineeringCourse};
export type Mission = {id:string;day:number;title:Localized;goal:Localized;instructions:Record<Lang,string[]>;acceptance:Localized;oralQuestion:Localized;files:string[];commit:string;lessonIds:string[]};
export type Catalog = {
  version:string;modules:Module[];lessons:LessonMeta[];exams:ExamMeta[];references:{title:string;url:string;scope:Localized}[];trainingHours:number;
  activities:{id:string;lessonId:string;kind:ActivityKind;points:number}[];
  assets:{id:string;path:string;alt:Localized}[];missions:Mission[];
  glossary:{id:string;term:Localized;definition:Localized;lessonId:string}[];
};
export type Outcome = 'correct'|'incorrect'|'pending_review';
export type Answer = string | string[] | Record<string,string> | {value:string|number;unit:string};
export type Solution = {answer:Record<string,unknown>;rubric:Partial<Record<Lang,string[]>>;explanation:Localized};
export type Review = {dueAt:string;intervalDays:number;streak:number;lastOutcome:'correct'|'incorrect'};
export type Progress = {
  version:1;contentVersion:string;
  notebooks:Record<string,Notebook>;exams:Record<string,ExamSummary>;
  serverRevision?:number;
  profile:{displayName:string;locale:Lang;timezone:string;leaderboardOptIn:boolean};
  xp:number;completed:string[];started:string[];correct:string[];
  reviews:Record<string,Review>;daily:Record<string,number>;
  garage:Record<string,{status:'submitted'|'reviewed';evidenceUrl:string;reflection:string;updatedAt:string}>;
  badges:string[];
  history:{eventId:string;activityId:string;response:Answer;outcome:Outcome;at:string;points:number}[];
};
export type GradeResult = {outcome:Outcome;explanation:Localized;rubric?:Partial<Record<Lang,string[]>>;awardedXp:number;state:Progress;duplicate?:boolean};
export type LeaderboardRow = {rank:number;displayName:string;xp:number;completed:number;isMe:boolean};

export type EngineeringCase = {given:Localized;formula:string;steps?:Localized;units:string[];asks:Record<Lang,string[]>;limit:Localized};
export type EngineeringCourse = {referenceFr:{title:string;subtitle:string;blocks:unknown[][]};unitId:string;title:Localized;focus:Localized;theory:Record<Lang,string[]>;method:Record<Lang,string[]>;limits:Localized;worked:EngineeringCase;challenge:EngineeringCase;recall:Localized;projectTask:Localized;brief:Localized;rubric:Record<Lang,string[]>;pacing:{minutes:number;label:Localized}[];prerequisites:Localized};
export type ExamMeta = {id:string;moduleId:string;title:Localized;minutes:number;threshold:number;questionCount:number;forms:string[]};
export type Exam = ExamMeta & {form:string;blocks:{id:string;title:Localized;given:Localized;formula:string}[];questions:(Activity&{blockId:string})[];defence:Localized};
export type ExamAnswerSet = Record<string,Answer>;
export type ExamResult = {attemptId:string;examId:string;form:string;mode:'practice'|'validation';score:number;correct:number;total:number;passed:boolean;at:string;answers:ExamAnswerSet;feedback:Record<string,{outcome:Outcome;explanation:Localized}>};
export type ExamSession = {attemptId:string;examId:string;form:string;mode:'practice'|'validation';startedAt:string;result?:ExamResult};
export type ExamSummary = {attempts:number;bestScore:number;passed:boolean;lastResult:ExamResult};
export type Notebook = {body:string;checks:boolean[];updatedAt:string};
