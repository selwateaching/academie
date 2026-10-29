#!/usr/bin/env python3
"""Assemble l'espace apprenant à partir des sources des leçons (course-src/).

Produit :
  public/js/course.js   données des leçons (textes FR/AR, dessins, quiz)
  public/js/app.js      lecteur, quiz et enregistrement de la progression
  public/css/course.css styles des leçons
  public/app.html       page de l'espace apprenant

Pour ajouter une leçon : écrire course-src/mX.js, l'ajouter à PARTS,
la déclarer dans LESSONS / PROGRAM (core_tail.js) et dans server.js, puis relancer ce script.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, PUB = ROOT / 'course-src', ROOT / 'public'
PARTS = ['core_head.js', 'bases.js', 'm4.js', 'm1.js', 'm2.js', 'm3.js', 'm5.js']

def rd(name):
    return (SRC / name).read_text(encoding='utf-8')

def must_replace(text, old, new):
    assert old in text, 'motif introuvable : ' + old[:80]
    return text.replace(old, new, 1)

# ---------------------------------------------------------------- données
tail = rd('core_tail.js')
cut = tail.index('/* ================================================ Rendu */')
data = '\n'.join(rd(p) for p in PARTS) + '\n' + tail[:cut]
data += '''
Object.assign(UI,{
 logout:X0("Se déconnecter","تسجيل الخروج"),dash:X0("Tableau de bord","لوحة المتابعة"),
 overall:X0("{a} leçon(s) terminée(s) sur {b}","{a} من {b} دروس منتهية"),
 inprog:X0("En cours","قيد الإنجاز"),video:X0("vidéo {a} %","الفيديو {a} %"),
 saveErr:X0("Ta progression n'a pas pu être enregistrée. Vérifie ta connexion.","تعذّر حفظ تقدّمك. تحقّقي من الاتصال.")
});
'''
(PUB / 'js' / 'course.js').write_text(data, encoding='utf-8')

# ---------------------------------------------------------------- lecteur + progression
rt = tail[cut:]
rt = must_replace(rt, """let cur=LESSONS[0],done={};
try{done=JSON.parse(localStorage.getItem('done')||'{}')}catch(e){}
function saveDone(id){done[id]=1;try{localStorage.setItem('done',JSON.stringify(done))}catch(e){}renderProg()}""",
"""let cur=LESSONS[0],PROG={},ME=null;
/* Envoie un évènement de progression au serveur et met à jour l'affichage. */
async function track(ev){
  try{const r=await fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'fetch'},body:JSON.stringify(ev)});
    if(r.status===401){location.href='/connexion';return}
    if(!r.ok)throw 0;const j=await r.json();PROG[j.progress.lesson_id]=j.progress;renderProg()}
  catch(e){const n=$('saveErr');if(n){n.hidden=false;clearTimeout(n._t);n._t=setTimeout(()=>n.hidden=true,6000)}}
}
const seenLocal={};
function markScene(i){if(!cur.scenes)return;const k=cur.id+':'+i;const p=PROG[cur.id];
  if(seenLocal[k]||(p&&p.scenes_seen.includes(i)))return;seenLocal[k]=1;track({lesson:cur.id,type:'scene',index:i,total:cur.scenes.length})}
