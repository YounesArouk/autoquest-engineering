import type {Metadata,Viewport} from 'next';
import {Provider} from '@/components/Provider';
import {Shell} from '@/components/Shell';
import './globals.css';
export const metadata:Metadata={title:'AutoQuest Engineering — Formation automobile',description:'180 cours développés, calculs, dossiers techniques, 10 examens et projet E-City. Apprends l’ingénierie automobile en français et anglais.',applicationName:'AutoQuest',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/icons/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f7f9fc',viewportFit:'cover'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body><Provider><Shell>{children}</Shell></Provider></body></html>;}
