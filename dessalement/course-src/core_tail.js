/* ================================================ Leçons et programme */
const conv=b=>({t:{fr:b.fr[0],ar:b.ar[0]},like:{fr:b.fr[1],ar:b.ar[1]},ex:{fr:b.fr[2],ar:b.ar[2]},fr0:b.fr0});
const BASES_QUIZ=WARM.concat([
 {q:X0("Combien d'atomes y a-t-il dans une molécule d'eau, H₂O ?","كم ذرة في جزيء الماء H₂O؟"),o:X0(["2","3","4"],["2","3","4"]),c:1,e:X0("Deux atomes d'hydrogène (H₂) et un atome d'oxygène (O) : 3 atomes.","ذرتا هيدروجين (H₂) وذرة أكسجين (O): 3 ذرات.")},
 {q:X0("« Précipiter », en chimie, c'est…","«الترسّب» في الكيمياء هو…"),o:X0(["se dissoudre dans l'eau","redevenir solide et se déposer","s'évaporer"],["الانحلال في الماء","العودة إلى الحالة الصلبة والاستقرار في القعر","التبخّر"]),c:1,e:X0("Comme le calcaire qui se dépose au fond de la bouilloire.","مثل الكلس الذي يترسّب في قعر الغلاية.")}
]);
const LESSONS=[
 {id:'bases',kind:'reading',eyebrow:X0("Module 0 · Avant de commencer","الوحدة 0 · قبل البدء"),title:X0("Les bases de la chimie, sans formules","أساسيات الكيمياء، دون معادلات"),
  lead:X0("Huit idées simples, avec des exemples de la maison, pour suivre toute la formation. À lire en premier.","ثماني أفكار بسيطة، مع أمثلة من البيت، لمتابعة التكوين كله. تُقرأ أولًا."),
  meta:X0(["8 fiches","l'échelle du pH","lire une formule","quiz de 5 questions"],["8 بطاقات","سُلّم الـ pH","قراءة صيغة","اختبار من 5 أسئلة"]),
  prepH:X0("Les 8 idées de base","الأفكار الأساسية الثماني"),prepLead:X0("Prends le temps de les lire : elles reviennent dans toutes les leçons.","خذي وقتك لقراءتها: فهي تتكرّر في كل الدروس."),
  prep:BASICS.map(conv),quiz:BASES_QUIZ},
 {id:'contexte',kind:'video',eyebrow:X0("Module 1 · Le contexte algérien · Leçon 1","الوحدة 1 · السياق الجزائري · الدرس 1"),title:X0("Pourquoi l'Algérie dessale l'eau de mer","لماذا تُحلّي الجزائر مياه البحر"),
  lead:X0("Le manque d'eau, les sécheresses, et la réponse du pays : des stations de dessalement de plus en plus grandes le long de la côte. Une leçon sans chimie, pour comprendre à quoi va servir ta formation.","نقص الماء، والجفاف، وردّ البلاد: محطات تحلية أكبر فأكبر على طول الساحل. درس دون كيمياء، لفهم فائدة تكوينك."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M1_PREP,scenes:M1_SCENES,gloss:M1_GLOSS,quiz:M1_QUIZ,sources:M1_SOURCES},
 {id:'eau-de-mer',kind:'video',eyebrow:X0("Module 2 · Chimie de l'eau de mer · Leçon 1","الوحدة 2 · كيمياء مياه البحر · الدرس 1"),title:X0("Qu'y a-t-il dans l'eau de mer ?","ماذا يوجد في مياه البحر؟"),
  lead:X0("Avant d'apprendre à la traiter, il faut savoir ce que contient l'eau de mer : du sel bien sûr, mais aussi des ions plus discrets, des êtres vivants et des poussières. Chacun pose un problème différent à la station.","قبل أن نتعلّم كيف نعالجها، يجب أن نعرف ما تحتويه مياه البحر: الملح طبعًا، لكن أيضًا شوارد أقلّ ظهورًا، وكائنات حيّة، وغبارًا. كلّ منها يطرح مشكلة مختلفة في المحطة."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M2_PREP,scenes:M2_SCENES,gloss:M2_GLOSS,quiz:M2_QUIZ},
 {id:'osmose',kind:'video',eyebrow:X0("Module 3 · L'osmose · Leçon 1","الوحدة 3 · التناضح · الدرس 1"),title:X0("L'osmose inverse, comment ça marche ?","التناضح العكسي، كيف يعمل؟"),
  lead:X0("Les grandes stations algériennes utilisent l'osmose inverse. Pour la comprendre, on part d'un phénomène que tu connais déjà en cuisine, puis on apprend à l'inverser.","تعتمد محطات التحلية الكبرى في الجزائر على التناضح العكسي. لفهمه، ننطلق من ظاهرة تعرفينها في المطبخ، ثم نتعلّم كيف نعكسها."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M3_PREP,scenes:M3_SCENES,gloss:M3_GLOSS,quiz:M3_QUIZ},
 {id:'pretraitement',kind:'video',eyebrow:X0("Module 4 · Chimie du prétraitement · Leçon 1","الوحدة 4 · كيمياء المعالجة الأولية · الدرس 1"),title:X0("Le prétraitement chimique de l'eau de mer","المعالجة الكيميائية الأولية لمياه البحر"),
  lead:X0("Avant d'arriver aux membranes qui retirent le sel, l'eau de mer reçoit cinq produits, dans un ordre précis. Chaque produit est expliqué par son rôle, avec des exemples de la vie de tous les jours.","قبل أن تصل مياه البحر إلى الأغشية التي تنزع منها الملح، تُضاف إليها خمسة منتجات بترتيب دقيق. نشرح كل منتج بدوره، مع أمثلة من الحياة اليومية."),
  meta:X0(["3 rappels","vidéo de 8 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 8 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:[conv(BASICS[7]),conv(BASICS[5]),conv(BASICS[3])],scenes:M4_SCENES,gloss:M4_GLOSS,quiz:M4_QUIZ},
 {id:'entartrage',kind:'video',eyebrow:X0("Module 5 · Entartrage et encrassement · Leçon 1","الوحدة 5 · الترسّب الكلسي والانسداد · الدرس 1"),title:X0("Tartre et saleté : les ennemis de la membrane","الكلس والأوساخ: أعداء الغشاء"),
  lead:X0("Même avec un bon prétraitement, les membranes finissent par s'abîmer. Cette leçon explique pourquoi les sels se déposent, comment les bactéries s'installent, et quels chiffres surveiller.","حتى مع معالجة أولية جيدة، تتضرّر الأغشية في النهاية. يشرح هذا الدرس لماذا تترسّب الأملاح، وكيف تستقرّ البكتيريا، وأيّ الأرقام يجب مراقبتها."),
  meta:X0(["3 rappels","vidéo de 7 scènes","voix + sous-titres","quiz final"],["3 تذكيرات","فيديو من 7 مشاهد","صوت + ترجمة نصية","اختبار نهائي"]),
  prep:M5_PREP,scenes:M5_SCENES,gloss:M5_GLOSS,quiz:M5_QUIZ}

];
const PROGRAM=[[0,X0("Les bases de la chimie","أساسيات الكيمياء"),'bases'],[1,X0("Le contexte algérien","السياق الجزائري"),'contexte'],[2,X0("Chimie de l'eau de mer","كيمياء مياه البحر"),'eau-de-mer'],
 [3,X0("L'osmose inverse","التناضح العكسي"),'osmose'],[4,X0("Chimie du prétraitement","كيمياء المعالجة الأولية"),'pretraitement'],[5,X0("Entartrage et encrassement","الترسّب الكلسي والانسداد"),'entartrage'],
 [6,X0("Chimie des membranes","كيمياء الأغشية")],[7,X0("Nettoyage chimique des membranes","التنظيف الكيميائي للأغشية")],[8,X0("Post-traitement et reminéralisation","المعالجة النهائية وإعادة التمعدن")],
 [9,X0("Procédés thermiques et électrodialyse","الطرق الحرارية والفرز الكهربائي")],[10,X0("Rejets et environnement","الطرح والبيئة")],[11,X0("Projet final","المشروع النهائي")]];

/* ================================================ Rendu */
const $=id=>document.getElementById(id);
let cur=LESSONS[0],done={};
try{done=JSON.parse(localStorage.getItem('done')||'{}')}catch(e){}
function saveDone(id){done[id]=1;try{localStorage.setItem('done',JSON.stringify(done))}catch(e){}renderProg()}

function renderProg(){
  $('prog').innerHTML=PROGRAM.map(([n,t,id])=>{const st=!id?`<span class="st">${T('soon')}</span>`:done[id]?`<span class="st done">✓ ${T('done')}</span>`:`<span class="st on">${T('avail')}</span>`;
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
function show(i,withStart){
  idx=i;const s=cur.scenes[i];
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
function advance(my){if(my!==token)return;clearT();segs.children[idx].firstChild.style.width='100%';
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
    if(!miss.length){sc.innerHTML=`<span>${T('quizOk',{a:good,b:DATA.length})}</span>`;saveDone(lessonId);return}
    sc.innerHTML=`<span>${T('score',{a:good,b:DATA.length})}</span><button class="btn main">${T('retry')}</button>`;
    sc.querySelector('button').onclick=()=>{miss.forEach(i=>delete answered[i]);render(miss)}}
  render()}

/* ================================================ Langue et démarrage */
function setLang(l){lang=l;try{localStorage.setItem('lang',l)}catch(e){}stop();ended=false;renderLesson()}
$('l-fr').onclick=()=>setLang('fr');$('l-ar').onclick=()=>setLang('ar');
try{lang=localStorage.getItem('lang')||'fr'}catch(e){}
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id&&id!==cur.id)go(id,true)});
const h0=location.hash.slice(1);cur=LESSONS.find(x=>x.id===h0)||LESSONS[0];
if(!h0)$('progbox').open=true;
renderLesson();
