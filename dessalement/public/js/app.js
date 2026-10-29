/* ================================================ Rendu */
const $=id=>document.getElementById(id);
let cur=LESSONS[0],PROG={},ME=null;
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
function videoPct(id){const p=PROG[id];return p&&p.scene_total?Math.round(100*p.scenes_seen.length/p.scene_total):0}

function renderProg(){
  const avail=PROGRAM.filter(p=>p[2]).map(p=>p[2]),nd=avail.filter(id=>PROG[id]&&PROG[id].completed_at).length;
  $('ovTxt').textContent=T('overall',{a:nd,b:avail.length});$('ovBar').style.width=(100*nd/avail.length)+'%';
  $('prog').innerHTML=PROGRAM.map(([n,t,id])=>{const p=id&&PROG[id];
    const st=!id?`<span class="st">${T('soon')}</span>`:p&&p.completed_at?`<span class="st done">✓ ${T('done')}</span>`:p?`<span class="st on">${T('inprog')}${p.scene_total?' · '+videoPct(id)+' %':''}</span>`:`<span class="st on">${T('avail')}</span>`;
    return `<li><button ${id?`data-id="${id}"`:'disabled'} aria-current="${id===cur.id}"><span class="n">${n}</span><span>${t[lang]}</span>${st}</button></li>`}).join('');
  $('prog').querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>go(b.dataset.id,true));
}
function renderLesson(){
  const h=document.documentElement;h.lang=lang;h.dir=lang==='ar'?'rtl':'ltr';
  document.title=lang==='ar'?'تكوين في تحلية المياه':'Formation dessalement';
  document.querySelectorAll('[data-t]').forEach(e=>e.textContent=T(e.dataset.t));
  document.querySelectorAll('[data-h]').forEach(e=>e.innerHTML=T(e.dataset.h));
  $('l-fr').setAttribute('aria-pressed',lang==='fr');$('l-ar').setAttribute('aria-pressed',lang==='ar');
  renderProg();
  const vid=cur.kind==='video';
  $('lEyebrow').textContent=L(cur.eyebrow);$('lTitle').textContent=L(cur.title);$('lLead').textContent=L(cur.lead);
  $('meta').innerHTML=L(cur.meta).map(m=>`<span>${m}</span>`).join('');
  $('st1').textContent=T('stepN',{a:1});
  $('prepH').textContent=vid?T('prepVid'):L(cur.prepH);$('prepLead').textContent=vid?T('prepVidLead'):L(cur.prepLead);
  $('basics').innerHTML=cur.prep.map((b,i)=>`<div class="card"><h3>${L(b.t)}${vid?'':`<span>${i+1} / ${cur.prep.length}</span>`}${lang==='ar'?`<span class="frterm">${T('fr')} ${b.fr0}</span>`:''}</h3><p class="like">${L(b.like)}</p><p class="ex">${L(b.ex)}</p></div>`).join('');
  $('basicsExtra').hidden=vid;$('toBasesP').hidden=!vid;
  if(!vid){let g='';for(let n=0;n<=14;n++)g+=`<text class="n" x="${20+n*600/14}" y="86" text-anchor="middle">${n}</text>`;
    PH.forEach(([v,l,hi],i)=>{const x=20+v*600/14,up=i%2===0;g+=`<line x1="${x}" y1="${up?36:68}" x2="${x}" y2="${up?50:96}" stroke="var(--muted)"/><text class="${hi?'sea':''}" x="${x}" y="${up?28:112}" text-anchor="middle">${l[lang]}</text>`});
    $('phx').innerHTML=g;
    $('readtab').innerHTML=READ.map(([f,p])=>`<div><span class="mono">${f}</span><p>${p[lang]}</p></div>`).join('')}
  $('vidSec').hidden=!vid;
  $('st4').textContent=T('stepN',{a:vid?4:2});
  if(vid){
    $('st2').textContent=T('stepN',{a:2});$('st3').textContent=T('stepN',{a:3});
    $('gloss').innerHTML=Object.values(cur.gloss).map(g=>`<div class="term"><dt>${g[lang]}${lang==='ar'?`<span class="frterm">${T('fr')} ${g.fr}</span>`:''}<small>${T('sceneN',{a:g.n})}</small></dt><dd>${L(g.d)}</dd></div>`).join('');
    $('chap').innerHTML='';
    cur.scenes.forEach((s,i)=>{const li=document.createElement('li');li.innerHTML=`<button><span>${String(i+1).padStart(2,'0')}</span>${L(s.t)}</button>`;
      li.firstChild.onclick=()=>{jump(i);$('stage').scrollIntoView({behavior:'smooth',block:'center'})};$('chap').appendChild(li)});
    segs.innerHTML='';cur.scenes.forEach((s,i)=>{const b=document.createElement('button');b.className='seg';b.innerHTML='<i></i>';b.setAttribute('aria-label',T('goto',{a:i+1}));b.onclick=()=>jump(i);segs.appendChild(b)});
    $('prev').setAttribute('aria-label',T('prev'));$('next').setAttribute('aria-label',T('next'));
    $('prev').textContent=lang==='ar'?'▶':'◀';$('next').textContent=lang==='ar'?'◀':'▶';
    play.textContent=T('play');setNote();show(0,true);
  }
  makeQuiz(cur.quiz,'quiz','score',cur.id);
  $('srcs').innerHTML=cur.sources?`${T('srcs')} `+cur.sources.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join(' · '):'';
  const avail=PROGRAM.filter(p=>p[2]).map(p=>p[2]),k=avail.indexOf(cur.id),nx=avail[k+1];
  if(nx){const p=PROGRAM.find(p=>p[2]===nx);$('nextLbl').textContent=T('nextL',{a:p[1][lang]});$('nextBtn').textContent=T('nextGo');$('nextBtn').onclick=()=>go(nx,true)}
  else{$('nextLbl').textContent=T('lastL');$('nextBtn').textContent=T('toProg');$('nextBtn').onclick=()=>{$('progbox').open=true;window.scrollTo({top:0,behavior:'smooth'})}}
}
function go(id,scroll){const l=LESSONS.find(x=>x.id===id);if(!l)return;stop();ended=false;cur=l;
  if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  renderLesson();if(scroll){$('progbox').open=false;window.scrollTo({top:0})}}
