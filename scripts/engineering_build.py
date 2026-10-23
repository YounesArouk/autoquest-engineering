"""Expand the original 180 days into engineering study sessions and module exams."""
import json,math,re
from pathlib import Path
from engineering_units import UNITS,DAY_UNITS
from engineering_cases import case,L
VERSION='autoquest-engineering-2.0.0'
REFERENCES=[
 {'title':'NASA — Systems Engineering Handbook, Appendix','url':'https://www.nasa.gov/reference/system-engineering-handbook-appendix/','scope':L('Rédaction des exigences et matrices de preuve.','Requirement writing and evidence matrices.')},
 {'title':'NASA Glenn — Drag Equation','url':'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/','scope':L('Relation de traînée et rôle de la surface de référence.','Drag relationship and reference-area convention.')},
 {'title':'Bosch — CAN Protocols','url':'https://www.bosch-semiconductors.com/products/ip-modules/can-protocols/','scope':L('Présentation officielle des protocoles CAN et CAN FD.','Official CAN and CAN FD protocol overview.')},
 {'title':'NIST — Measurement Uncertainty','url':'https://physics.nist.gov/cuu/Uncertainty/','scope':L('Repères sur l’incertitude de mesure.','Measurement-uncertainty background.')}
]
EXAM_FAMILIES={
 1:['mechanics','electric','dynamics','structure'],2:['requirements','architecture','validation','system'],
 3:['configuration','change','industrial','validation'],4:['planning','programme','change','economics'],
 5:['discipline','measurement','electric','validation'],6:['network','software','diagnostic','architecture'],
 7:['safety','cyber','industrial','validation'],8:['economics','value','programme','architecture'],
 9:['data','configuration','validation','programme'],10:['mechanics','electric','requirements','economics']}

def tolerance(value,unit):
 if unit in ['configurations','unités','exigences','bit','code','octet']:return .01
 if unit=='probabilité':return max(1e-7,abs(value)*.001)
 if unit in ['ratio','mm','kg/s']:return max(.0002,abs(value)*.003)
 return max(.02,abs(value)*.003)

def activity(ident,lesson,kind,prompt,position,points,settings=None,choices=None):
 return {'id':ident,'lessonId':lesson,'position':position,'kind':kind,'points':points,'required':True,'revision':1,'prompt':prompt,'choices':choices or [],'settings':settings or {}}

def numeric(ident,lesson,c,index,pos,points):
 unit=c['units'][index];value=c['values'][index];tol=tolerance(value,unit)
 prompt={lang:c['given'][lang]+'\n\n'+c['asks'][lang][index] for lang in ['fr','en']}
 a=activity(ident,lesson,'numeric',prompt,pos,points,{'unit':unit,'toleranceLabel':L(f'Tolérance absolue ±{tol:.6g} {unit}.',f'Absolute tolerance ±{tol:.6g} {unit}.')})
 sol={'answer':{'value':value,'unit':unit,'abs_tolerance':tol},'rubric':{},'explanation':{lang:c['steps'][lang]+'\n\n'+c['limit'][lang] for lang in ['fr','en']}}
 return a,sol

def decision(ident,lesson,c,pos,points,seed):
 # Rotate correct position: no universal answer letter.
 labels=[c['decision'],*c['distractors']];offset=seed%3;ordered=labels[offset:]+labels[:offset]
 choices=[{'id':ident+f'_c{i+1}','position':i+1,'labels':v} for i,v in enumerate(ordered)]
 expected=choices[(3-offset)%3]['id']
 a=activity(ident,lesson,'single_choice',L(c['given']['fr']+'\n\nRevue technique : quelle décision est défendable avec les données et les limites du cas ?',c['given']['en']+'\n\nTechnical review: which decision is defensible given the case data and limitations?'),pos,points,choices=choices)
 return a,{'answer':{'choice_id':expected},'rubric':{},'explanation':{lang:c['decision'][lang]+' '+c['limit'][lang] for lang in ['fr','en']}}

