/* TADRISS v2 - backend-connected (comptes, essai, IA réelle) */
const defaultState={
 page:'dashboard', lang:'auto', year:'2026 / 2027', wilaya:'Alger', cycle:'Moyen', level:'4AM', subject:'الرياضيات — Mathématiques',
 students:[['Amine B.','13.5','Présent','green'],['Lina K.','15.2','Très bien','green'],['Yanis M.','9.4','À accompagner','orange'],['Sara A.','14.1','Bien','green'],['Adam R.','8.8','Remédiation','orange']],
 docs:[], progress:[['Nombres et calculs',72],['Géométrie',54],['Fonctions',41],['Statistiques',63]],
 schedule:[['08:00','Mathématiques','Fractions','4AM','blue','Dim'],['09:00','Mathématiques','Géométrie','4AM','green','Lun'],['10:30','Mathématiques','Aire et périmètre','4AM','green','Mar'],['11:30','Mathématiques','Proportionnalité','4AM','orange','Mer']],
 saved:null
};
let state={...defaultState};
const pages={dashboard:'Tableau de bord',schedule:'Emploi du temps',progress:'Progression annuelle',journal:'Cahier journal',lessons:'Mes cours',sheets:'Fiches pédagogiques',assessments:'Contrôles & quiz',students:'Mes élèves',documents:'Documents',ai:'Assistant IA',settings:'Paramètres'};

