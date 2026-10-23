"""Convert the supplied AutoLearning database export into website and Supabase data."""
import json
from pathlib import Path
from collections import defaultdict

ROOT=Path(__file__).resolve().parents[1]
def dump(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
def sql(value):
    if isinstance(value,bool):return 'true' if value else 'false'
    if isinstance(value,(dict,list)):return "'"+json.dumps(value,ensure_ascii=False,separators=(',',':')).replace("'","''")+"'::jsonb"
    if isinstance(value,int):return str(value)
    return "'"+str(value).replace("'","''")+"'"

def prepare():
    source=json.loads((ROOT/'data-source/content_full.json').read_text(encoding='utf-8'))
    t=source['tables']
    def loc(table,key,ident,field):
        return {r['locale']:r[field] for r in t[table] if r[key]==ident}
    lessons=[];modules=[];all_activities=[];solutions={};seed=['-- Original course seed. Run AFTER 001_schema.sql. Never seeds users.','BEGIN;']
    def insert(table,values):
        seed.append(f'INSERT INTO {table} ({",".join(values)}) VALUES ({",".join(sql(v) for v in values.values())}) ON CONFLICT DO NOTHING;')
    insert('public.app_metadata',{'id':1,'content_version':source['content_version']})
    for m in t['modules']:
        mod={'id':m['id'],'position':m['position'],'startDay':m['start_day'],'endDay':m['end_day'],'title':loc('module_i18n','module_id',m['id'],'title'),'summary':loc('module_i18n','module_id',m['id'],'summary')}
        modules.append(mod)
        insert('public.modules',{'id':m['id'],'position':m['position'],'title':mod['title']})
    solution_map={s['activity_id']:s for s in t['activity_solutions']}
    for l in sorted(t['lessons'],key=lambda x:x['source_day']):
        ident=l['id']; cards=[];activities=[]
        for c in sorted([c for c in t['cards'] if c['lesson_id']==ident],key=lambda x:x['position']):
            cards.append({'id':c['id'],'kind':c['kind'],'title':loc('card_i18n','card_id',c['id'],'title'),'body':loc('card_i18n','card_id',c['id'],'body'),'assetId':c['asset_id']})
        meta={'id':ident,'moduleId':l['module_id'],'day':l['source_day'],'title':loc('lesson_i18n','lesson_id',ident,'title'),'minutes':l['estimated_minutes'],'difficulty':l['difficulty'],'activityIds':[],'requiredIds':[],'assetId':cards[0]['assetId']}
        insert('public.lessons',{'id':ident,'module_id':l['module_id'],'source_day':l['source_day'],'title':meta['title'],'content_revision':l['content_revision']})
        for a in sorted([a for a in t['activities'] if a['lesson_id']==ident],key=lambda x:x['position']):
            choices=[]
            for c in sorted([c for c in t['choices'] if c['activity_id']==a['id']],key=lambda x:x['position']):
                choices.append({'id':c['id'],'position':c['position'],'labels':loc('choice_i18n','choice_id',c['id'],'label')})
            activity={'id':a['id'],'lessonId':ident,'position':a['position'],'kind':a['kind'],'points':a['points'],'required':bool(a['required']),'revision':a['revision'],'prompt':loc('activity_i18n','activity_id',a['id'],'prompt'),'choices':choices,'settings':json.loads(a['settings_json'])}
            activities.append(activity);all_activities.append({k:activity[k] for k in ['id','lessonId','kind','points']})
            meta['activityIds'].append(a['id'])
            if a['required']:meta['requiredIds'].append(a['id'])
            insert('public.activities',{'id':a['id'],'lesson_id':ident,'kind':a['kind'],'points':a['points'],'required':bool(a['required']),'revision':a['revision'],'settings':activity['settings'],'choices':choices})
            s=solution_map[a['id']]
            solution={'answer':json.loads(s['answer_json']),'rubric':json.loads(s['rubric_json']),'explanation':loc('activity_i18n','activity_id',a['id'],'explanation')}
            solutions[a['id']]=solution
            insert('autoquest_private.activity_solutions',{'activity_id':a['id'],**solution})
        lessons.append(meta)
        detail={**meta,'objective':loc('lesson_i18n','lesson_id',ident,'objective'),'cards':cards,'activities':activities,'sourcePage':l['source_page'],'editorialStatus':l['editorial_status']}
        dump(ROOT/f'public/data/lessons/{ident}.json',detail)
    assets=[{'id':a['id'],'path':'/diagrams/'+Path(a['path']).name,'alt':loc('asset_i18n','asset_id',a['id'],'alt_text')} for a in t['assets']]
    missions=[]
    for s in sorted(t['project_steps'],key=lambda x:x['day']):
        ident=s['id']; mission={'id':ident,'day':s['day'],'title':loc('project_step_i18n','step_id',ident,'title'),'goal':loc('project_step_i18n','step_id',ident,'goal'),'instructions':{lang:json.loads(txt) for lang,txt in loc('project_step_i18n','step_id',ident,'instructions_json').items()},'acceptance':loc('project_step_i18n','step_id',ident,'acceptance'),'oralQuestion':loc('project_step_i18n','step_id',ident,'oral_question'),'files':json.loads(s['expected_files_json']),'commit':s['suggested_commit'],'lessonIds':[x['lesson_id'] for x in t['project_step_lessons'] if x['step_id']==ident]}
        missions.append(mission);insert('public.project_steps',{'id':ident,'day':s['day'],'title':mission['title']})
    glossary=[{'id':g['id'],'term':loc('glossary_i18n','term_id',g['id'],'term'),'definition':loc('glossary_i18n','term_id',g['id'],'definition'),'lessonId':g['introduced_in']} for g in t['glossary']]
    catalog={'version':source['content_version'],'modules':modules,'lessons':lessons,'activities':all_activities,'assets':assets,'missions':missions,'glossary':glossary}
    dump(ROOT/'src/data/catalog.json',catalog)
    dump(ROOT/'data-source/demo-solutions.json',solutions)
    # Local demo only. prepare-build.mjs removes this in configured cloud builds.
    dump(ROOT/'public/data/demo-solutions.json',solutions)
    seed.append('COMMIT;')
    (ROOT/'supabase/002_seed.sql').write_text('\n'.join(seed)+'\n',encoding='utf-8')
    print(f'Prepared {len(lessons)} lessons, {len(all_activities)} activities and {len(missions)} missions.')

if __name__=='__main__':
    prepare()
    from engineering_build import upgrade
    upgrade(ROOT,dump,sql)
