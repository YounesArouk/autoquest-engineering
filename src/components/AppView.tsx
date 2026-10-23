'use client';
import {Suspense,useEffect} from 'react';
import {Dashboard} from './Dashboard';
import {LearningPath} from './LearningPath';
import {LessonPlayer} from './LessonPlayer';
import {Challenges} from './Challenges';
import {Garage} from './Garage';
import {Profile} from './Profile';
import {Leaderboard} from './Leaderboard';
import {Auth} from './Auth';
import {Loading} from './UI';
import {useLearning} from './Provider';
export type View='home'|'learn'|'lesson'|'challenge'|'garage'|'profile'|'leaderboard'|'auth';
export function AppView({view,id}:{view:View;id?:string}){
 const {lang,tr}=useLearning();
 useEffect(()=>{const names={home:tr('Ton garage d’apprentissage','Your learning garage'),learn:tr('Mon parcours','Learning path'),lesson:tr('Une notion de plus','Another breakthrough'),challenge:tr('Défis & révisions','Practice & review'),garage:'Garage E-City',profile:tr('Mon profil','My profile'),leaderboard:tr('Classement','Leaderboard'),auth:tr('Connexion','Sign in')};document.title=names[view]+' · AutoQuest';},[lang,view,tr]);
 return <Suspense fallback={<Loading/>}>{view==='home'?<Dashboard/>:view==='learn'?<LearningPath/>:view==='lesson'?<LessonPlayer id={id!}/>:view==='challenge'?<Challenges/>:view==='garage'?<Garage/>:view==='profile'?<Profile/>:view==='leaderboard'?<Leaderboard/>:<Auth/>}</Suspense>;
}
