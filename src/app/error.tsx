'use client';
export default function Error({reset}:{reset:()=>void}){return <div className="error-box"><h2>Un petit arrêt au stand.</h2><p>Recharge le contenu pour continuer. / Reload to keep learning.</p><button className="btn primary" onClick={reset}>Réessayer / Try again</button></div>;}
