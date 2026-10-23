'use client';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {useLearning} from '@/components/Provider';
export default function NotFound(){const {tr}=useLearning();return <div className="not-found"><h1>404</h1><h2>{tr('Une autre route nous attend.','Another route is waiting.')}</h2><p>{tr('Cette page n’existe pas. Retrouve ton parcours automobile.','This page does not exist. Return to your automotive learning path.')}</p><Link className="btn primary" href="/learn/">{tr('Mon parcours','My path')}<ArrowRight size={17}/></Link></div>;}