def upgrade(root,dump,sql):
 root=Path(root);cat=json.loads((root/'src/data/catalog.json').read_text());solutions=json.loads((root/'data-source/demo-solutions.json').read_text())
 cat['version']=VERSION;cat['references']=REFERENCES;cat['exams']=[]
 seed=['-- Engineering v2 content; run after 003_engineering.sql.','BEGIN;',f"UPDATE public.app_metadata SET content_version={sql(VERSION)} WHERE id=1;"]
 def ins(table,values):
  seed.append(f'INSERT INTO {table} ({",".join(values)}) VALUES ({",".join(sql(v) for v in values.values())}) ON CONFLICT DO NOTHING;')
 counts=[]
 references=json.loads((root/'data-source/reference-chapters-fr.json').read_text())
 for meta in cat['lessons']:
  day=meta['day'];ident=meta['id'];path=root/f'public/data/lessons/{ident}.json';lesson=json.loads(path.read_text());key=DAY_UNITS[day];u=UNITS[key]
  worked=case(key,day);challenge=case(key,day+3)
  course={'unitId':key,'title':u['title'],'focus':lesson['cards'][0]['body'],'theory':u['theory'],'method':u['method'],'limits':u['limits'],'worked':{k:v for k,v in worked.items() if k not in ['values','distractors','decision']},'challenge':{k:v for k,v in challenge.items() if k not in ['values','steps','distractors','decision']},
  'recall':L('Sans regarder la suite, explique la notion du jour et dessine son entrée, sa transformation et sa sortie. Quelle différence ferais-tu entre une hypothèse et un résultat ?','Without looking ahead, explain today’s concept and draw its input, transformation and output. How do you distinguish an assumption from a result?'),
  'projectTask':lesson['cards'][-1]['body'],
  'brief':{lang:(f"DAY_{day:03d} — {meta['title'][lang]}\n\n"+('Ta mission : résoudre les trois questions numériques du nouveau cas, puis défendre une décision E-City. Ne recopie pas l’exemple : les valeurs ont changé. Relie le résultat au sujet précis du jour.\n\n1. Cadre : besoin, frontière et scénario. Nomme la baseline utilisée et la source de chaque donnée.\n2. Modèle : écris les équations, unités, conventions et deux hypothèses. Montre les calculs intermédiaires, pas seulement les nombres finaux.\n3. Sensibilité : modifie une entrée de +10 % ou −10 %, sans changer les autres. Recalcule la sortie et explique le mécanisme.\n4. Options : compare le maintien de la baseline et deux modifications réalistes. Distingue les contraintes obligatoires des critères de préférence ; une option inadmissible ne gagne pas par son prix.\n5. Décision : choisis provisoirement, justifie avec tes résultats et nomme un risque résiduel. Décris une donnée qui pourrait renverser ton choix.\n6. Validation : propose un scénario nominal, un scénario limite et un défaut. Pour chacun, écris stimulus, mesure, critère, configuration et propriétaire. Distingue ce que le PC peut démontrer de ce qui demandera un banc ou un véhicule.\n7. Restitution : rédige une synthèse de cinq lignes et prépare une défense orale de deux minutes. Termine par une phrase professionnelle en anglais.\n\nApplication spécifique : '+lesson['cards'][-1]['body']['fr']
  if lang=='fr' else 'Your mission: solve all three numerical questions in the new case, then defend an E-City decision. Do not copy the example: values have changed. Connect the result to today’s specific topic.\n\n1. Frame: need, boundary and scenario. Name baseline and sources for all inputs.\n2. Model: state equations, units, conventions and two assumptions. Show intermediate calculations rather than final numbers alone.\n3. Sensitivity: change one input by +10% or −10%, keeping others fixed. Recalculate the output and explain the mechanism.\n4. Options: compare retaining the baseline and two realistic changes. Separate mandatory constraints from preferences; an infeasible option cannot win on price.\n5. Decision: make a provisional choice, justify it with results and name a residual risk. Identify information that could reverse the choice.\n6. Validation: propose nominal, limiting and fault scenarios. For each name stimulus, measurement, criterion, configuration and owner. Distinguish PC evidence from bench or vehicle work.\n7. Presentation: write a five-line synthesis and prepare a two-minute oral defence. Finish with a professional sentence in English.\n\nSpecific application: '+lesson['cards'][-1]['body']['en'])) for lang in ['fr','en']},
  'rubric':{
   'fr':['Scénario, baseline, données et hypothèses identifiables.','Trois calculs avec unités et démarche vérifiable.','Sensibilité à une entrée et explication physique ou logique.','Trois options comparées avec contraintes obligatoires.','Décision, risque résiduel et condition de révision.','Trois preuves proposées avec critères et limites.'],
   'en':['Identifiable scenario, baseline, data and assumptions.','Three calculations with units and auditable reasoning.','Single-input sensitivity with physical or logical explanation.','Three options compared with mandatory constraints.','Decision, residual risk and reversal condition.','Three proposed evidence cases with criteria and limits.']},
  'pacing':[{'minutes':2,'label':L('Rappel actif','Active recall')},{'minutes':9,'label':L('Mini-cours et schéma','Mini-course and diagram')},{'minutes':5,'label':L('Exemple résolu','Worked example')},{'minutes':7,'label':L('Questions et calculs','Questions and calculations')},{'minutes':10,'label':L('Dossier ingénieur E-City','E-City engineering record')},{'minutes':2,'label':L('Synthèse orale','Oral synthesis')}],
  'prerequisites':L('Unités SI, algèbre élémentaire et notions des journées précédentes. Utilise une calculatrice ou un tableur ; une feuille de calcul est un livrable acceptable.','SI units, elementary algebra and earlier lessons. Use a calculator or spreadsheet; a calculation sheet is an acceptable deliverable.')}
  course['referenceFr']=min((p for p in references if day in p['days']),key=lambda p:len(p['days']))
  lesson['course']=course;lesson['minutes']=35;lesson['difficulty']=4;meta['minutes']=35;meta['difficulty']=4
  # Retain the original simple MCQ as an optional recall; engineering work drives completion.
  for old_activity in lesson['activities']:
   if old_activity['id'].startswith('check_'):
    old_activity['required']=False
    if old_activity['id'] in meta['requiredIds']:meta['requiredIds'].remove(old_activity['id'])
    seed.append(f"UPDATE public.activities SET required=false WHERE id={sql(old_activity['id'])};")
  extra=[]
  for j in range(3):
   a,sol=numeric(f'eng_{day:03d}_calc{j+1}',ident,challenge,j,20+j,20);extra.append((a,sol))
  extra.append(decision(f'eng_{day:03d}_review',ident,challenge,23,15,day))
  for a,sol in extra:
   lesson['activities'].append(a);meta['activityIds'].append(a['id']);meta['requiredIds'].append(a['id']);solutions[a['id']]=sol
   cat['activities'].append({k:a[k] for k in ['id','lessonId','kind','points']})
   ins('public.activities',{'id':a['id'],'lesson_id':ident,'kind':a['kind'],'points':a['points'],'required':True,'revision':1,'settings':a['settings'],'choices':a['choices']})
   ins('autoquest_private.activity_solutions',{'activity_id':a['id'],**sol})
  for k in ['activityIds','requiredIds']:lesson[k]=meta[k]
  reference_words=len(re.sub(r'<[^>]+>',' ',json.dumps(course['referenceFr']['blocks'],ensure_ascii=False)).split())
  counts.append({'day':day,'appliedReferenceFrWords':reference_words,**{lang:len(' '.join([course['focus'][lang],*course['theory'][lang],*course['method'][lang],course['worked']['given'][lang],course['worked']['steps'][lang],course['brief'][lang]]).split()) for lang in ['fr','en']}})
  dump(path,lesson)
 # Three unseen case blocks, each with 3 calculations and one decision: 12 scored questions/form.
 exam_solutions={}
 for mod in cat['modules']:
  number=mod['position'];exam_id=f'exam_{number:02d}'
  meta={'id':exam_id,'moduleId':mod['id'],'title':L('Examen de validation — '+mod['title']['fr'],'Validation exam — '+mod['title']['en']),'minutes':60,'threshold':80,'questionCount':12,'forms':['A','B']}
  cat['exams'].append(meta)
  ins('public.module_exams',{'id':exam_id,'module_id':mod['id'],'threshold':80,'revision':1})
  for form in ['A','B']:
   qs=[];blocks=[]
   # Integrate 3 different families. Fourth family rotates into form B.
   pool=EXAM_FAMILIES[number];keys=pool[:3] if form=='A' else [pool[1],pool[2],pool[3]]
   for block_index,key in enumerate(keys):
    c=case(key,1000+number*17+block_index*3+(4 if form=='B' else 0));block_id=f'{exam_id}_{form}_case{block_index+1}'
    blocks.append({'id':block_id,'title':UNITS[key]['title'],'given':c['given'],'formula':c['formula']})
    for j in range(3):
     qid=f'{block_id}_q{j+1}';a,sol=numeric(qid,'',c,j,len(qs)+1,0);a['blockId']=block_id;qs.append(a);exam_solutions[qid]=sol
    qid=f'{block_id}_decision';a,sol=decision(qid,'',c,len(qs)+1,0,number+block_index+(1 if form=='B' else 0));a['blockId']=block_id;qs.append(a);exam_solutions[qid]=sol
   exam={**meta,'form':form,'blocks':blocks,'questions':qs,'defence':L('Après correction, produis une page de revue de module : explique une erreur, relie deux disciplines, propose une preuve manquante et défends ta décision en cinq minutes. Cette soutenance est à relire par un pair ; elle n’entre pas dans la note automatique.','After marking, prepare a one-page module review: explain an error, connect two disciplines, propose missing evidence and defend your decision in five minutes. This defence needs peer review and is not automatically graded.')}
   dump(root/f'public/data/exams/{exam_id}_{form}.json',exam)
   ins('autoquest_private.exam_forms',{'exam_id':exam_id,'form':form,'questions':qs,'solutions':{q['id']:exam_solutions[q['id']] for q in qs}})
 cat['trainingHours']=105
 dump(root/'src/data/catalog.json',cat);dump(root/'data-source/demo-solutions.json',solutions);dump(root/'public/data/demo-solutions.json',solutions)
 dump(root/'data-source/demo-exam-solutions.json',exam_solutions);dump(root/'public/data/demo-exam-solutions.json',exam_solutions)
 seed.append("UPDATE public.lesson_progress p SET status='started',completed_at=NULL WHERE status='completed' AND EXISTS (SELECT 1 FROM public.activities a WHERE a.lesson_id=p.lesson_id AND a.required AND NOT EXISTS (SELECT 1 FROM autoquest_private.attempts t WHERE t.user_id=p.user_id AND t.activity_id=a.id AND t.activity_revision=a.revision AND t.outcome='correct'));")
 seed.append("UPDATE public.learner_stats s SET completed_count=(SELECT count(*) FROM public.lesson_progress p WHERE p.user_id=s.user_id AND p.status='completed'),revision=revision+1,updated_at=now();")
 seed.append('COMMIT;');(root/'supabase/004_engineering_seed.sql').write_text('\n'.join(seed)+'\n')
 dump(root/'docs/CONTENT_AUDIT.json',{'version':VERSION,'lessons':len(cat['lessons']),'activities':len(cat['activities']),'exams':10,'forms':20,'examQuestions':len(exam_solutions),'studyMinutesPerLesson':35,'durationIsEstimate':True,'wordCounts':counts,'source':'Original 180-day bilingual curriculum, expanded engineering mini-courses and parameterised cases.'})
 print(f'Engineering v2: {len(cat["activities"])} activities, 10 exams / 20 forms / {len(exam_solutions)} questions; minimum course+assignment words FR={min(x["fr"] for x in counts)}, EN={min(x["en"] for x in counts)}.')
