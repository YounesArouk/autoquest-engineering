# AutoQuest Engineering 2.0

Formation automobile autour d’E-City, véhicule électrique urbain fictif :
**conception, calcul, arbitrage et validation virtuelle**. Le format conserve
la progression interactive du site et développe le travail demandé à l’apprenant.

Le ZIP contient le **code Next.js/React/Tailwind**, une **démo compilée**, le
**backend Supabase SQL**, les sources pédagogiques et le kit GitHub E-City.
Le site n’est pas publié automatiquement dans un compte externe.

## 1. Essayer la démo

Extrais l’archive entièrement, puis ouvre `AutoQuest`.

Windows : double-clique sur `DEMARRER_WINDOWS.bat`.

Mac/Linux :

```sh
sh START_MAC_LINUX.sh
```

Python 3 est nécessaire. Le navigateur ouvre http://localhost:3000/ ; garde le
terminal ouvert. Node n’est pas requis pour cette démo déjà construite. En cas
de port occupé :

```sh
python3 scripts/serve_preview.py --port 3001
```

Sous Windows, remplace `python3` par `py` ou `python` selon l’installation.
Sur téléphone au même Wi-Fi, ouvre l’adresse réseau affichée. Le pare-feu doit
autoriser le serveur sur ton réseau privé. La démo garde ses données par
navigateur. Ouvrir directement `preview/index.html` ne suffit pas : les routes
et les contenus demandent HTTP, fourni par le lanceur.

## 2. Contenu et méthode

| Élément | Version Engineering |
|---|---|
| Parcours | Les 180 journées et les 10 modules du programme initial |
| Séance | 35 min conseillées ; travail actif généralement 20–45 min ou plus |
| Mini-cours | Notion du jour, fondations de la famille technique, méthode et limites |
| Approfondissement | 70 chapitres appliqués en français, affectés aux journées pertinentes |
| Visuels | 10 schémas bilingues, 60 SVG de référence, 5 familles de graphiques calculés, 3 photos créditées |
| Exemple | Données, équations, étapes résolues et limites du verdict |
| Activités | 1120 : 940 corrigées automatiquement et 180 travaux libres à relire |
| Nouveaux défis | Trois calculs et une décision technique par journée, en plus du socle existant |
| Dossier | Démarche des calculs, sensibilité, 3 options, décision, risque, 3 preuves |
| Évaluation | 10 examens, 2 sujets chacun, 12 questions par sujet, seuil 80 % |
| Projet | 20 missions Garage, plus application et dossier à chaque journée |

Les fondations sont partagées entre les journées d’un même sujet pour faciliter
la consolidation ; le titre, le concept et l’application du jour restent liés
au programme initial. Les cas paramétrés changent les données entre exemple et
entraînement. Les sujets d’examen combinent plusieurs familles de problèmes.
Ce n’est pas une promesse de 35 minutes de lecture seule : calcul et production
font partie du temps de séance. Il n’y a pas de verrou temporel artificiel.

Le cours principal, les activités et examens sont FR/EN. Les chapitres appliqués
supplémentaires reprennent le cours détaillé français ; ils sont présentés comme
références françaises lorsque l’interface est en anglais.

## 3. Validation et XP

Une leçon est marquée « entraînement réussi » lorsque toutes ses activités
obligatoires sont correctement résolues. Lire les écrans ou avancer avec les
boutons ne suffit pas. Les calculs acceptent une tolérance affichée, la virgule
ou le point, et imposent l’unité prévue.

La validation d’un module s’ouvre lorsque les entraînements de toutes ses
leçons sont réussis. L’examen blanc reste ouvert avant cela, mais **ne valide
jamais le module**, même à 100 %. Un sujet comporte trois cas avec trois
calculs et une décision par cas. Chaque question vaut un point. 10/12 donne
83,33 % et réussit ; 9/12 donne 75 % et échoue. Le corrigé apparaît uniquement
après remise des 12 réponses. Il n’y a pas d’attribution de XP pour les examens.
Une réussite antérieure reste acquise après une tentative de révision échouée.

Les exercices donnent leurs points une seule fois. Total maximal des activités
actuelles : **15 900 XP**. Les réponses libres, dossiers et missions ne donnent
ni points ni approbation automatique. Les cases du carnet constituent une
**auto-évaluation déclarative**. Les dossiers et la soutenance nécessitent une
relecture humaine ; aucune identité d’enseignant ou correction experte n’est
inventée. Ce parcours ne délivre pas un diplôme d’ingénieur ni une homologation.

## 4. Sauvegarde

| Donnée | Démo | Compte Supabase |
|---|---|---|
| XP, entraînements et notes d’examen | Navigateur | PostgreSQL, propriétaire du compte |
| Dossiers enregistrés | Navigateur | PostgreSQL, disponibles sur les appareils connectés |
| Brouillon non remis d’un examen | Ce navigateur | Ce navigateur également |
| Brouillon de carnet avant enregistrement | Ce navigateur | Ce navigateur, pas encore synchronisé |
| Classement | Vide | Participants réels ayant choisi d’y figurer |

