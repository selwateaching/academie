/* Connexion et changement de mot de passe, en français ou en arabe. */
const G={
 fr:{brand:"Formation dessalement",loginH:"Connexion",loginP:"Entre l'e-mail et le mot de passe reçus de ton responsable de formation.",email:"E-mail",pass:"Mot de passe",go:"Se connecter",busy:"Connexion…",
  pwH:"Choisis ton mot de passe",pwP:"Ton mot de passe actuel est provisoire. Choisis-en un nouveau, d'au moins 8 caractères, que tu seras seule à connaître.",cur:"Mot de passe actuel (provisoire)",nw:"Nouveau mot de passe",nw2:"Confirme le nouveau mot de passe",save:"Enregistrer",saving:"Enregistrement…",
  mismatch:"Les deux mots de passe ne sont pas identiques.",short:"Le mot de passe doit faire au moins 8 caractères.",net:"Connexion au serveur impossible. Vérifie ta connexion internet et réessaie.",forgot:"Mot de passe oublié ? Demande à ton responsable de formation de le réinitialiser."},
 ar:{brand:"تكوين في تحلية المياه",loginH:"تسجيل الدخول",loginP:"أدخلي البريد الإلكتروني وكلمة المرور اللذين تلقّيتهما من مسؤول التكوين.",email:"البريد الإلكتروني",pass:"كلمة المرور",go:"دخول",busy:"جارٍ الدخول…",
  pwH:"اختاري كلمة مرورك",pwP:"كلمة مرورك الحالية مؤقتة. اختاري كلمة جديدة من 8 أحرف على الأقل، لا يعرفها أحد غيرك.",cur:"كلمة المرور الحالية (المؤقتة)",nw:"كلمة المرور الجديدة",nw2:"أكّدي كلمة المرور الجديدة",save:"حفظ",saving:"جارٍ الحفظ…",
  mismatch:"كلمتا المرور غير متطابقتين.",short:"يجب أن تتكوّن كلمة المرور من 8 أحرف على الأقل.",net:"تعذّر الاتصال بالخادم. تحقّقي من اتصالك بالإنترنت وأعيدي المحاولة.",forgot:"نسيتِ كلمة المرور؟ اطلبي من مسؤول التكوين إعادة تعيينها."}
};
let lang='fr';try{lang=localStorage.getItem('lang')||'fr'}catch(e){}
const $=id=>document.getElementById(id);
function applyLang(){const h=document.documentElement;h.lang=lang;h.dir=lang==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-g]').forEach(e=>e.textContent=G[lang][e.dataset.g]);
  $('l-fr').setAttribute('aria-pressed',lang==='fr');$('l-ar').setAttribute('aria-pressed',lang==='ar')}
function setLang(l){lang=l;try{localStorage.setItem('lang',l)}catch(e){}applyLang()}
$('l-fr').onclick=()=>setLang('fr');$('l-ar').onclick=()=>setLang('ar');applyLang();
const home=u=>u.must_change?'/mot-de-passe':u.role==='learner'?'/formation':'/tableau-de-bord';
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'fetch'},body:JSON.stringify(body)});
  let j={};try{j=await r.json()}catch(e){}return {ok:r.ok,status:r.status,j}}
function busy(btn,key,on){btn.disabled=on;btn.textContent=G[lang][key]}
