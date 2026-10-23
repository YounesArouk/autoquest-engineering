"""Deterministic, auditable engineering cases with worked and assessment variants."""
from math import pi,atan,sin,cos

def L(fr,en):return {'fr':fr,'en':en}
def case(key,seed):
 s=seed%7
 def n(x):return f'{x:.4f}'.rstrip('0').rstrip('.')
 def out(gfr,gen,formula,stepsfr,stepsen,vals,units,asksfr,asksen,correctfr,correcten,bad1fr,bad1en,bad2fr,bad2en,limitfr,limiten):
  return {'given':L(gfr,gen),'formula':formula,'steps':L(stepsfr,stepsen),'values':vals,'units':units,'asks':{'fr':asksfr,'en':asksen},'decision':L(correctfr,correcten),'distractors':[L(bad1fr,bad1en),L(bad2fr,bad2en)],'limit':L(limitfr,limiten)}
 if key in ['system','electric','integration']:
  e=26+s;f=.8;c=130+7*s;hot=c+20;eu=e*f;r=1000*eu/c;r2=1000*eu/hot;req=150*hot/1000
  return out(f'Batterie brute {e} kWh ; fenêtre utile 80 % ; consommation nominale {c} Wh/km, scénario dégradé {hot} Wh/km ; cible 150 km.',f'Gross battery {e} kWh; usable window 80%; nominal consumption {c} Wh/km, degraded case {hot} Wh/km; target 150 km.',
  'Eutile = Ebrute × f ; R = 1000 Eutile / c ; Erequise = Rtarget × c / 1000',
  f'1. Énergie utile : {e} × 0,80 = {n(eu)} kWh.\n2. Convertir en Wh : {n(eu*1000)} Wh.\n3. Autonomie nominale : {n(eu*1000)} / {c} = {n(r)} km.\n4. Autonomie dégradée : {n(eu*1000)} / {hot} = {n(r2)} km.\n5. Besoin utile pour 150 km dégradés : 150 × {hot}/1000 = {n(req)} kWh. Comparer séparément chaque scénario à 150 km.',
  f'1. Usable energy: {e} × 0.80 = {n(eu)} kWh.\n2. Convert to Wh: {n(eu*1000)} Wh.\n3. Nominal range: {n(eu*1000)} / {c} = {n(r)} km.\n4. Degraded range: {n(eu*1000)} / {hot} = {n(r2)} km.\n5. Usable energy for 150 degraded kilometres: 150 × {hot}/1000 = {n(req)} kWh. Compare each scenario separately with 150 km.',
  [r,r2,req],['km','km','kWh'],['Calcule l’autonomie nominale.','Calcule l’autonomie dans le scénario dégradé.','Calcule l’énergie utile nécessaire pour 150 km dégradés.'],['Calculate nominal range.','Calculate degraded-case range.','Calculate usable energy needed for 150 degraded kilometres.'],
  'Conserver deux verdicts conditionnels et étudier masse, thermique et consommation avant d’augmenter la batterie.','Keep separate conditional verdicts and examine mass, thermal limits and consumption before increasing battery capacity.',
  'Utiliser l’énergie brute pour tous les scénarios, puisque la fenêtre ne change que la recharge.','Use gross energy in every scenario because the window only affects charging.',
  'Moyenner les deux autonomies pour déclarer la cible satisfaite dans les deux cas.','Average both ranges to declare that both scenarios meet the target.',
  'La consommation est supposée constante et indépendante de la masse ; le résultat ne prouve pas une autonomie sur cycle réel.','Consumption is assumed constant and independent of mass; this does not establish actual drive-cycle range.')
 if key=='mechanics':
  m=1200+25*s;vkm=70+2*s;v=vkm/3.6;p=.08;th=atan(p);crr=.012;rho=1.225;cda=.64;r=.28;i=9;eff=.95;glob=.90;aux=.8
  fr=crr*m*9.81*cos(th);fa=.5*rho*cda*v*v;fg=m*9.81*sin(th);force=fr+fa+fg;pw=force*v/1000;pm=pw/eff;pb=pw/glob+aux;rpm=60*v*i/(2*pi*r)
  return out(f'Masse {m} kg ; vitesse {vkm} km/h ; pente 8 % ; Crr 0,012 ; ρ 1,225 kg/m³ ; CdA 0,64 m² ; rayon 0,28 m ; rapport 9 ; ηréducteur 0,95 ; ηglobal batterie-roues 0,90 ; auxiliaires 0,8 kW ; a = 0 ; sans vent.',f'Mass {m} kg; speed {vkm} km/h; grade 8%; Crr 0.012; ρ 1.225 kg/m³; CdA 0.64 m²; radius 0.28 m; ratio 9; gear efficiency 0.95; overall battery-wheel efficiency 0.90; auxiliaries 0.8 kW; a = 0; still air.',
  'θ = atan(0.08) ; F = Crr mg cosθ + ½ρCdA v² + mg sinθ ; Pwheel = Fv ; Pmotor = Pwheel/0.95 ; Pbatt = Pwheel/0.90 + Paux',
  f'1. v = {n(v)} m/s ; θ = {n(th)} rad.\n2. Roulement {n(fr)} N ; aéro {n(fa)} N ; pente {n(fg)} N.\n3. Total {n(force)} N ; roues {n(pw)} kW.\n4. Machine {n(pm)} kW ; batterie {n(pb)} kW. Les deux rendements ne se divisent pas successivement : le global inclut la chaîne.\n5. Régime machine 60vi/(2πr) = {n(rpm)} tr/min.',
  f'1. v = {n(v)} m/s; θ = {n(th)} rad.\n2. Rolling {n(fr)} N; drag {n(fa)} N; grade {n(fg)} N.\n3. Total {n(force)} N; wheel power {n(pw)} kW.\n4. Machine {n(pm)} kW; battery {n(pb)} kW. Do not divide sequentially by both efficiencies: the overall value already covers the chain.\n5. Machine speed 60vi/(2πr) = {n(rpm)} rpm.',
  [pm,pb,rpm],['kW','kW','tr/min'],['Calcule la puissance mécanique machine.','Calcule la puissance électrique batterie, auxiliaires compris.','Calcule le régime machine.'],['Calculate machine mechanical power.','Calculate battery electrical power including auxiliaries.','Calculate machine speed.'],
  'Vérifier puissance continue, couple-régime et thermique ; le seul calcul de puissance ne clôture pas le choix moteur.','Check continuous power, torque-speed envelope and thermal behaviour; power alone cannot close motor selection.',
  'Valider le moteur avec sa puissance crête, même si la durée admissible est inconnue.','Approve using peak power even though its admissible duration is unknown.',
  'Diviser la puissance roues par 0,95 puis par 0,90 avant d’ajouter les auxiliaires.','Divide wheel power by 0.95 and then by 0.90 before adding auxiliaries.',
  'Rendements constants, inerties tournantes et transitoires omis.','Constant efficiencies; rotating inertia and transients omitted.')
 if key=='ice':
  t=80+10*s;rpm=2500+100*s;bsfc=240+5*s;eff=.32;pw=t*2*pi*rpm/60/1000;flow=pw*bsfc/1000;heat=pw/eff-pw
  return out(f'Point moteur {t} N·m à {rpm} tr/min ; BSFC {bsfc} g/kWh ; rendement thermique supposé 0,32. Calcul stationnaire.',f'Engine point {t} N·m at {rpm} rpm; BSFC {bsfc} g/kWh; assumed thermal efficiency 0.32. Steady state.',
  'P = T × 2πn/60 ; ṁfuel = P[kW] × BSFC /1000 ; Ploss = P/η − P',
  f'1. ω = 2π × {rpm}/60 rad/s.\n2. P = {t}ω/1000 = {n(pw)} kW.\n3. Débit = {n(pw)} × {bsfc}/1000 = {n(flow)} kg/h.\n4. Puissance chimique = {n(pw/eff)} kW ; pertes totales = {n(heat)} kW. Elles ne vont pas toutes au liquide de refroidissement.',
  f'1. ω = 2π × {rpm}/60 rad/s.\n2. P = {t}ω/1000 = {n(pw)} kW.\n3. Flow = {n(pw)} × {bsfc}/1000 = {n(flow)} kg/h.\n4. Chemical power = {n(pw/eff)} kW; total losses = {n(heat)} kW. These losses do not all enter the coolant.',
  [pw,flow,heat],['kW','kg/h','kW'],['Calcule la puissance mécanique.','Calcule le débit massique de carburant.','Calcule les pertes totales.'],['Calculate mechanical power.','Calculate fuel mass flow.','Calculate total losses.'],
  'Conserver ce point stationnaire et demander carte, transitoires, vitesse véhicule et densité avant de conclure en L/100 km.','Retain this steady operating point and request maps, transients, road speed and density before concluding in L/100 km.',
  'Présenter directement le débit en kg/h comme une consommation en L/100 km.','Present kg/h directly as L/100 km.',
  'Affecter toutes les pertes à l’échangeur liquide sans autre bilan.','Assign every loss to the coolant heat exchanger without another balance.',
  'Le rendement et la BSFC sont des hypothèses d’exercice ; ni émissions ni cycle complet ne sont calculés.','Efficiency and BSFC are exercise assumptions; emissions and a full cycle are not calculated.')
 if key=='dynamics':
  m=1200+25*s;vk=50+2*s;v=vk/3.6;delay=.30;mu=.35;ad=5;nom=v*delay+v*v/(2*ad);low=v*delay+v*v/(2*min(ad,mu*9.81));load=m*ad*.5/2.5
  return out(f'Masse {m} kg ; vitesse {vk} km/h ; délai 0,30 s ; décélération demandée 5 m/s² ; cas sec μ = 0,80 ; cas faible adhérence μ = 0,35 ; h = 0,50 m ; L = 2,50 m ; route plane.',f'Mass {m} kg; speed {vk} km/h; delay 0.30 s; requested deceleration 5 m/s²; dry μ = 0.80; low-grip μ = 0.35; h = 0.50 m; L = 2.50 m; level road.',
  'a = min(ademand, μg) ; d = vT + v²/(2a) ; ΔFz = mah/L',
  f'1. v = {n(v)} m/s.\n2. À sec μg = 7,848 m/s² : a = 5 ; d = {n(nom)} m.\n3. Faible adhérence μg = 3,4335 m/s² : d = {n(low)} m.\n4. Transfert à a = 5 : {n(load)} N de l’arrière vers l’avant.\n5. Le verdict de chaque cible reste lié à son coefficient μ et à sa vitesse.',
  f'1. v = {n(v)} m/s.\n2. Dry μg = 7.848 m/s²: a = 5; d = {n(nom)} m.\n3. Low-grip μg = 3.4335 m/s²: d = {n(low)} m.\n4. Load transfer at a = 5: {n(load)} N rear to front.\n5. Each target verdict retains its own μ and speed conditions.',
  [nom,low,load],['m','m','N'],['Calcule la distance d’arrêt à sec.','Calcule la distance en faible adhérence.','Calcule le transfert de charge à 5 m/s².'],['Calculate dry stopping distance.','Calculate low-grip stopping distance.','Calculate load transfer at 5 m/s².'],
  'Borner la décélération par l’adhérence et garder deux scénarios, puis examiner la rampe de freinage.','Bound deceleration by adhesion, retain both scenarios and examine brake build-up.',
  'Conserver 5 m/s² sur faible adhérence parce que le calculateur le demande.','Keep 5 m/s² on low grip because the controller requests it.',
  'Retirer la distance de délai parce que le véhicule est déjà équipé de freins.','Remove delay distance because brakes are installed.',
  'Décélération constante après délai, sans pente ni variation de μ.','Constant deceleration after delay, no grade or varying μ.')
 if key=='structure':
  f=8000+650*s;a=80+3*s;length=150;young=70000;stress=f/a;delta=f*length/(young*a);mass=2700*(a*1e-6)*(length*1e-3)
  return out(f'Barre pédagogique en traction : F = {f} N ; A = {a} mm² ; L = 150 mm ; E = 70 000 N/mm² ; densité 2 700 kg/m³. Aucun trou ni flexion dans ce modèle.',f'Educational tension bar: F = {f} N; A = {a} mm²; L = 150 mm; E = 70,000 N/mm²; density 2,700 kg/m³. No holes or bending in this model.',
  'σ = F/A ; δ = FL/(EA) ; m = ρAL',
  f'1. Contrainte = {f}/{a} = {n(stress)} N/mm² = MPa.\n2. Allongement = {f} × 150/(70000 × {a}) = {n(delta)} mm.\n3. Volume = {a} × 150 mm³ = {n(a*150*1e-9)} m³ ; masse = {n(mass)} kg.\n4. Une réduction de 20 % de A multiplie contrainte et allongement par 1/0,8 = 1,25.',
  f'1. Stress = {f}/{a} = {n(stress)} N/mm² = MPa.\n2. Extension = {f} × 150/(70000 × {a}) = {n(delta)} mm.\n3. Volume = {a} × 150 mm³ = {n(a*150*1e-9)} m³; mass = {n(mass)} kg.\n4. Reducing A by 20% multiplies stress and extension by 1/0.8 = 1.25.',
  [stress,delta,stress/0.8],['MPa','mm','MPa'],['Calcule la contrainte nominale.','Calcule l’allongement.','Calcule la contrainte après réduction de section de 20 %.'],['Calculate nominal stress.','Calculate extension.','Calculate stress after a 20% area reduction.'],
  'Vérifier la limite, les concentrations, la fatigue et les fixations avant d’appliquer cette réduction à un support.','Check limits, concentrations, fatigue and joints before applying this reduction to a bracket.',
  'Valider le crash à partir de la seule contrainte nominale.','Approve crash performance from nominal stress alone.',
  'Affirmer que réduire la section réduit aussi la contrainte parce que la pièce est plus légère.','Claim reducing area also reduces stress because the part is lighter.',
  'Traction uniforme seulement : aucun dimensionnement de structure véhicule réelle.','Uniform tension only: not real vehicle structural sizing.')
 if key=='requirements':
  cam=60+5*s;rad=40;align=20;fusion=25;dec=15;net=10;brake=120;total=max(cam,rad)+align+fusion+dec+net+brake;margin=300-total;limit=300-(max(cam,rad)+align+dec+net+brake)
  return out(f'Caméra {cam} ms et radar {rad} ms en parallèle ; ensuite alignement 20, fusion 25, décision 15, réseau 10 et actionneur 120 ms en série. Cible fictive : 300 ms.',f'Camera {cam} ms and radar {rad} ms in parallel; then alignment 20, fusion 25, decision 15, network 10 and actuator 120 ms sequentially. Fictional target: 300 ms.',
  'T = max(Tcam, Trad) + Talign + Tfusion + Tdecision + Tnetwork + Tactuator ; marge = 300 − T',
  f'1. Acquisition limitante : max({cam},40) = {cam} ms.\n2. Chaîne = {cam}+20+25+15+10+120 = {total} ms.\n3. Marge nominale = 300−{total} = {margin} ms.\n4. Budget fusion maximal, autres temps inchangés : {limit} ms.\n5. Un délai de file ou une donnée déjà âgée exige une extension du modèle.',
  f'1. Limiting acquisition: max({cam},40) = {cam} ms.\n2. Chain = {cam}+20+25+15+10+120 = {total} ms.\n3. Nominal margin = 300−{total} = {margin} ms.\n4. Maximum fusion budget with other times fixed: {limit} ms.\n5. Queue delay or already-old data requires extending the model.',
  [total,margin,limit],['ms','ms','ms'],['Calcule le délai de chaîne.','Calcule la marge nominale.','Calcule le budget fusion maximal.'],['Calculate chain delay.','Calculate nominal margin.','Calculate maximum fusion budget.'],
  'Définir endpoints et pire cas avant de considérer la marge nominale comme une preuve de deadline.','Define endpoints and worst case before treating nominal margin as deadline evidence.',
  'Additionner caméra et radar même si les acquisitions sont parallèles dans le modèle donné.','Add camera and radar times even though acquisition is parallel in this model.',
  'Utiliser seulement le maximum de tous les temps, y compris ceux en série.','Use only the maximum of all delays, including sequential stages.',
  'Pas de gigue, file ou désynchronisation modélisée ; cible purement pédagogique.','No jitter, queues or asynchronous effects modelled; educational target only.')
 if key=='architecture':
  torque=10+2*s;res=.1;raw=round(torque/res);lo=raw%256;hi=raw//256;wrong=(lo*256+hi)*res
  return out(f'Demande de couple {torque} N·m ; codage entier non signé uint16, résolution 0,1 N·m/bit, offset zéro, little-endian. Le décodage inversé utilise aussi uint16.',f'Torque demand {torque} N·m; unsigned uint16 integer, resolution 0.1 N·m/bit, zero offset, little-endian. Reversed decoding also uses uint16.',
  'raw = torque / resolution ; byte0 = raw mod 256 ; byte1 = floor(raw/256) ; wrong = (256 byte0 + byte1) × resolution',
  f'1. Valeur entière = {torque}/0,1 = {raw}.\n2. Octets décimaux little-endian : [{lo}, {hi}] ; hex : [{lo:02X}, {hi:02X}].\n3. Lecture inversée : 256×{lo}+{hi} = {lo*256+hi} pas ; couple apparent {n(wrong)} N·m.\n4. Un aller-retour indépendant vérifie le codage ; domaine, validité et timeout demandent d’autres tests.',
  f'1. Integer = {torque}/0.1 = {raw}.\n2. Little-endian decimal bytes: [{lo}, {hi}]; hex: [{lo:02X}, {hi:02X}].\n3. Reversed decoding: 256×{lo}+{hi} = {lo*256+hi} counts; apparent torque {n(wrong)} N·m.\n4. An independent round trip checks encoding; range, validity and timeout require additional tests.',
  [raw,wrong,lo],['code','N·m','octet'],['Calcule la valeur entière brute.','Calcule le couple obtenu par lecture inversée.','Donne la valeur décimale du premier octet transmis.'],['Calculate raw integer value.','Calculate torque after reversed-byte decoding.','Give the decimal value of the first transmitted byte.'],
  'Fixer et tester unité, signe, ordre des octets, domaine et réaction au défaut dans l’ICD.','Specify and test unit, sign, byte order, range and fault response in the ICD.',
  'Corriger par un gain de calibration sans modifier le contrat d’interface ni tester les limites.','Apply a calibration gain without fixing the interface contract or testing limits.',
  'Accepter l’échange parce que les deux équipements sont conformes à leurs spécifications locales.','Accept the exchange because both devices meet their local specifications.',
  'Le contrat de cet exercice est uint16. Domaine, saturation et validité demandent des tests supplémentaires.','This exercise uses uint16. Range, saturation and validity need additional tests.')
 if key=='validation':
  total=30+s*2;covered=total-3;executed=24+s;passed=executed-2;cov=covered/total*100;rate=passed/executed*100;gap=total-covered
  return out(f'{total} exigences applicables ; {covered} ont une preuve approuvée ; {executed} essais exécutés, dont {passed} réussis et 2 échoués. Un échec est critique. Les deux populations sont distinctes.',f'{total} applicable requirements; {covered} have approved evidence; {executed} tests executed, {passed} passed and 2 failed. One failure is critical. The populations are distinct.',
  'Coverage = requirements with approved evidence / applicable requirements ; pass rate = passed / executed',
  f'1. Couverture exigences = {covered}/{total}×100 = {n(cov)} %.\n2. Réussite essais = {passed}/{executed}×100 = {n(rate)} %.\n3. Exigences sans preuve approuvée = {gap}.\n4. Le dénominateur des essais ne remplace pas celui des exigences. L’échec critique doit être traité explicitement, quel que soit le pourcentage.',
  f'1. Requirement coverage = {covered}/{total}×100 = {n(cov)}%.\n2. Test pass rate = {passed}/{executed}×100 = {n(rate)}%.\n3. Requirements without approved evidence = {gap}.\n4. Test and requirement denominators are not interchangeable. Address the critical failure explicitly regardless of percentage.',
  [cov,rate,gap],['%','%','exigences'],['Calcule la couverture des exigences.','Calcule le taux de réussite des essais exécutés.','Compte les exigences sans preuve approuvée.'],['Calculate requirement coverage.','Calculate executed-test pass rate.','Count requirements without approved evidence.'],
  'Garder visibles l’échec critique, les exigences sans preuve et les configurations ; décider un plan de fermeture.','Keep the critical failure, unproven requirements and configurations visible; decide a closure plan.',
  'Moyenner les deux pourcentages pour annoncer une conformité véhicule unique.','Average the percentages to announce a single vehicle-compliance rate.',
  'Reclasser les deux échecs comme non exécutés pour améliorer le taux.','Reclassify failures as not executed to improve the rate.',
  'Les comptes sont fictifs et n’établissent pas la qualité des méthodes de preuve.','Counts are fictional and do not establish evidence-method quality.')
 if key=='configuration':
  a=2;b=3;c=2+s%2;d=2;all_=a*b*c*d;invalid=2+s;valid=all_-invalid;tested=valid-3
  return out(f'Choix indépendants avant règles : batteries {a}, logiciels {b}, marchés {c}, options de capteur {d}. Les règles excluent {invalid} combinaisons distinctes. {tested} configurations admissibles ont été testées.',f'Independent choices before rules: batteries {a}, software versions {b}, markets {c}, sensor options {d}. Rules exclude {invalid} distinct combinations. {tested} admissible configurations have been tested.',
  'Candidates = product of option counts ; admissible = candidates − distinct exclusions ; coverage = tested/admissible',
  f'1. Produit cartésien = {a}×{b}×{c}×{d} = {all_}.\n2. Admissibles = {all_}−{invalid} = {valid}.\n3. Couverture configuration = {tested}/{valid}×100 = {n(tested/valid*100)} %.\n4. Les exclusions sont distinctes ; s’il y avait recouvrement, il faudrait dédupliquer avant soustraction.',
  f'1. Cartesian product = {a}×{b}×{c}×{d} = {all_}.\n2. Admissible = {all_}−{invalid} = {valid}.\n3. Configuration coverage = {tested}/{valid}×100 = {n(tested/valid*100)}%.\n4. Exclusions are distinct; overlapping exclusions would need deduplication.',
  [all_,valid,tested/valid*100],['configurations','configurations','%'],['Compte les combinaisons candidates.','Compte les configurations admissibles.','Calcule la couverture des configurations.'],['Count candidate combinations.','Count admissible configurations.','Calculate configuration coverage.'],
  'Versionner les règles d’effectivité et associer chaque résultat à la combinaison réellement testée.','Version effectivity rules and connect results to the configuration actually tested.',
  'Utiliser seulement la version logicielle comme preuve de configuration complète.','Use software version alone as complete configuration evidence.',
  'Soustraire chaque règle indépendamment même si plusieurs excluent la même combinaison.','Subtract each rule independently even when several exclude the same combination.',
  'Une couverture combinatoire ne prouve pas que les scénarios de défaillance sont couverts.','Combinatorial coverage does not establish failure-scenario coverage.')
 if key=='change':
  nunit=800+100*s;du=12+s;eng=18000;test=7000;stock=3000;total=eng+test+stock+nunit*du;per=total/nunit
  return out(f'Population effective {nunit} véhicules ; surcoût récurrent {du} €/véhicule ; ingénierie 18 000 €, requalification 7 000 €, stock 3 000 €. Coûts fixes distincts ; pas d’actualisation.',f'Effective population {nunit} vehicles; recurring increase €{du}/vehicle; engineering €18,000, requalification €7,000, stock €3,000. Distinct fixed costs; no discounting.',
  'ΔCost = engineering + requalification + stock + effective volume × recurring delta',
  f'1. Récurrent = {nunit}×{du} = {nunit*du} €.\n2. Fixe = 18000+7000+3000 = 28000 €.\n3. Impact total = {total} €.\n4. Impact moyen sur population = {n(per)} €/véhicule ; ce n’est pas le nouveau coût récurrent.\n5. Impact exigences, interfaces et preuves reste à analyser.',
  f'1. Recurring = {nunit}×{du} = €{nunit*du}.\n2. Fixed = 18000+7000+3000 = €28000.\n3. Total impact = €{total}.\n4. Average population impact = €{n(per)}/vehicle, not the new recurring cost.\n5. Requirement, interface and evidence impacts still need analysis.',
  [total,per,nunit*du],['€','€/véhicule','€'],['Calcule le coût total du changement.','Calcule l’impact moyen par véhicule effectif.','Calcule la seule composante récurrente totale.'],['Calculate total change cost.','Calculate average cost per affected vehicle.','Calculate total recurring component only.'],
  'Décider après analyse technique, puis fixer effectivité, non-régression et fermeture documentée.','Decide after technical analysis, then set effectivity, regression evidence and documented closure.',
  'Clôturer dès que la commande fournisseur est passée, sans vérification.','Close when the supplier order is placed, without verification.',
  'Limiter le coût au surcoût unitaire et ignorer qualification et stock.','Count only unit delta and ignore qualification and inventory.',
  'Pas de coût délai ni de retour terrain inclus ; annoncer clairement ces exclusions.','Schedule and field-return costs are excluded and must be declared.')
 if key=='industrial':
  total=1000+100*s;first=total-80;rework=50;fpy=first/total*100;final=(first+rework)/total*100;bad=total-first-rework
  return out(f'{total} unités entrantes ; {first} bonnes sans reprise ; 50 autres récupérées après retouche ; le reste est rebuté. Groupes disjoints.',f'{total} incoming units; {first} good without rework; 50 additional units recovered by rework; remainder scrapped. Groups are disjoint.',
  'FPY = first-pass good / incoming ; final yield = (first-pass good + recovered)/incoming',
  f'1. FPY = {first}/{total}×100 = {n(fpy)} %.\n2. Rendement final = ({first}+50)/{total}×100 = {n(final)} %.\n3. Rebuts = {total}−{first}−50 = {bad}.\n4. Les 50 reprises coûtent du temps et des ressources, même si elles sont finalement bonnes.',
  f'1. FPY = {first}/{total}×100 = {n(fpy)}%.\n2. Final yield = ({first}+50)/{total}×100 = {n(final)}%.\n3. Scrap = {total}−{first}−50 = {bad}.\n4. Rework consumes time and resources even when the units ultimately pass.',
  [fpy,final,bad],['%','%','unités'],['Calcule le rendement de premier passage.','Calcule le rendement final.','Compte les unités rebutées.'],['Calculate first-pass yield.','Calculate final yield.','Count scrapped units.'],
  'Suivre premier passage, retouches et rebuts séparément, puis démontrer une cause avant correction.','Track first pass, rework and scrap separately, then demonstrate a cause before correcting.',
  'Annoncer le rendement final comme FPY et supprimer les retouches du dashboard.','Call final yield FPY and remove rework from the dashboard.',
  'Déclarer la production maîtrisée parce qu’une unité prototype a réussi.','Declare production controlled because one prototype passed.',
  'Le rendement seul ne démontre ni capabilité ni stabilité du procédé.','Yield alone establishes neither capability nor process stability.')
 if key=='planning':
  a=3+s;b=7;c=5+s%3;d=2;dur=a+max(b,c)+d;floatc=max(b,c)-c;short=a+max(b-2,c)+d
  return out(f'Réseau fin-début : A dure {a} jours ; après A, B dure {b} jours et C {c} jours en parallèle ; D dure {d} jours et attend B et C. Ressources supposées disponibles, calendrier continu.',f'Finish-to-start network: A takes {a} days; then B {b} days and C {c} days in parallel; D takes {d} days after both. Resources available; continuous calendar.',
  'Duration = A + max(B,C) + D ; floatC = max(B,C) − C',
  f'1. Fin A = {a}.\n2. Fin B = {a+b}, fin C = {a+c}.\n3. D commence à {a+max(b,c)} ; fin programme {dur} jours.\n4. Marge de C = {floatc} jours.\n5. B réduit de 2 jours : nouvelle durée {short} jours ; une autre branche peut devenir critique.',
  f'1. A finishes at {a}.\n2. B finishes at {a+b}, C at {a+c}.\n3. D starts at {a+max(b,c)}; completion is day {dur}.\n4. C float = {floatc} days.\n5. Shortening B by 2 days gives {short} total days; another branch can become critical.',
  [dur,floatc,short],['jours','jours','jours'],['Calcule la durée totale.','Calcule la marge de C.','Recalcule la durée si B gagne 2 jours.'],['Calculate total duration.','Calculate C float.','Recalculate duration if B is shortened by 2 days.'],
  'Vérifier chemin critique et capacité avant d’annoncer le gain de rattrapage.','Check critical path and capacity before announcing recovery benefit.',
  'Additionner A, B, C et D pour obtenir la durée, même si B et C sont parallèles.','Add A, B, C and D despite parallel B and C.',
  'Promettre deux jours gagnés sur le programme dès que n’importe quelle tâche gagne deux jours.','Promise two programme days saved whenever any task is shortened by two days.',
  'Ni jours ouvrés ni ressource partagée ne sont modélisés.','Working calendars and shared-resource constraints are not modelled.')
 if key=='programme':
  pv=120000+5000*s;ev=100000+4000*s;ac=130000+5000*s;bac=600000;cpi=ev/ac;spi=ev/pv;eac=bac/cpi
  return out(f'À la date de référence : PV {pv} €, EV {ev} €, AC {ac} €, BAC 600 000 €. Pour EAC, supposer le CPI constant jusqu’à la fin.',f'At status date: PV €{pv}, EV €{ev}, AC €{ac}, BAC €600,000. For EAC assume constant future CPI.',
  'CPI = EV/AC ; SPI = EV/PV ; EAC = BAC/CPI',
  f'1. CPI = {ev}/{ac} = {n(cpi)}.\n2. SPI = {ev}/{pv} = {n(spi)}.\n3. EAC = 600000/{n(cpi)} ≈ {n(eac)} €.\n4. CPI < 1 indique un coût supérieur au budget de la valeur acquise ; SPI ne prouve pas la date finale.',
  f'1. CPI = {ev}/{ac} = {n(cpi)}.\n2. SPI = {ev}/{pv} = {n(spi)}.\n3. EAC = 600000/{n(cpi)} ≈ €{n(eac)}.\n4. CPI < 1 indicates earned work cost more than its budget; SPI does not establish completion date.',
  [cpi,spi,eac],['ratio','ratio','€'],['Calcule le CPI.','Calcule le SPI.','Calcule EAC avec la méthode imposée.'],['Calculate CPI.','Calculate SPI.','Calculate EAC with the stated method.'],
  'Analyser les livrables acquis, le chemin critique et l’hypothèse de forecast avant de décider.','Examine earned deliverables, critical path and forecast assumptions before deciding.',
  'Déclarer le programme techniquement validé parce que EV est positif.','Declare technical validation because EV is positive.',
  'Utiliser SPI comme facteur de conversion certain vers une date de fin.','Use SPI as a certain conversion factor to a completion date.',
  'Le forecast suppose la poursuite de l’efficacité de coût observée.','Forecast assumes observed cost efficiency continues.')
 if key=='discipline':
  q=2000+200*s;cp=4180;dt=5;flow=q/(cp*dt);more=q*1.2/(cp*dt);rise=q/(flow*.8*cp)
  return out(f'Pertes à transporter {q} W ; liquide avec cp = 4 180 J/(kg·K) ; hausse admissible 5 K. Second cas : pertes +20 %. Troisième cas : débit nominal réduit de 20 %, pertes initiales.',f'Heat to carry {q} W; coolant cp = 4,180 J/(kg·K); allowed rise 5 K. Second case: heat +20%. Third case: nominal flow reduced by 20%, original heat.',
  'ṁ = Q/(cpΔT) ; ΔT = Q/(ṁcp)',
  f'1. Débit nominal = {q}/(4180×5) = {n(flow)} kg/s.\n2. Pertes +20 % : débit nécessaire {n(more)} kg/s.\n3. Débit −20 % : hausse = 5/0,8 = {n(rise)} K.\n4. Vérifier ensuite températures d’entrée, pompe, échangeur et perte de charge.',
  f'1. Nominal flow = {q}/(4180×5) = {n(flow)} kg/s.\n2. Heat +20%: required flow {n(more)} kg/s.\n3. Flow −20%: rise = 5/0.8 = {n(rise)} K.\n4. Then check inlet temperatures, pump, heat exchanger and pressure loss.',
  [flow,more,rise],['kg/s','kg/s','K'],['Calcule le débit nominal.','Calcule le débit pour pertes +20 %.','Calcule ΔT à débit nominal −20 %.'],['Calculate nominal flow.','Calculate flow for heat +20%.','Calculate ΔT at nominal flow −20%.'],
  'Partager un contrat thermique avec températures, débit, pertes et scénarios, puis vérifier l’échangeur et la pompe.','Share a thermal contract with temperatures, flow, heat and scenarios, then verify exchanger and pump.',
  'Valider le refroidissement sur le seul ΔT sans températures absolues ni échangeur.','Approve cooling from ΔT alone without absolute temperatures or exchanger checks.',
  'Réduire le débit de 20 % et annoncer aussi une réduction de ΔT de 20 %.','Reduce flow by 20% and claim ΔT also falls by 20%.',
  'Chaleur spécifique constante et régime établi, sans modèle d’échangeur.','Constant heat capacity and steady state, without an exchanger model.')
 if key=='measurement':
  power=120+12*s;voltage=12;r=.05;current=power/voltage;drop=current*r;loss=current**2*r
  return out(f'Charge idéale {power} W sous 12 V au point de calcul ; résistance aller-retour de faisceau 0,05 Ω. Utiliser I = P/12 sans boucle de correction de tension.',f'Ideal load {power} W at a 12 V calculation point; round-trip harness resistance 0.05 Ω. Use I = P/12 without iterative voltage correction.',
  'I = P/V ; ΔV = IR ; Ploss = I²R',
  f'1. I = {power}/12 = {n(current)} A.\n2. Chute = {n(current)}×0,05 = {n(drop)} V.\n3. Pertes = {n(current)}²×0,05 = {n(loss)} W.\n4. La tension réelle et le comportement de charge demandent un modèle couplé pour affiner.',
  f'1. I = {power}/12 = {n(current)} A.\n2. Drop = {n(current)}×0.05 = {n(drop)} V.\n3. Loss = {n(current)}²×0.05 = {n(loss)} W.\n4. Actual voltage and load behaviour need a coupled model for refinement.',
  [current,drop,loss],['A','V','W'],['Calcule le courant au point imposé.','Calcule la chute aller-retour.','Calcule les pertes Joule.'],['Calculate current at the stated point.','Calculate round-trip voltage drop.','Calculate Joule losses.'],
  'Inclure le retour de masse, les transitoires et la coordination des protections avant de figer le faisceau.','Include ground return, transients and protection coordination before freezing the harness.',
  'Choisir le fusible uniquement avec le courant nominal, sans caractéristique ni courant de défaut.','Select a fuse solely by nominal current without characteristics or fault current.',
  'Oublier le retour parce que la caisse est conductrice.','Ignore the return because the body is conductive.',
  'Le calcul fixe la tension pour une première estimation ; la charge peut réagir à la chute réelle.','Voltage is fixed for an initial estimate; the load may respond to actual drop.')
 if key=='network':
  bits=130;period=10+s;freq=1000/period+1000/20+1000/50;rate=500000;bps=bits*freq;util=bps/rate*100;extra=bits*(1000/5)/rate*100
  return out(f'Segment 500 kbit/s ; trois trames périodiques de 130 bits chacune (surcoûts inclus par hypothèse) ; périodes {period}, 20 et 50 ms. Nouveau flux éventuel : 130 bits toutes les 5 ms. Pas d’erreurs ni retransmissions.',f'500 kbit/s segment; three periodic 130-bit frames each (overhead included by assumption); periods {period}, 20 and 50 ms. Proposed extra flow: 130 bits every 5 ms. No errors or retransmissions.',
  'bps = Σ bits × 1000/Tms ; U = bps/R ×100',
  f'1. Fréquence totale = 1000/{period}+1000/20+1000/50 = {n(freq)} trames/s.\n2. Débit = 130×{n(freq)} = {n(bps)} bit/s.\n3. Charge = {n(util)} %.\n4. Ajout = {n(extra)} points de pourcentage ; charge totale {n(util+extra)} %.\n5. Aucun de ces résultats ne démontre une deadline.',
  f'1. Total frequency = 1000/{period}+1000/20+1000/50 = {n(freq)} frames/s.\n2. Throughput = 130×{n(freq)} = {n(bps)} bit/s.\n3. Load = {n(util)}%.\n4. Extra flow adds {n(extra)} percentage points; total {n(util+extra)}%.\n5. None of these results establishes a deadline.',
  [util,util+extra,bps],['%','%','bit/s'],['Calcule la charge moyenne initiale.','Calcule la charge avec le nouveau flux.','Calcule le débit initial.'],['Calculate initial average load.','Calculate load with the new flow.','Calculate initial throughput.'],
  'Compléter la moyenne par priorités, rafales, blocage, erreurs et délais de gateway.','Complement average load with priorities, bursts, blocking, errors and gateway delays.',
  'Garantir toutes les deadlines parce que la charge moyenne est inférieure à 50 %.','Guarantee every deadline because average load is below 50%.',
  'Assimiler les 130 bits au payload maximal universel de toute trame CAN FD.','Treat 130 bits as universal maximum CAN FD payload.',
  'Taille de trame simplifiée ; ne pas appliquer telle quelle aux phases CAN FD.','Simplified frame size; do not apply unchanged to CAN FD phases.')
 if key=='diagnostic':
  period=10+s;k=3;min_=period*(k-1);max_=period*k;recovery=period*2
  return out(f'Échantillonnage toutes les {period} ms ; défaut présent juste avant ou juste après une observation ; confirmation à la 3e observation invalide consécutive. Une observation valide remet le compteur à zéro. Récupération après 2 observations valides.',f'Sampling every {period} ms; fault appears just before or after an observation; confirm at the third consecutive invalid sample. A valid sample resets the counter. Recovery requires two valid observations.',
  'Detection window ≈ [(k−1)T, kT] ; worst recovery ≈ 2T',
  f'1. Défaut juste avant observation : première observation presque immédiate ; troisième après environ 2T = {min_} ms.\n2. Défaut juste après : troisième après presque 3T = {max_} ms.\n3. Récupération pire phase ≈ 2T = {recovery} ms.\n4. Les bornes sont approchées par phase ; l’exécution et la gigue ne sont pas ajoutées.',
  f'1. Fault just before sampling: first sample almost immediate, third after about 2T = {min_} ms.\n2. Fault just after: third sample after almost 3T = {max_} ms.\n3. Worst-phase recovery ≈ 2T = {recovery} ms.\n4. Bounds reflect sampling phase; execution and jitter are excluded.',
  [min_,max_,recovery],['ms','ms','ms'],['Donne la borne basse approchée de détection.','Donne la borne haute approchée de détection.','Donne la récupération au pire déphasage.'],['Give the approximate lower detection bound.','Give the approximate upper detection bound.','Give worst-phase recovery time.'],
  'Tester déphasage, intermittence, réinitialisation et reprise, en séparant diagnostic et réaction fonctionnelle.','Test phase, intermittency, reset and recovery while separating diagnosis from functional response.',
  'Confirmer en exactement une période quelle que soit la règle des trois observations.','Confirm in exactly one period regardless of the three-sample rule.',
  'Accumuler les invalides non consécutifs même si le contrat impose une remise à zéro.','Accumulate nonconsecutive invalid samples despite the reset contract.',
  'Pas de gigue ni temps de traitement ; les intervalles réels dépendent des points de mesure.','No jitter or processing time; actual intervals depend on measurement endpoints.')
 if key=='software':
  c1=2+s*.2;t1=10;c2=3;t2=20;c3=5;t3=50;u=(c1/t1+c2/t2+c3/t3)*100;unew=u+20;reserve=100-unew
  return out(f'Tâches périodiques : C1={n(c1)} ms/T1=10 ms, C2=3 ms/T2=20 ms, C3=5 ms/T3=50 ms. Ajout envisagé C4=2 ms/T4=10 ms. Un cœur ; pas de surcoût dans cette estimation.',f'Periodic tasks: C1={n(c1)} ms/T1=10 ms, C2=3 ms/T2=20 ms, C3=5 ms/T3=50 ms. Proposed task C4=2 ms/T4=10 ms. One core; no overhead in this estimate.',
  'U = Σ Ci/Ti ×100 ; reserve = 100 − Unew',
  f'1. Contributions : {n(c1/t1*100)} %, 15 %, 10 %.\n2. Utilisation initiale = {n(u)} %.\n3. Nouvelle tâche = 20 points ; total {n(unew)} %.\n4. Réserve moyenne = {n(reserve)} %.\n5. Priorités, deadlines et blocage restent à analyser.',
  f'1. Contributions: {n(c1/t1*100)}%, 15%, 10%.\n2. Initial utilisation = {n(u)}%.\n3. Extra task adds 20 points; total {n(unew)}%.\n4. Average reserve = {n(reserve)}%.\n5. Priorities, deadlines and blocking still require analysis.',
  [u,unew,reserve],['%','%','%'],['Calcule l’utilisation initiale.','Calcule l’utilisation après ajout.','Calcule la réserve moyenne après ajout.'],['Calculate initial utilisation.','Calculate utilisation after addition.','Calculate remaining average capacity.'],
  'Faire une analyse de réponse avec deadlines, priorités et blocages, puis tester la baseline logicielle.','Analyse response using deadlines, priorities and blocking, then test the software baseline.',
  'Prouver toutes les deadlines avec U < 100 % seulement.','Prove every deadline using U < 100% alone.',
  'Utiliser le temps moyen d’une tâche comme pire temps d’exécution sans justification.','Use average task time as worst-case execution without justification.',
  'Le calcul n’est qu’un filtre de capacité, pas un test universel d’ordonnançabilité.','This is a capacity filter, not a universal schedulability test.')
 if key=='safety':
  a=.01+.001*s;b=.02;and_=a*b;or_=a+b-a*b;common=.005;withcommon=common+(1-common)*and_
  return out(f'Événements A et B supposés indépendants sur la même mission : pA={n(a)}, pB=0,02. Variante avec cause commune C indépendante du résidu A∩B : pC=0,005 ; sommet C OU (A ET B).',f'Events A and B assumed independent over the same mission: pA={n(a)}, pB=0.02. Variant adds common cause C independent of residual A∩B: pC=0.005; top event C OR (A AND B).',
  'P(A∩B)=pA pB ; P(A∪B)=pA+pB−pA pB ; P(C∪(A∩B))=pC+(1−pC)pA pB',
  f'1. AND indépendant = {n(and_)}.\n2. OR indépendant = {n(or_)}.\n3. Avec cause commune = {n(withcommon)}.\n4. Une cause commune rend trompeur le seul produit pA×pB ; les événements et durées doivent rester cohérents. Ces probabilités ne donnent aucun ASIL.',
  f'1. Independent AND = {n(and_)}.\n2. Independent OR = {n(or_)}.\n3. Including common cause = {n(withcommon)}.\n4. A common cause makes the bare pA×pB product misleading; event definitions and durations must match. These probabilities do not assign ASIL.',
  [and_,or_,withcommon],['probabilité','probabilité','probabilité'],['Calcule la probabilité AND indépendante.','Calcule la probabilité OR indépendante.','Calcule le sommet avec la cause commune.'],['Calculate independent AND probability.','Calculate independent OR probability.','Calculate top-event probability including common cause.'],
  'Vérifier définition des événements et causes communes ; garder cette analyse distincte de la classification HARA.','Check event definitions and common causes; keep this calculation distinct from HARA classification.',
  'Attribuer automatiquement un ASIL à partir de pA×pB.','Assign ASIL automatically from pA×pB.',
  'Ignorer la cause commune parce que les deux composants ont des références différentes.','Ignore common cause because components have different part numbers.',
  'Modèle probabiliste fictif ; ni taux matériel réel ni preuve de sécurité.','Fictional probability model; neither real hardware failure rates nor safety evidence.')
 if key=='cyber':
  impact=200000+10000*s;p=.08;res=.03;cost=5000;before=impact*p;after=impact*res;benefit=before-after-cost
  return out(f'Exercice financier fictif uniquement : impact  {impact} € ; probabilité annuelle supposée avant contrôle 0,08, après contrôle 0,03 ; contrôle 5 000 €/an. Même population et horizon.',f'Fictional financial exercise only: impact €{impact}; assumed annual probability before control 0.08, after control 0.03; control €5,000/year. Same population and horizon.',
  'Expected exposure = p × impact ; net reduction = before − after − control cost',
  f'1. Exposition avant = 0,08×{impact} = {n(before)} €/an.\n2. Après = 0,03×{impact} = {n(after)} €/an.\n3. Gain net espéré = {n(before)}−{n(after)}−5000 = {n(benefit)} €/an.\n4. Ce gain dépend d’une réduction de probabilité supposée ; la sécurité exige objectifs, tests et risque résiduel.',
  f'1. Exposure before = 0.08×{impact} = €{n(before)}/year.\n2. After = 0.03×{impact} = €{n(after)}/year.\n3. Expected net benefit = {n(before)}−{n(after)}−5000 = €{n(benefit)}/year.\n4. Benefit depends on an assumed probability reduction; security needs objectives, tests and residual-risk analysis.',
  [before,after,benefit],['€/an','€/an','€/an'],['Calcule l’exposition annuelle initiale.','Calcule l’exposition annuelle résiduelle supposée.','Calcule la réduction nette annuelle espérée.'],['Calculate initial annual exposure.','Calculate assumed residual annual exposure.','Calculate expected annual net reduction.'],
  'Traiter les probabilités comme hypothèses et vérifier efficacité, autorisation, logs et récupération du contrôle.','Treat probabilities as assumptions and verify control effectiveness, authorisation, logs and recovery.',
  'Déclarer le système sûr dès que le gain financier espéré est positif.','Declare the system secure whenever expected financial benefit is positive.',
  'Assimiler chiffrement et autorisation de toutes les opérations.','Treat encryption as authorisation for every operation.',
  'Les probabilités d’attaque sont fictives ; aucune décision de conformité réelle n’en découle.','Attack probabilities are fictional; no actual compliance decision follows.')
 if key=='economics':
  na=30000;nb=80000;ca=120+s;cb=105+2*s;vol=3000+700*s;ta=na+ca*vol;tb=nb+cb*vol;cross=(nb-na)/(ca-cb)
  return out(f'Option A : NRE 30 000 €, coût unitaire {ca} €. Option B : NRE 80 000 €, coût unitaire {cb} €. Volume {vol} unités ; mêmes fonctions et admissibilité supposées ; pas d’actualisation.',f'Option A: NRE €30,000, unit cost €{ca}. Option B: NRE €80,000, unit cost €{cb}. Volume {vol}; equivalent required functions and feasibility assumed; no discounting.',
  'Total = NRE + unit cost × volume ; break-even = (NREB−NREA)/(costA−costB)',
  f'1. Total A = 30000+{ca}×{vol} = {ta} €.\n2. Total B = 80000+{cb}×{vol} = {tb} €.\n3. Croisement = (80000−30000)/({ca}−{cb}) = {n(cross)} unités.\n4. Le choix économique s’inverse autour de ce seuil si les autres hypothèses tiennent.',
  f'1. A total = 30000+{ca}×{vol} = €{ta}.\n2. B total = 80000+{cb}×{vol} = €{tb}.\n3. Break-even = (80000−30000)/({ca}−{cb}) = {n(cross)} units.\n4. Economic ranking reverses around this threshold if other assumptions hold.',
  [ta,tb,cross],['€','€','unités'],['Calcule le coût total A.','Calcule le coût total B.','Calcule le volume de croisement.'],['Calculate total A cost.','Calculate total B cost.','Calculate break-even volume.'],
  'Vérifier volume, délai, capacité, qualité et coûts exclus avant de retenir le coût total le plus faible.','Check volume, schedule, capacity, quality and excluded costs before choosing the lower total.',
  'Choisir systématiquement le coût unitaire le plus faible, quel que soit le NRE et le volume.','Always choose the lower unit cost regardless of NRE and volume.',
  'Retenir une option non admissible parce que son score économique est meilleur.','Choose an infeasible option because its economic score is better.',
  'Service, garantie et délai sont exclus ; les hypothèses d’admissibilité doivent être vérifiées.','Service, warranty and schedule costs are excluded; feasibility assumptions need verification.')
 if key=='value':
  vol=18000+1000*s;save=3+s*.2;nre=25000;gross=vol*save;net=gross-nre;cross=nre/save
  return out(f'Idée VA/VE : économie récurrente {n(save)} €/unité, volume effectif {vol}, développement et qualification fixes 25 000 €. Fonctions obligatoires supposées préservées pour le calcul, à prouver.',f'VA/VE proposal: recurring saving €{n(save)}/unit, effective volume {vol}, fixed development and qualification €25,000. Required functions assumed preserved for calculation, still to be proven.',
  'Gross = volume × recurring saving ; net = gross − fixed cost ; break-even = fixed cost / saving',
  f'1. Gain brut = {vol}×{n(save)} = {n(gross)} €.\n2. Gain net simple = {n(gross)}−25000 = {n(net)} €.\n3. Volume de retour simple = 25000/{n(save)} = {n(cross)} unités.\n4. Vérifier durabilité, assemblage, service et effectivité avant de comptabiliser le gain comme acquis.',
  f'1. Gross saving = {vol}×{n(save)} = €{n(gross)}.\n2. Simple net saving = {n(gross)}−25000 = €{n(net)}.\n3. Simple break-even volume = 25000/{n(save)} = {n(cross)} units.\n4. Verify durability, assembly, service and effectivity before recognising realised savings.',
  [gross,net,cross],['€','€','unités'],['Calcule le gain brut.','Calcule le gain net simple.','Calcule le seuil de volume.'],['Calculate gross saving.','Calculate simple net saving.','Calculate break-even volume.'],
  'Valider les fonctions et les interfaces après modification, puis mesurer l’économie sur la population effective.','Validate functions and interfaces after change, then measure savings on the effective population.',
  'Compter le gain brut comme net en omettant le développement déjà connu.','Count gross as net by omitting known development costs.',
  'Supprimer une fonction obligatoire pour atteindre la réduction de coût puis déclarer une hausse de valeur.','Delete a mandatory function to cut cost and claim higher value.',
  'Pas d’actualisation, de coût délai ou de variation de taux de rebut dans ce premier calcul.','No discounting, schedule cost or scrap-rate changes in this initial calculation.')
 if key=='data':
  n1=20+s*5;n2=80;m1=120+s;m2=150;mean=(n1*m1+n2*m2)/(n1+n2);unweighted=(m1+m2)/2;missing=5;complete=(n1+n2-missing)/(n1+n2)*100
  return out(f'Deux groupes disjoints : n1={n1}, moyenne c1={m1} Wh/km ; n2={n2}, moyenne c2={m2} Wh/km. Pour la qualité de métadonnées, 5 lignes parmi les {n1+n2} manquent d’identifiant de configuration ; consommations présentes.',f'Two disjoint groups: n1={n1}, mean c1={m1} Wh/km; n2={n2}, mean c2={m2} Wh/km. For metadata quality, 5 of {n1+n2} rows lack configuration IDs; consumption values are present.',
  'Weighted mean = (n1c1+n2c2)/(n1+n2) ; completeness = (N−missing)/N ×100',
  f'1. Somme pondérée = {n1}×{m1}+{n2}×{m2} = {n1*m1+n2*m2}.\n2. Moyenne globale = {n(mean)} Wh/km.\n3. Moyenne non pondérée = {n(unweighted)} Wh/km : elle donnerait le même poids à des groupes de tailles différentes.\n4. Complétude configuration = {n(complete)} %.\n5. Ne pas remplacer les identifiants absents par une conformité supposée.',
  f'1. Weighted sum = {n1}×{m1}+{n2}×{m2} = {n1*m1+n2*m2}.\n2. Combined mean = {n(mean)} Wh/km.\n3. Unweighted mean = {n(unweighted)} Wh/km: it would give equal weights to unequal-size groups.\n4. Configuration completeness = {n(complete)}%.\n5. Missing IDs cannot be replaced by assumed compliance.',
  [mean,complete,unweighted],['Wh/km','%','Wh/km'],['Calcule la moyenne globale pondérée.','Calcule la complétude des identifiants de configuration.','Calcule la moyenne non pondérée des deux moyennes, pour comparaison.'],['Calculate weighted combined mean.','Calculate configuration-ID completeness.','Calculate unweighted mean of the two means for comparison.'],
  'Conserver tailles, configuration et manquants ; analyser les distributions avant de généraliser une moyenne.','Retain sample sizes, configuration and missingness; examine distributions before generalising a mean.',
  'Remplacer les données manquantes par zéro sans l’indiquer.','Replace missing values by zero without disclosure.',
  'Annoncer la même consommation pour tous les scénarios parce que la moyenne globale est connue.','Claim identical consumption in all scenarios because the combined mean is known.',
  'La moyenne ne prouve ni dispersion, ni maximum, ni causalité.','The mean establishes neither spread, maximum nor causality.')
 raise ValueError(key)