Utilise **Enregistrer le dossier** pour confirmer sa sauvegarde. Le bouton
Markdown exporte la rédaction actuelle pour ton dépôt GitHub. La mise à jour
simultanée d’un même carnet suit la dernière écriture confirmée ; il n’y a pas
d’éditeur collaboratif avec fusion. Les dossiers ont une limite de 16 000
caractères. Le profil permet d’exporter un résumé JSON de progression.

Sur le même navigateur/origine, une démo v1 est reprise si aucune démo v2
n’existe : activités déjà réussies et XP correspondants sont conservés ; les
leçons avec nouveaux exercices sont rouvertes. La clé v1 reste intacte. Les
points de démo ne sont jamais importés dans un compte authentifié.

## 5. Développement

Node.js 22.12 minimum, Node 24 conseillé. Dépendances verrouillées :

```sh
npm ci
npm run dev
```

Contrôles et génération :

```sh
npm test
npm run typecheck
npm run prepare:data
npm run build
npm run preview
```

La préparation des données utilise Python 3 et sa bibliothèque standard. Les
SVG et chapitres appliqués sont fournis prêts à utiliser. `out/` est l’export de
production ; `preview/` est la copie déjà compilée distribuée dans le ZIP.
Après une modification et un build, `npm run preview` sert `out/`. Le lanceur
Windows/Mac sert `preview/` tant qu’il n’a pas été remplacé par le nouveau build.

## 6. Supabase — même compte sur téléphone et ordinateur

Crée un projet Supabase dédié. Pour une installation neuve, exécute **dans cet
ordre** dans SQL Editor :

1. `supabase/001_schema.sql`
2. `supabase/002_seed.sql`
3. `supabase/003_engineering.sql`
4. `supabase/004_engineering_seed.sql`

Pour mettre à niveau notre schéma v1 déjà installé, sauvegarde ton projet puis
exécute uniquement **003 et 004**. Les XP existants restent conservés ; les
leçons dont les nouvelles activités sont manquantes sont rouvertes. Le seed
n’ajoute aucun apprenant ni résultat de test. Ce parcours vise le schéma fourni,
pas une base métier différente ou modifiée manuellement.

Copie `.env.example` vers `.env.local`, avec **Project URL** et **publishable
key** de ton projet. La clé publique est prévue pour le navigateur ; une
`service_role` n’a jamais sa place dans ce fichier ou le frontend.

Dans Supabase Auth, règle Site URL et les redirect URLs sur tes vraies origines
locales/de production, dont `/auth/`. Active la méthode email/mot de passe et
configure la livraison des mails pour confirmations et récupération. Les flux
sont implémentés, mais leur livraison dépend des réglages de ton projet.

Le score, les prérequis d’examen et les corrections de compte sont calculés par
les RPC PostgreSQL. Les corrigés et tentatives sont dans `autoquest_private`,
inaccessible directement au navigateur. Les tables de progression sont lisibles
par leur propriétaire via RLS ; les écritures de score directes sont refusées.
La correction anonyme est sans mutation de compte. Le SQL doit être exécuté
avec un rôle d’administration par le propriétaire du projet, pas par un élève.

Un build avec les variables Supabase retire les **deux fichiers de corrigés
démo** des fichiers publics. Le ZIP de développement conserve évidemment les
sources et corrigés pour que tu puisses maintenir le cours ; n’expose pas tout
le dossier source comme répertoire statique public. La démo locale contient
ses corrigés et ne prétend pas être un environnement d’examen inviolable.

## 7. GitHub et Vercel

Crée un dépôt et envoie les sources depuis le dossier extrait :

```sh
git init
git add .
git commit -m "Build AutoQuest Engineering v2"
git branch -M main
git remote add origin https://github.com/TON_COMPTE/autoquest-engineering.git
git push -u origin main
```

Remplace l’URL par celle de ton dépôt. `.gitignore` exclut environnements,
node_modules, build et preview. Les données pédagogiques et SQL font partie du
code à versionner ; les secrets n’en font pas partie.

Importe le dépôt dans Vercel, utilise les réglages Next.js avec
`npm run build` et `out`, puis ajoute les deux variables publiques Supabase à
l’environnement de production. Configure ensuite les URL Auth avec le vrai
domaine Vercel ou ton domaine. Après publication, l’utilisateur ouvre le lien
sur mobile/PC et se connecte au même compte. Aucun abonnement ou déploiement
payant n’a été créé par ce ZIP.

## 8. Sources et contrôle qualité

- Sources initiales : `data-source/content_full.json` et programme 180 jours.
- Cours ajoutés : `scripts/engineering_units.py`.
- Cas et équations : `scripts/engineering_cases.py`.
- Chapitres français : `data-source/reference-chapters-fr.json`.
- Génération : `scripts/prepare_data.py` puis `engineering_build.py`.
- Provenance et licences : `docs/ASSETS_AND_SOURCES.md`.
- Résultats des contrôles et limites : `docs/VERIFICATION.md`.
- Inventaire pédagogique : `docs/CONTENT_AUDIT.json`.

Les valeurs E-City et cas d’examen sont pédagogiques. Un résultat de simulation
reste conditionné par son modèle, sa configuration et ses hypothèses. Les
références externes proposées dans l’application sont des lectures complémentaires,
pas des textes normatifs complets reproduits ou une preuve de conformité.