$('toBases').onclick=()=>go('bases',true);

/* ================================================ Lecteur */
const stage=$('stage'),segs=$('segs'),play=$('play');
let idx=0,playing=false,ended=false,token=0,timer=null,safety=null,startT=0,dur=1,raf=0,voiceOK='speechSynthesis' in window,voices={fr:null,ar:null};
function pickVoices(){if(!voiceOK)return;const all=speechSynthesis.getVoices();
  const fr=all.filter(v=>/^fr/i.test(v.lang)),ar=all.filter(v=>/^ar/i.test(v.lang));
  voices.fr=fr.find(v=>/fr-FR/i.test(v.lang)&&/google|amélie|thomas|denise|henri/i.test(v.name))||fr.find(v=>/fr-FR/i.test(v.lang))||fr[0]||null;
  voices.ar=ar.find(v=>/google|hamed|zariyah|maged|salma|hoda|naayf/i.test(v.name))||ar[0]||null;setNote()}
function setNote(){$('vnote').textContent=(!voiceOK||(speechSynthesis.getVoices().length&&!voices[lang]))?T('vnone'):T('vnote')}
if(voiceOK){pickVoices();speechSynthesis.onvoiceschanged=pickVoices}
let seenTimer=null;
function show(i,withStart){
  idx=i;const s=cur.scenes[i];
  clearTimeout(seenTimer);if(!withStart){const lid=cur.id;seenTimer=setTimeout(()=>{if(cur.id===lid&&idx===i)markScene(i)},6000)}
  stage.innerHTML=s.svg()+(withStart?`<button class="startbtn" id="big">${T('big')}</button>`:'');
  if(withStart)$('big').onclick=()=>start();
  $('capT').textContent=L(s.t);$('capP').textContent=L(s.say);
  $('fx').innerHTML=s.fx.map(([f,p])=>`<div><span class="mono">${f}</span><p><b>${T('clair')}</b> ${L(p)}</p></div>`).join('');
  $('where').textContent=T('where',{a:i+1,b:cur.scenes.length});
  $('words').innerHTML=s.w.length?`<span>${T('words')}</span>`+s.w.map(w=>`<b title="${L(cur.gloss[w].d).replace(/"/g,'&quot;')}">${cur.gloss[w][lang]}</b>`).join(''):'';
  [...segs.children].forEach((b,k)=>b.firstChild.style.width=k<i?'100%':'0');
  [...$('chap').children].forEach((li,k)=>li.firstChild.setAttribute('aria-current',k===i));
}
function estimate(t){return Math.max(7000,t.length*(lang==='ar'?75:68))}
function tick(){cancelAnimationFrame(raf);const f=()=>{const p=Math.min(.98,(performance.now()-startT)/dur);if(segs.children[idx])segs.children[idx].firstChild.style.width=(p*100)+'%';if(playing)raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)}
function clearT(){clearTimeout(timer);clearTimeout(safety);cancelAnimationFrame(raf)}
function runScene(){
  clearT();const my=++token,text=L(cur.scenes[idx].say);dur=estimate(text);startT=performance.now();tick();
  const v=voices[lang];
  if($('voice').checked&&voiceOK&&v){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=v.lang;u.voice=v;u.rate=lang==='ar'?.92:1;
    u.onend=()=>{if(my===token&&playing)advance(my)};speechSynthesis.speak(u);
    safety=setTimeout(()=>{if(my===token&&playing)advance(my)},dur*1.8+4000);
  }else{timer=setTimeout(()=>{if(my===token&&playing)advance(my)},dur)}
}
function advance(my){if(my!==token)return;clearT();segs.children[idx].firstChild.style.width='100%';markScene(idx);
  if(idx<cur.scenes.length-1){show(idx+1);timer=setTimeout(()=>{if(my===token&&playing)runScene()},600)}
  else{playing=false;ended=true;play.textContent=T('again');
    const e=document.createElement('div');e.className='end';e.innerHTML=`<strong>${T('endT')}</strong><button class="startbtn" style="position:static" id="toq">${T('toQuiz')}</button>`;stage.appendChild(e);
    $('toq').onclick=()=>$('quizsec').scrollIntoView({behavior:'smooth'})}
}
function stop(){playing=false;token++;clearT();if(voiceOK)speechSynthesis.cancel();play.textContent=T('play')}
function start(){if(ended){ended=false;show(0)}playing=true;play.textContent=T('pause');const b=$('big');if(b)b.remove();runScene()}
function jump(i){const was=playing;stop();ended=false;show(i);if(was)start()}
play.onclick=()=>playing?stop():start();
$('prev').onclick=()=>jump(Math.max(0,idx-1));
$('next').onclick=()=>jump(Math.min(cur.scenes.length-1,idx+1));
$('subs').onchange=e=>{$('caption').hidden=!e.target.checked;$('fx').hidden=!e.target.checked};
$('voice').onchange=()=>{if(playing){token++;clearT();if(voiceOK)speechSynthesis.cancel();runScene()}};

