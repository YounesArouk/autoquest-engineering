'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {ArrowUpRight,BookOpen,CarFront,Check,ChevronRight,Cloud,Flame,Home,LogIn,RefreshCw,Search,Trophy,UserRound,WifiOff,Zap} from 'lucide-react';
import {useState,type ReactNode} from 'react';
import {useLearning} from './Provider';
import {Brand,ProgressBar} from './UI';
import {activeStreak,levelFor,localDate} from '@/lib/learning';
import {catalog,normalize} from '@/lib/catalog';

export function Shell({children}:{children:ReactNode}) {
 const ctx=useLearning(),{tr,lang,progress,search,setSearch}=ctx,path=usePathname(),router=useRouter();
 const [searchOpen,setSearchOpen]=useState(false);
 const streak=activeStreak(progress.daily,localDate(new Date(),progress.profile.timezone));
 const nav=[{href:'/',icon:Home,fr:'Tableau de bord',en:'Dashboard',mobilefr:'Accueil',mobileen:'Home'},
 {href:'/learn/',icon:BookOpen,fr:'Mon parcours',en:'Learning path',mobilefr:'Parcours',mobileen:'Learn'},
 {href:'/challenge/',icon:Zap,fr:'Défis & révisions',en:'Practice & review',mobilefr:'Défis',mobileen:'Practice'},
 {href:'/garage/',icon:CarFront,fr:'Garage E-City',en:'E-City garage',mobilefr:'Garage',mobileen:'Garage'},
 {href:'/leaderboard/',icon:Trophy,fr:'Classement',en:'Leaderboard',mobilefr:'Classement',mobileen:'Ranks'},
 {href:'/profile/',icon:UserRound,fr:'Mon profil',en:'My profile',mobilefr:'Profil',mobileen:'Profile'}];
 const active=(href:string)=>href==='/'?path==='/':path.startsWith(href.replace(/\/$/,''))||(href==='/learn/'&&(path.startsWith('/lesson/')||path.startsWith('/exam/')));
 const matching=search.trim()?catalog.lessons.filter(x=>normalize(x.title[lang]).includes(normalize(search))).slice(0,5):[];
 return <div className="app-shell">
  <a href="#main" className="skip-link">{tr('Aller au contenu','Skip to content')}</a>
  <aside className="sidebar">
   <Brand/>
   <div className="nav-caption">{tr('TON ESPACE','YOUR WORKSPACE')}</div>
   <nav className="desktop-nav" aria-label={tr('Navigation principale','Main navigation')}>{nav.map(n=><Link key={n.href} href={n.href} className={active(n.href)?'active':''} aria-current={active(n.href)?'page':undefined}><n.icon size={20}/><span>{tr(n.fr,n.en)}</span>{active(n.href)&&<span className="nav-dot"/>}</Link>)}</nav>
   <div className="sidebar-bottom"><div className="sidebar-goal"><span className="mini-icon"><Zap size={18}/></span><strong>{tr('Un petit pas chaque jour.','A little progress, every day.')}</strong><p>{tr('Calculs, décisions et preuves.','Calculations, decisions and evidence.')}</p><Link href="/challenge/">{tr('Travailler un cas technique','Work on an engineering case')}<ArrowUpRight size={16}/></Link></div>
   <Link href="/profile/" className="sidebar-user"><span className="avatar">{progress.profile.displayName.slice(0,1).toUpperCase()}</span><span><strong>{progress.profile.displayName}</strong><small>{tr('Niveau','Level')} {levelFor(progress.xp)} · {ctx.mode==='cloud'?tr('Synchronisé','Synced'):tr('Explorateur local','Local explorer')}</small></span><ChevronRight size={16}/></Link></div>
  </aside>
  <div className="workspace">
   <header className="topbar">
    <div className="mobile-brand"><Brand/></div>
    <div className={`search-box ${searchOpen?'open':''}`}>
     <Search size={18}/><input aria-label={tr('Rechercher une leçon','Search lessons')} placeholder={tr('Chercher une notion, un système…','Search a concept, a system…')} value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchOpen(true)} onKeyDown={e=>{if(e.key==='Enter'){router.push('/learn/');setSearchOpen(false);}if(e.key==='Escape')setSearchOpen(false);}}/>
     <kbd>↵</kbd>
     {searchOpen&&matching.length>0&&<div className="search-results">{matching.map(l=><Link key={l.id} href={`/lesson/${l.id}/`} onClick={()=>setSearchOpen(false)}><BookOpen size={16}/><span>{l.title[lang]}</span><small>{l.day}</small></Link>)}</div>}
    </div>
    <div className="top-actions">
     <div className="language-switch" aria-label={tr('Langue','Language')}><button onClick={()=>ctx.setLang('fr')} className={lang==='fr'?'selected':''} aria-pressed={lang==='fr'}>FR</button><button onClick={()=>ctx.setLang('en')} className={lang==='en'?'selected':''} aria-pressed={lang==='en'}>EN</button></div>
     <span className="counter streak"><Flame size={20}/><strong>{streak}</strong></span>
     <span className="counter xp"><Zap size={18} fill="currentColor"/><strong>{progress.xp}</strong><span>XP</span></span>
     <Link className="icon-button mobile-ranks" href="/leaderboard/" aria-label={tr('Classement','Leaderboard')}><Trophy size={19}/></Link>
     <Link href={ctx.session?'/profile/':'/auth/'} className="top-avatar" aria-label={ctx.session?tr('Profil','Profile'):tr('Se connecter','Sign in')}>{ctx.session?progress.profile.displayName.slice(0,1).toUpperCase():<UserRound size={20}/>}</Link>
    </div>
   </header>
   <div className="mode-strip"><span><i className={ctx.mode==='cloud'&&!ctx.syncError&&!ctx.syncBusy?'status-dot green':'status-dot'}/>{ctx.mode==='cloud'?ctx.syncError?tr('Synchronisation à reprendre','Sync needs attention'):ctx.syncBusy?tr('Synchronisation…','Syncing…'):tr('Compte synchronisé','Account synced'):tr('Démo locale · progression sur cet appareil','Local demo · progress on this device')}</span>{ctx.mode==='demo'?<Link href="/auth/">{tr('Connecter mon compte','Connect my account')}<ChevronRight size={12}/></Link>:<button onClick={()=>void ctx.refresh()} disabled={ctx.syncBusy}><RefreshCw size={13} className={ctx.syncBusy?'spin':''}/>{tr('Actualiser','Refresh')}</button>}</div>
   {ctx.syncError&&ctx.mode==='cloud'&&<div className="sync-warning" role="alert"><WifiOff size={17}/><span>{tr('Tes nouvelles réponses doivent être confirmées en ligne. Réessaie la synchronisation.','New answers need online confirmation. Retry synchronisation.')}</span><button onClick={()=>void ctx.refresh()}>{tr('Réessayer','Retry')}</button></div>}
   <main id="main" className={`main-content ${path.startsWith('/lesson/')?'lesson-main':''}`}>{children}</main>
   <footer className="app-footer"><span>autoquest <span>© 2026</span></span><span>{tr('Comprendre. Pratiquer. Construire.','Understand. Practise. Build.')}</span><Link href="/profile/">{tr('Mes données','My data')}</Link></footer>
  </div>
  <nav className="mobile-nav" aria-label={tr('Navigation mobile','Mobile navigation')}>{nav.filter(n=>n.href!=='/leaderboard/').map(n=><Link key={n.href} href={n.href} className={active(n.href)?'active':''} aria-current={active(n.href)?'page':undefined}><n.icon size={21}/><span>{tr(n.mobilefr,n.mobileen)}</span></Link>)}</nav>
 </div>;
}