function videoPct(id){const p=PROG[id];return p&&p.scene_total?Math.round(100*p.scenes_seen.length/p.scene_total):0}""")

rt = must_replace(rt, """  $('prog').innerHTML=PROGRAM.map(([n,t,id])=>{const st=!id?`<span class="st">${T('soon')}</span>`:done[id]?`<span class="st done">✓ ${T('done')}</span>`:`<span class="st on">${T('avail')}</span>`;""",
"""  const avail=PROGRAM.filter(p=>p[2]).map(p=>p[2]),nd=avail.filter(id=>PROG[id]&&PROG[id].completed_at).length;
  $('ovTxt').textContent=T('overall',{a:nd,b:avail.length});$('ovBar').style.width=(100*nd/avail.length)+'%';
  $('prog').innerHTML=PROGRAM.map(([n,t,id])=>{const p=id&&PROG[id];
    const st=!id?`<span class="st">${T('soon')}</span>`:p&&p.completed_at?`<span class="st done">✓ ${T('done')}</span>`:p?`<span class="st on">${T('inprog')}${p.scene_total?' · '+videoPct(id)+' %':''}</span>`:`<span class="st on">${T('avail')}</span>`;""")

rt = must_replace(rt, """function show(i,withStart){
  idx=i;const s=cur.scenes[i];""",
"""let seenTimer=null;
function show(i,withStart){
  idx=i;const s=cur.scenes[i];
  clearTimeout(seenTimer);if(!withStart){const lid=cur.id;seenTimer=setTimeout(()=>{if(cur.id===lid&&idx===i)markScene(i)},6000)}""")

rt = must_replace(rt, """function advance(my){if(my!==token)return;clearT();segs.children[idx].firstChild.style.width='100%';""",
"""function advance(my){if(my!==token)return;clearT();segs.children[idx].firstChild.style.width='100%';markScene(idx);""")

rt = must_replace(rt, """    if(!miss.length){sc.innerHTML=`<span>${T('quizOk',{a:good,b:DATA.length})}</span>`;saveDone(lessonId);return}""",
"""    track({lesson:lessonId,type:'quiz',score:good,total:DATA.length,missed:miss,mastered:!miss.length});
    if(!miss.length){sc.innerHTML=`<span>${T('quizOk',{a:good,b:DATA.length})}</span>`;return}""")

rt = must_replace(rt, """function setLang(l){lang=l;try{localStorage.setItem('lang',l)}catch(e){}stop();ended=false;renderLesson()}""",
"""function setLang(l){lang=l;try{localStorage.setItem('lang',l)}catch(e){}stop();ended=false;renderLesson();renderWho()}
function renderWho(){if(!ME)return;$('whoName').textContent=ME.name;$('logout').textContent=T('logout');$('saveErr').textContent=T('saveErr');
  const d=$('toDash');d.hidden=ME.role==='learner';d.textContent=T('dash')}
$('logout').onclick=async()=>{await fetch('/api/logout',{method:'POST',headers:{'X-Requested-With':'fetch'}});location.href='/connexion'};
/* Temps passé : une minute comptée tant que la page est visible. */
setInterval(()=>{if(document.visibilityState==='visible'&&ME)track({lesson:cur.id,type:'time',seconds:60})},60000);""")

rt = must_replace(rt, """const h0=location.hash.slice(1);cur=LESSONS.find(x=>x.id===h0)||LESSONS[0];
if(!h0)$('progbox').open=true;
renderLesson();""",
"""(async()=>{
  const r=await fetch('/api/me');if(r.status===401){location.href='/connexion';return}
  const me=await r.json();if(me.user.must_change){location.href='/mot-de-passe';return}ME=me.user;
  try{const p=await (await fetch('/api/progress')).json();(p.progress||[]).forEach(x=>PROG[x.lesson_id]=x)}catch(e){}
  const h0=location.hash.slice(1),first=LESSONS.find(l=>!(PROG[l.id]&&PROG[l.id].completed_at))||LESSONS[0];
  cur=LESSONS.find(x=>x.id===h0)||first;
  if(!h0)$('progbox').open=true;
  renderLesson();renderWho();
})();""")
(PUB / 'js' / 'app.js').write_text(rt, encoding='utf-8')

# ---------------------------------------------------------------- styles
css = rd('css.html')
css = css[css.index('<style>') + 7: css.index('</style>')]
body = rd('body.html')
extra = body[body.index('<style>') + 7: body.index('</style>')]
extra += '''
.who{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:15px}
.who b{font-weight:600}
.ov{display:grid;gap:6px;margin:4px 0 2px}
.ov .bar0{height:8px;border-radius:99px;background:var(--bg);overflow:hidden}
.ov .bar0 i{display:block;height:100%;width:0;background:var(--ok);transition:width .4s}
.ov span{font-size:14px;color:var(--muted)}
.toast{position:fixed;inset-inline:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));margin:auto;max-width:520px;background:var(--bad);color:#fff;padding:12px 16px;border-radius:10px;font-weight:600;z-index:20}
'''
(PUB / 'css' / 'course.css').write_text(css + '\n' + extra, encoding='utf-8')

# ---------------------------------------------------------------- page
markup = body[body.index('</style>') + 8:]
markup = must_replace(markup, '''    <div class="lang" role="group" aria-label="Langue / اللغة">''',
'''    <div class="who"><b id="whoName"></b><a class="linkbtn" id="toDash" href="/tableau-de-bord" hidden></a><button class="linkbtn" id="logout" type="button"></button></div>
    <div class="lang" role="group" aria-label="Langue / اللغة">''')
markup = must_replace(markup, '''    <summary data-t="progH"></summary>''',
'''    <summary data-t="progH"></summary>
    <div class="ov"><span id="ovTxt"></span><div class="bar0"><i id="ovBar"></i></div></div>''')
markup += '\n<div class="toast" id="saveErr" role="status" hidden></div>\n'
head = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Formation dessalement</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@500&family=Noto+Kufi+Arabic:wght@600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/course.css">
</head>
<body>
'''
(PUB / 'app.html').write_text(head + markup + '<script src="/js/course.js"></script>\n<script src="/js/app.js"></script>\n</body>\n</html>\n', encoding='utf-8')
print('Espace apprenant assemblé.')