/* ================================================ Quiz */
function makeQuiz(DATA,boxId,scoreId,lessonId){
  const answered={};
  function render(only){const box=$(boxId);box.innerHTML='';$(scoreId).innerHTML='';
    DATA.forEach((q,i)=>{if(only&&!only.includes(i))return;
      const d=document.createElement('div');d.className='q';
      d.innerHTML=`<h3><span>${T('Q')}${i+1}</span>${L(q.q)}</h3><div class="opts"></div><p class="fb" hidden></p>`;
      const opts=d.querySelector('.opts'),fb=d.querySelector('.fb');
      L(q.o).forEach((o,k)=>{const b=document.createElement('button');b.className='opt';b.textContent=o;
        b.onclick=()=>{answered[i]=k===q.c;[...opts.children].forEach((x,j)=>{x.disabled=true;if(j===q.c)x.classList.add('good');else if(j===k)x.classList.add('badc')});
          fb.hidden=false;fb.innerHTML=(k===q.c?`<b class="g">${T('good')}</b> `:`<b class="b">${T('bad')}</b> `)+L(q.e);fin(only)};
        opts.appendChild(b)});
      box.appendChild(d)})}
  function fin(only){const ids=only||DATA.map((_,i)=>i);if(!ids.every(i=>i in answered))return;
    const good=DATA.filter((_,i)=>answered[i]).length,miss=DATA.map((_,i)=>i).filter(i=>!answered[i]),sc=$(scoreId);
    track({lesson:lessonId,type:'quiz',score:good,total:DATA.length,missed:miss,mastered:!miss.length});
    if(!miss.length){sc.innerHTML=`<span>${T('quizOk',{a:good,b:DATA.length})}</span>`;return}
    sc.innerHTML=`<span>${T('score',{a:good,b:DATA.length})}</span><button class="btn main">${T('retry')}</button>`;
    sc.querySelector('button').onclick=()=>{miss.forEach(i=>delete answered[i]);render(miss)}}
  render()}

/* ================================================ Langue et démarrage */
function setLang(l){lang=l;try{localStorage.setItem('lang',l)}catch(e){}stop();ended=false;renderLesson();renderWho()}
function renderWho(){if(!ME)return;$('whoName').textContent=ME.name;$('logout').textContent=T('logout');$('saveErr').textContent=T('saveErr');
  const d=$('toDash');d.hidden=ME.role==='learner';d.textContent=T('dash')}
$('logout').onclick=async()=>{await fetch('/api/logout',{method:'POST',headers:{'X-Requested-With':'fetch'}});location.href='/connexion'};
/* Temps passé : une minute comptée tant que la page est visible. */
setInterval(()=>{if(document.visibilityState==='visible'&&ME)track({lesson:cur.id,type:'time',seconds:60})},60000);
$('l-fr').onclick=()=>setLang('fr');$('l-ar').onclick=()=>setLang('ar');
try{lang=localStorage.getItem('lang')||'fr'}catch(e){}
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id&&id!==cur.id)go(id,true)});
(async()=>{
  const r=await fetch('/api/me');if(r.status===401){location.href='/connexion';return}
  const me=await r.json();if(me.user.must_change){location.href='/mot-de-passe';return}ME=me.user;
  try{const p=await (await fetch('/api/progress')).json();(p.progress||[]).forEach(x=>PROG[x.lesson_id]=x)}catch(e){}
  const h0=location.hash.slice(1),first=LESSONS.find(l=>!(PROG[l.id]&&PROG[l.id].completed_at))||LESSONS[0];
  cur=LESSONS.find(x=>x.id===h0)||first;
  if(!h0)$('progbox').open=true;
  renderLesson();renderWho();
})();