async function loadFromServer(){
  try{
    const r=await fetch('/api/state');
    if(!r.ok) throw new Error('state fetch failed');
    const remote=await r.json();
    state={...defaultState,...remote};
  }catch(e){
    toast('Connexion au serveur impossible, mode local temporaire.');
  }
}
function save(){
  clearTimeout(window.__saveTimer);
  window.__saveTimer=setTimeout(async()=>{
    try{
      await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});
    }catch(e){/* silencieux : on retentera au prochain changement */}
  },400);
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2600)}
function card(title,body,extra=''){return `<section class="card ${extra}"><div class="card-title"><h3>${title}</h3></div>${body}</section>`}
function setPage(p){state.page=p;save();document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===p));document.getElementById('pageTitle').textContent=pages[p];document.getElementById('content').innerHTML=(render[p]||render.dashboard)();window.scrollTo({top:0,behavior:'smooth'})}
function stat(icon,n,label){return `<div class="stat"><div class="stat-icon">${icon}</div><div><strong>${n}</strong><span>${label}</span></div></div>`}
function renderDashboard(){return `<div class="page-head"><div><div class="eyebrow">${state.wilaya} · ${state.year}</div><h1>Bonjour, enseignant 👋</h1><p>Votre espace pédagogique algérien est prêt.</p></div><div class="actions"><button class="btn ai" onclick="openGenerator('week')">✦ Préparer ma semaine</button><button class="btn primary" onclick="openGenerator('sheet')">+ Nouvelle fiche</button></div></div>
<section class="hero"><div class="eyebrow">TADRISS IA</div><h2>Préparez vos cours en quelques secondes.</h2><p>L'IA adapte la séance au cycle, au niveau, à la matière et à la langue du programme. Les documents peuvent être enregistrés puis exportés.</p><div class="ai-input"><input id="quickAI" placeholder="Ex. Prépare une séance de 1h sur les fractions..." onkeydown="if(event.key==='Enter')quickAI()"><button class="btn primary" onclick="quickAI()">Générer ✦</button></div></section>
<div class="grid grid-4">${stat('📚','68 %','Progression')}${stat('✓','42','Séances réalisées')}${stat('13,8','13,8/20','Moyenne classe')}${stat('5','5','Élèves à accompagner')}</div><div style="height:16px"></div><div class="grid grid-2">${card('Aujourd’hui',`<div class="list">${state.schedule.slice(0,3).map(x=>`<div class="list-item"><span class="time-pill">${esc(x[0])}</span><div class="grow"><b>${esc(x[2])}</b><small>${esc(x[1])} · ${esc(x[3])}</small></div><span class="tag ${x[4]||''}">Séance</span></div>`).join('')}</div>`)}${card('Actions rapides',`<div class="feature-grid">${quick('📖','Fiche pédagogique','Séance complète + remédiation','sheet')}${quick('📝','Contrôle','Sujet + barème + corrigé','assessment')}${quick('📅','Cahier journal','Générer à partir de la semaine','journal')}${quick('📚','Cours','Cours + exercices + corrigé','course')}</div>`)}</div>`}
function quick(i,t,d,type){return `<button class="feature" onclick="openGenerator('${type}')"><span>${i}</span><b>${t}</b><small>${d}</small></button>`}
function renderSchedule(){
  const dayKeys=['Dim','Lun','Mar','Mer','Jeu'];
  const dayNames={Dim:'Dimanche',Lun:'Lundi',Mar:'Mardi',Mer:'Mercredi',Jeu:'Jeudi'};
  const baseTimes=['08:00','09:00','10:30','11:30','13:30'];
  const times=[...new Set([...baseTimes,...state.schedule.map(x=>x[0])])].sort();
  const list=[...state.schedule].sort((a,b)=>dayKeys.indexOf(a[5])-dayKeys.indexOf(b[5])||a[0].localeCompare(b[0]));
  const listHtml=list.length?`<div class="list">${list.map(s=>{const i=state.schedule.indexOf(s);return `<div class="list-item"><span class="time-pill">${esc(s[0])}</span><div class="grow"><b>${esc(s[2])}</b><small>${esc(dayNames[s[5]]||s[5]||'—')} · ${esc(s[1])} · ${esc(s[3])}</small></div><span class="tag ${s[4]||''}">Séance</span><button class="link" onclick="openAddSchedule(${i})">Modifier</button><button class="link danger" onclick="deleteScheduleEntry(${i})">Supprimer</button></div>`}).join('')}</div>`:`<div class="empty"><strong>Aucune séance</strong><span>Ajoutez votre première séance avec le bouton ci-dessus.</span></div>`;
  return `<div class="page-head"><div><div class="eyebrow">Organisation</div><h1>Emploi du temps</h1><p>Votre emploi du temps alimente le cahier journal.</p></div><div class="actions"><button class="btn" onclick="openAddSchedule()">+ Ajouter une séance</button><button class="btn primary" onclick="openGenerator('week')">✦ Préparer ma semaine</button></div></div>${card('Semaine actuelle',`<div class="schedule">${['Heure','Dimanche','Lundi','Mardi','Mercredi','Jeudi'].map((d,i)=>`<div class="day">${d}</div>`).join('')}${times.map((tm,ri)=>`<div class="time">${tm}</div>${dayKeys.map((dk,ci)=>{let s=state.schedule.find(x=>x[0]===tm&&x[5]===dk);return `<div class="slot${s?' '+s[4]:''}">${s?`<b>${esc(s[2])}</b><span>${esc(s[1])}</span>`:''}</div>`}).join('')}`).join('')}</div>`)}<div style="height:16px"></div>${card('Toutes les séances',listHtml)}`;
}
function openAddSchedule(index){
  index=typeof index==='number'?index:-1;
  const isEdit=index>=0;
  const s=isEdit?state.schedule[index]:['14:30','Mathématiques','','4AM','blue','Dim'];
  const dayOpt=(v,label)=>`<option value="${v}"${s[5]===v?' selected':''}>${label}</option>`;
  const colorOpt=(v,label)=>`<option value="${v}"${s[4]===v?' selected':''}>${label}</option>`;
  document.getElementById('modal').innerHTML=`<div class="modal-head"><h2>${isEdit?'Modifier la séance':'+ Ajouter une séance'}</h2><button class="close" onclick="closeModal()">×</button></div><div class="form-grid"><div class="field"><label>Jour</label><select id="asDay">${dayOpt('Dim','Dimanche')}${dayOpt('Lun','Lundi')}${dayOpt('Mar','Mardi')}${dayOpt('Mer','Mercredi')}${dayOpt('Jeu','Jeudi')}</select></div><div class="field"><label>Heure</label><input id="asTime" type="time" value="${esc(s[0])}"></div><div class="field"><label>Matière</label><input id="asSubject" value="${esc(s[1])}"></div><div class="field"><label>Niveau</label><input id="asLevel" value="${esc(s[3]||state.level)}"></div></div><div class="field" style="margin-top:12px"><label>Sujet de la séance</label><input id="asTopic" value="${esc(s[2])}" placeholder="Ex. Les fractions"></div><div class="field" style="margin-top:12px"><label>Couleur</label><select id="asColor">${colorOpt('blue','Bleu')}${colorOpt('green','Vert')}${colorOpt('orange','Orange')}</select></div><div class="actions" style="justify-content:flex-end;margin-top:15px"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="submitAddSchedule(${index})">${isEdit?'Enregistrer':'Ajouter'}</button></div>`;
  document.getElementById('modalBackdrop').classList.add('open');
}
function submitAddSchedule(index){
  index=typeof index==='number'?index:-1;
  const day=document.getElementById('asDay').value;
  const time=document.getElementById('asTime').value||'14:30';
  const subject=document.getElementById('asSubject').value.trim()||'Matière';
  const level=document.getElementById('asLevel').value.trim()||state.level;
  const topic=document.getElementById('asTopic').value.trim()||'Séance';
  const color=document.getElementById('asColor').value;
  const row=[time,subject,topic,level,color,day];
  if(index>=0) state.schedule[index]=row; else state.schedule.push(row);
  save();closeModal();toast(index>=0?'Séance modifiée':'Séance ajoutée');setPage('schedule');
}
function deleteScheduleEntry(i){if(!confirm('Supprimer cette séance ?'))return;state.schedule.splice(i,1);save();toast('Séance supprimée');setPage('schedule')}
function renderProgress(){
  const rows=state.progress.length?state.progress.map((p,i)=>`<div class="progress-row"><div><span>${esc(p[0])}</span><b>${p[1]}%</b></div><div class="bar"><i style="width:${p[1]}%"></i></div><div class="actions" style="margin-top:6px;gap:10px"><button class="link" onclick="openProgressForm(${i})">Modifier</button><button class="link danger" onclick="deleteProgress(${i})">Supprimer</button></div></div>`).join(''):`<div class="empty"><strong>Aucune séquence</strong><span>Ajoutez votre première séquence avec le bouton "+ Séquence".</span></div>`;
  return `<div class="page-head"><div><div class="eyebrow">Programme algérien</div><h1>Progression annuelle</h1><p>${esc(state.level)} · ${esc(state.subject)}</p></div><div class="actions"><button class="btn" onclick="openProgressForm(-1)">+ Séquence</button><button class="btn primary" onclick="exportDocument('progress')">📄 Exporter</button></div></div><div class="grid grid-2">${card('Avancement',rows)}${card('Référentiel',`<div class="kpi">Configuration active</div><h3 style="margin-top:8px">${esc(state.wilaya)} · ${esc(state.cycle)} · ${esc(state.level)}</h3><p class="kpi" style="line-height:1.8">La structure de TADRISS est prévue pour associer chaque niveau à ses matières, séquences, compétences et séances. Importez vos référentiels officiels lorsque vous les possédez.</p><button class="btn" onclick="importFile()">↑ Importer un référentiel</button>`)}</div>`;
}
function openProgressForm(index){
  index=typeof index==='number'?index:-1;
  const isEdit=index>=0;
  const p=isEdit?state.progress[index]:['',0];
  document.getElementById('modal').innerHTML=`<div class="modal-head"><h2>${isEdit?'Modifier la séquence':'+ Nouvelle séquence'}</h2><button class="close" onclick="closeModal()">×</button></div><div class="form-grid"><div class="field"><label>Séquence</label><input id="pgTopic" value="${esc(p[0])}" placeholder="Ex. Nombres et calculs"></div><div class="field"><label>Avancement (%)</label><input id="pgPercent" type="number" min="0" max="100" value="${esc(String(p[1]))}"></div></div><div class="actions" style="justify-content:flex-end;margin-top:15px"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="submitProgressForm(${index})">${isEdit?'Enregistrer':'Ajouter'}</button></div>`;
  document.getElementById('modalBackdrop').classList.add('open');
}
function submitProgressForm(index){
  index=typeof index==='number'?index:-1;
  const topic=document.getElementById('pgTopic').value.trim();
  if(!topic){toast('Le nom de la séquence est obligatoire.');return}
  let pct=parseInt(document.getElementById('pgPercent').value,10);
  if(isNaN(pct))pct=0;
  pct=Math.max(0,Math.min(100,pct));
  const row=[topic,pct];
  if(index>=0) state.progress[index]=row; else state.progress.push(row);
  save();closeModal();toast(index>=0?'Séquence modifiée':'Séquence ajoutée');setPage('progress');
}
function deleteProgress(i){if(!confirm('Supprimer cette séquence ?'))return;state.progress.splice(i,1);save();toast('Séquence supprimée');setPage('progress')}
function renderJournal(){const order=['Dim','Lun','Mar','Mer','Jeu'];const sorted=[...state.schedule].sort((a,b)=>order.indexOf(a[5])-order.indexOf(b[5])||a[0].localeCompare(b[0]));return `<div class="page-head"><div><div class="eyebrow">Traçabilité pédagogique</div><h1>Cahier journal</h1><p>Construit depuis l'emploi du temps et la progression.</p></div><div class="actions"><button class="btn" onclick="window.print()">🖨 Imprimer</button><button class="btn primary" onclick="exportDocument('journal')">📄 Générer le document</button></div></div>${card('Semaine en cours',`<div class="journal-list">${sorted.map(s=>`<article class="journal-row"><div class="journal-date">${esc(s[5]||'—')}<b>${esc(s[0])}</b></div><div><h4>${esc(s[2])}</h4><p>${esc(s[1])} · ${esc(s[3])}</p><span class="tag">Objectif · Activité · Évaluation · Remédiation</span></div><button class="link" onclick="openGenerator('sheet')">Préparer →</button></article>`).join('')}</div>`)}`}
function renderSheets(){return pageList('Fiches pédagogiques','Préparation','Créez des fiches complètes, cohérentes et exportables.','sheet',['Fiche Les fractions','Fiche Proportionnalité'])}
function renderLessons(){return pageList('Mes cours','Ressources pédagogiques','Cours, résumés, activités et exercices.','course',['Cours — Fractions','Cours — Géométrie'])}
function pageList(title,ey,p,typ,items){return `<div class="page-head"><div><div class="eyebrow">${ey}</div><h1>${title}</h1><p>${p}</p></div><button class="btn primary" onclick="openGenerator('${typ}')">✦ Générer avec IA</button></div><div class="doc-grid">${items.map((x,i)=>`<article class="doc"><div class="doc-icon">${typ==='sheet'?'✎':'📚'}</div><h4>${x}</h4><p>${state.level} · ${state.subject} · ${state.lang==='fr'?'Français':'Automatique'}</p><div class="actions" style="margin-top:12px"><button class="btn" onclick="openGenerator('${typ}')">Modifier</button><button class="btn" onclick="exportDocument('${typ}')">PDF</button></div></article>`).join('')}</div>`}
function renderAssessments(){return `<div class="page-head"><div><div class="eyebrow">Évaluation</div><h1>Contrôles & quiz</h1><p>Sujets, barèmes, corrigés et variantes.</p></div><button class="btn primary" onclick="openGenerator('assessment')">✦ Créer un contrôle</button></div>${card('Bibliothèque',`<div class="doc-grid"><article class="doc"><div class="doc-icon">📝</div><h4>Contrôle 1 — Fractions</h4><p>45 min · /20 · Corrigé disponible</p><button class="btn" onclick="exportDocument('assessment')">Exporter</button></article><article class="doc"><div class="doc-icon">🎯</div><h4>Quiz — Proportionnalité</h4><p>15 questions · correction automatique</p><button class="btn" onclick="openGenerator('quiz')">Ouvrir</button></article></div>`)}`}
function renderStudents(){
  const rows=state.students.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Élève</th><th>Moyenne</th><th>Statut</th><th>Action</th></tr></thead><tbody>${state.students.map((s,i)=>`<tr><td><b>${esc(s[0])}</b></td><td><span class="score">${esc(s[1])}</span></td><td><span class="tag ${s[3]}">${esc(s[2])}</span></td><td><button class="link" onclick="openGenerator('analysis')">Analyser →</button> <button class="link" onclick="openStudentForm(${i})">Modifier</button> <button class="link danger" onclick="deleteStudent(${i})">Supprimer</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><strong>Aucun élève</strong><span>Ajoutez votre premier élève avec le bouton "+ Ajouter".</span></div>`;
  return `<div class="page-head"><div><div class="eyebrow">Classe ${state.level}</div><h1>Mes élèves</h1><p>Notes, observations, accompagnement et statistiques.</p></div><div class="actions"><button class="btn" onclick="openStudentForm(-1)">+ Ajouter</button><button class="btn primary" onclick="openGenerator('analysis')">✦ Analyser la classe</button></div></div>${card('Liste des élèves',rows)}`;
}
function openStudentForm(index){
  index=typeof index==='number'?index:-1;
  const isEdit=index>=0;
  const s=isEdit?state.students[index]:['','10,0','Bien','green'];
  document.getElementById('modal').innerHTML=`<div class="modal-head"><h2>${isEdit?'Modifier l’élève':'+ Ajouter un élève'}</h2><button class="close" onclick="closeModal()">×</button></div><div class="form-grid"><div class="field"><label>Nom</label><input id="stName" value="${esc(s[0])}" placeholder="Nom de l'élève"></div><div class="field"><label>Moyenne</label><input id="stAvg" value="${esc(s[1])}" placeholder="Ex. 13,5"></div><div class="field"><label>Statut</label><input id="stStatus" value="${esc(s[2])}" placeholder="Ex. Bien, À accompagner..."></div><div class="field"><label>Couleur du statut</label><select id="stColor"><option value="green"${s[3]==='green'?' selected':''}>Vert (bien)</option><option value="orange"${s[3]==='orange'?' selected':''}>Orange (à accompagner)</option></select></div></div><div class="actions" style="justify-content:flex-end;margin-top:15px"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="submitStudentForm(${index})">${isEdit?'Enregistrer':'Ajouter'}</button></div>`;
  document.getElementById('modalBackdrop').classList.add('open');
}
function submitStudentForm(index){
  index=typeof index==='number'?index:-1;
  const name=document.getElementById('stName').value.trim();
  if(!name){toast('Le nom est obligatoire.');return}
  const avg=document.getElementById('stAvg').value.trim()||'—';
  const status=document.getElementById('stStatus').value.trim()||'—';
  const color=document.getElementById('stColor').value;
  const row=[name,avg,status,color];
  if(index>=0) state.students[index]=row; else state.students.push(row);
  save();closeModal();toast(index>=0?'Élève modifié':'Élève ajouté');setPage('students');
}
function deleteStudent(i){if(!confirm('Supprimer cet élève ?'))return;state.students.splice(i,1);save();toast('Élève supprimé');setPage('students')}
function renderDocuments(){return `<div class="page-head"><div><div class="eyebrow">Bibliothèque</div><h1>Documents</h1><p>Vos documents générés et importés restent liés à votre compte.</p></div><div class="actions"><button class="btn" onclick="importFile()">↑ Importer</button><button class="btn primary" onclick="openGenerator('course')">✦ Créer avec IA</button></div></div>${card('Types pris en charge',`<div class="feature-grid"><div class="feature"><span>📄</span><b>PDF</b><small>Lecture et préparation pour analyse.</small></div><div class="feature"><span>📝</span><b>Word</b><small>Documents pédagogiques exportables.</small></div><div class="feature"><span>📊</span><b>Excel</b><small>Listes, notes et classes.</small></div><div class="feature"><span>📽</span><b>PowerPoint</b><small>Ressources de cours.</small></div></div>`)}<div style="height:16px"></div>${card('Mes documents générés',state.docs.length?`<div class="list">${state.docs.map((d,i)=>`<div class="list-item"><span class="doc-icon" style="margin:0">${esc(d.ext)}</span><div class="grow"><b>${esc(d.title)}</b><small>${esc(d.date)}</small></div><button class="btn" onclick="downloadSaved(${i})">Télécharger</button><button class="link danger" onclick="deleteDocument(${i})">Supprimer</button></div>`).join('')}</div>`:`<div class="empty"><strong>Aucun document généré</strong><span>Créez une fiche, un cours ou un contrôle avec l'IA.</span></div>`)}`}
function deleteDocument(i){if(!confirm('Supprimer ce document ?'))return;state.docs.splice(i,1);save();toast('Document supprimé');setPage('documents')}
function renderAI(){return `<div class="page-head"><div><div class="eyebrow">Intelligence pédagogique</div><h1>Assistant IA TADRISS</h1><p>Génération guidée par votre contexte, propulsée par Claude.</p></div></div><div class="ai-grid">${card('Conversation',`<div class="chat"><div class="messages" id="messages"><div class="msg bot"><b>Bonjour 👋</b><br>Je peux préparer une séance, un cours, un contrôle, une remédiation ou votre semaine.</div></div><div class="chat-input"><textarea id="chatText" placeholder="Ex. Prépare une remédiation sur les fractions..."></textarea><button class="btn ai" onclick="sendAI()">Envoyer ✦</button></div></div>`)}${card('Actions rapides',`<div class="feature-grid">${quick('📖','Préparer une séance','Fiche complète','sheet')}${quick('📝','Créer un contrôle','Sujet + corrigé','assessment')}${quick('🎯','Remédiation','Activités ciblées','remediation')}${quick('📅','Préparer ma semaine','Planification','week')}${quick('📚','Créer un cours','Cours + exercices','course')}${quick('📊','Analyser ma classe','Résultats','analysis')}</div>`)}</div></div>`}
function renderSettings(){return `<div class="page-head"><div><div class="eyebrow">Configuration</div><h1>Paramètres</h1><p>Personnalisez le contexte pédagogique.</p></div><button class="btn primary" onclick="saveSettings()">Enregistrer</button></div><div class="grid grid-2">${card('Profil',`<div class="form-grid"><div class="field"><label>Wilaya</label><select id="setWilaya"><option>Alger</option><option>Oran</option><option>Constantine</option><option>Blida</option></select></div><div class="field"><label>Cycle</label><select id="setCycle"><option>Primaire</option><option>Moyen</option><option>Secondaire</option></select></div><div class="field"><label>Niveau</label><input id="setLevel" value="${esc(state.level)}"></div><div class="field"><label>Matière</label><input id="setSubject" value="${esc(state.subject)}"></div></div>`)}${card('Langue de production',`<div class="field"><label>Mode</label><select id="setLang"><option value="auto">Automatique</option><option value="ar">العربية</option><option value="fr">Français</option><option value="bi">Bilingue</option></select></div><p class="kpi" style="margin-top:12px;line-height:1.7">En mode automatique, TADRISS suit la langue configurée pour le programme et la matière. Les documents arabes sont générés en RTL.</p>`)}</div>`}
function openGenerator(type){const labels={sheet:'Créer une fiche pédagogique',course:'Générer un cours',assessment:'Créer un contrôle',quiz:'Créer un quiz',progress:'Créer une progression',schedule:'Ajouter une séance',student:'Ajouter un élève',remediation:'Préparer une remédiation',week:'Préparer ma semaine',analysis:'Analyser ma classe',journal:'Générer le cahier journal'};document.getElementById('modal').innerHTML=`<div class="modal-head"><h2>✦ ${labels[type]||'Assistant TADRISS'}</h2><button class="close" onclick="closeModal()">×</button></div><div class="form-grid"><div class="field"><label>Cycle</label><select id="gCycle"><option>${esc(state.cycle)}</option><option>Primaire</option><option>Moyen</option><option>Secondaire</option></select></div><div class="field"><label>Niveau</label><input id="gLevel" value="${esc(state.level)}"></div><div class="field"><label>Matière</label><input id="gSubject" value="${esc(state.subject)}"></div><div class="field"><label>Langue</label><select id="gLang"><option value="auto">Automatique</option><option value="ar">العربية</option><option value="fr">Français</option><option value="bi">Bilingue</option></select></div></div><div class="field" style="margin-top:12px"><label>Consigne</label><textarea id="genPrompt">${esc(type==='sheet'?'Prépare une séance de 1 heure sur les fractions avec situation-problème, objectifs, activités, évaluation et remédiation.':type==='assessment'?'Crée un contrôle de 45 minutes sur les fractions, noté sur 20, avec barème et corrigé.':type==='course'?'Crée un cours complet sur les fractions avec exemples et exercices corrigés.':type==='week'?'Prépare ma semaine à partir de mon emploi du temps et de ma progression.':'Décris précisément le document à produire.')}</textarea></div><div class="actions" style="justify-content:flex-end;margin-top:15px"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="generateResult('${type}')">✦ Générer le document</button></div>`;document.getElementById('modalBackdrop').classList.add('open')}
function language(){const v=document.getElementById('gLang')?.value||state.lang;return v==='ar'?'ar':v==='bi'?'bi':state.lang==='ar'?'ar':'fr'}
function generateContentLocal(type,p,lev,sub){const ar=language()==='ar';const title=type==='sheet'?(ar?'ورقة تحضير بيداغوجية':'Fiche pédagogique'):type==='assessment'?(ar?'اختبار وتقويم':'Contrôle / devoir'):type==='course'?(ar?'درس':'Cours'):type==='week'?(ar?'خطة الأسبوع':'Préparation de la semaine'):type==='journal'?(ar?'دفتر اليومية':'Cahier journal'):'Document pédagogique';const sections=ar?[['الأهداف','فهم المفهوم وتوظيفه في وضعيات متنوعة.'],['المكتسبات القبلية','مراجعة المعارف الضرورية قبل بدء التعلم.'],['الوضعية المشكلة','وضعية انطلاق مرتبطة بمستوى المتعلمين.'],['سيرورة الحصة','تمهيد ← بحث ← مناقشة ← بناء التعلم ← تطبيق ← تقويم.'],['النشاطات','أنشطة فردية وجماعية مع توجيه تدريجي.'],['التقويم','أسئلة قصيرة للتحقق من اكتساب الكفاءة.'],['المعالجة','أنشطة موجهة للمتعلمين الذين يواجهون صعوبات.']]:[['Objectifs','Comprendre la notion et la mobiliser dans des situations variées.'],['Prérequis','Vérifier les connaissances nécessaires avant la séance.'],['Situation-problème','Une situation de départ contextualisée au niveau des élèves.'],['Déroulement','Mise en situation → recherche → mise en commun → institutionnalisation → application → évaluation.'],['Activités','Activités individuelles et collectives avec guidage progressif.'],['Évaluation','Questions courtes et exercices pour vérifier la compétence.'],['Remédiation','Activités ciblées pour les élèves en difficulté.']];if(type==='assessment')sections.push(ar?['الباريم','التمرين 1: 5 ن · التمرين 2: 7 ن · التمرين 3: 8 ن']:['Barème','Exercice 1 : 5 pts · Exercice 2 : 7 pts · Exercice 3 : 8 pts']);if(type==='course')sections.push(ar?['تمارين تطبيقية','تمرين 1، تمرين 2، تمرين 3 مع التصحيح.']:['Exercices corrigés','Exercice 1, exercice 2 et exercice 3 avec correction.']);return {title,meta:`${lev} · ${sub}`,prompt:p,sections,rtl:ar}}
async function generateResult(type){
  const p=document.getElementById('genPrompt').value||'Préparation pédagogique';
  const lev=document.getElementById('gLevel').value;
  const sub=document.getElementById('gSubject').value;
  const lang=document.getElementById('gLang')?.value||state.lang;
  document.getElementById('modal').innerHTML=`<div class="modal-head"><h2>✦ Génération en cours…</h2></div><div style="padding:40px 10px;text-align:center;color:var(--muted)">L'IA TADRISS prépare votre document, un instant…</div>`;
  let c;
  try{
    const r=await fetch('/api/ai/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,level:lev,subject:sub,lang,prompt:p})});
    const d=await r.json();
    if(!d.ok) throw new Error(d.error||'Erreur IA');
    c=d.document;
    if(c._ai_error) toast('IA momentanément indisponible, document de base généré.');
  }catch(e){
    toast('IA momentanément indisponible, document de base généré.');
    c=generateContentLocal(type,p,lev,sub);
  }
  const htmlPreview=`<article class="generated ${c.rtl?'rtl':''}"><div class="generated-head"><span class="eyebrow">TADRISS · ${esc(c.meta)}</span><h2>${esc(c.title)}</h2><p>${esc(c.prompt||'')}</p></div>${c.sections.map(s=>`<section><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></section>`).join('')}</article>`;
  window.pendingDocument=c;
  document.getElementById('modal').innerHTML=`<div class="modal-head"><h2>✓ Document généré</h2><button class="close" onclick="closeModal()">×</button></div><div id="preview">${htmlPreview}</div><div class="actions" style="justify-content:flex-end;margin-top:14px"><button class="btn" onclick="savePending()">Enregistrer</button><button class="btn" onclick="downloadPending()">HTML</button><button class="btn" onclick="printPending()">🖨 Imprimer</button><button class="btn primary" onclick="serverGenerate()">📦 PDF + Word</button></div><div id="serverLinks" class="actions" style="justify-content:flex-end;margin-top:8px"></div>`;
}

function savePending(){if(window.pendingDocument)saveGenerated(JSON.stringify(window.pendingDocument))}
function downloadPending(){if(window.pendingDocument)downloadGenerated(JSON.stringify(window.pendingDocument),'html')}
function printPending(){if(window.pendingDocument)printGenerated(JSON.stringify(window.pendingDocument))}
async function serverGenerate(){if(!window.pendingDocument)return;try{toast('Génération PDF + Word…');const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(window.pendingDocument)});const d=await r.json();if(!d.ok)throw new Error(d.error||'Erreur');document.getElementById('serverLinks').innerHTML=`<a class="btn" href="${d.files.pdf}" target="_blank">📄 PDF</a><a class="btn" href="${d.files.docx}" download>📝 Word</a><a class="btn" href="${d.files.html}" target="_blank">🌐 HTML</a>`;toast('Documents prêts');}catch(e){toast('Export PDF/Word momentanément indisponible.');}}
function saveGenerated(raw){const c=JSON.parse(raw);state.docs.unshift({title:c.title,ext:'DOC',date:new Date().toLocaleString('fr-FR'),content:c});save();toast('Document enregistré dans Documents')}
function documentHtml(c){return `<!doctype html><html lang="${c.rtl?'ar':'fr'}" dir="${c.rtl?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${esc(c.title)}</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 25px;color:#17203f;line-height:1.7}.rtl{direction:rtl;text-align:right}h1{color:#101b4d}h2{color:#101b4d}h3{border-bottom:2px solid #ff8351;padding-bottom:6px}section{margin:22px 0}.meta{color:#75809d}</style></head><body class="${c.rtl?'rtl':''}"><h1>${esc(c.title)}</h1><p class="meta">${esc(c.meta)}</p><p>${esc(c.prompt||'')}</p>${c.sections.map(s=>`<section><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></section>`).join('')}<hr><small>Généré par TADRISS</small></body></html>`}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function downloadGenerated(raw,fmt){const c=JSON.parse(raw);downloadBlob(new Blob([documentHtml(c)],{type:'text/html;charset=utf-8'}),safeName(c.title)+'.html');toast('Document téléchargé')}
function downloadSaved(i){const c=state.docs[i].content;downloadBlob(new Blob([documentHtml(c)],{type:'text/html;charset=utf-8'}),safeName(c.title)+'.html')}
function exportDocument(type){const c=generateContentLocal(type,'Document préparé depuis votre espace TADRISS',state.level,state.subject);saveGenerated(JSON.stringify(c));downloadGenerated(JSON.stringify(c),'html')}
function printGenerated(raw){const c=JSON.parse(raw);const w=window.open('','_blank');if(!w){toast('Autorisez les fenêtres contextuelles pour exporter en PDF');return}w.document.write(documentHtml(c));w.document.close();w.focus();setTimeout(()=>w.print(),400)}
function safeName(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'').slice(0,80)||'tadriss_document'}
function sendAI(){const t=document.getElementById('chatText'),v=t.value.trim();if(!v)return;const box=document.getElementById('messages');box.innerHTML+=`<div class="msg user">${esc(v)}</div>`;t.value='';setTimeout(()=>{box.innerHTML+=`<div class="msg bot"><b>✦ TADRISS IA</b><br>Je transforme votre demande en document pédagogique. Cliquez sur une action rapide pour générer la fiche, le contrôle, le cours ou la remédiation correspondante.</div>`;box.scrollTop=box.scrollHeight},250)}
function quickAI(){const v=document.getElementById('quickAI').value.trim();if(!v)return toast('Écrivez votre demande.');openGenerator('sheet');setTimeout(()=>{document.getElementById('genPrompt').value=v},50)}
function closeModal(){document.getElementById('modalBackdrop').classList.remove('open')}
function saveSettings(){state.wilaya=document.getElementById('setWilaya').value;state.cycle=document.getElementById('setCycle').value;state.level=document.getElementById('setLevel').value;state.subject=document.getElementById('setSubject').value;state.lang=document.getElementById('setLang').value;save();toast('Paramètres enregistrés');setPage('dashboard')}
function importFile(){document.getElementById('fileInput').click()}
function handleFile(e){const f=e.target.files[0];if(!f)return;state.docs.unshift({title:f.name,ext:f.name.split('.').pop().toUpperCase(),date:new Date().toLocaleString('fr-FR'),content:{title:f.name,meta:'Importé',prompt:'Fichier importé dans TADRISS',sections:[['Fichier',`${f.name} · ${Math.round(f.size/1024)} Ko`]],rtl:false}});save();toast(`${f.name} ajouté à Documents`);if(state.page==='documents')setPage('documents');e.target.value=''}
const render={dashboard:renderDashboard,schedule:renderSchedule,progress:renderProgress,journal:renderJournal,sheets:renderSheets,lessons:renderLessons,assessments:renderAssessments,students:renderStudents,documents:renderDocuments,ai:renderAI,settings:renderSettings};
document.addEventListener('click',e=>{const n=e.target.closest('.nav-item');if(n&&n.dataset.page){e.preventDefault();setPage(n.dataset.page)}if(e.target.id==='mobileMenu')document.querySelector('.sidebar').classList.toggle('open');if(e.target.id==='modalBackdrop')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.addEventListener('DOMContentLoaded',async()=>{
  document.getElementById('fileInput')?.addEventListener('change',handleFile);
  await loadFromServer();
  setPage(state.page||'dashboard');
});
