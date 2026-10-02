// Dossiers de suivi et courriers standards. Utilise les fonctions de la page principale
// ($, api, show, save, load, LANGS, go, langName).
const D = {list: [], cur: null, letters: null, tpl: null};
const TYPES = {rdv:"📅 Rendez-vous", appel:"📞 Appel", demarche:"📝 Démarche", courrier:"✉️ Courrier", note:"🗒️ Note"};
const today = () => new Date().toISOString().slice(0,10);
const frDate = iso => { if(!iso) return ""; const d = new Date(iso+"T12:00:00"); return isNaN(d) ? iso : d.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}); };
function el(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text!==undefined) e.textContent = text; return e; }
function dj(path, method, body){
  return api(path, {method, headers:{"Content-Type":"application/json"}, body: body===undefined ? undefined : JSON.stringify(body)});
}
function who(){
  let w = load("who");
  if(!w){ w = (prompt("Votre prénom (il signera vos notes de suivi) :") || "").trim().slice(0,40); if(w) save("who", w); }
  return w || "";
}
function fullName(d){ return [d.prenom, d.nom].filter(Boolean).join(" "); }

// ---------- liste
async function openDossiers(){
  show("dossiers"); $("dMsg").textContent = "Chargement…"; $("dList").innerHTML = "";
  try{
    const j = await dj("/api/dossiers","GET");
    D.list = j.dossiers; $("dMsg").textContent = "";
    renderList();
  }catch(e){ $("dMsg").textContent = "⚠️ " + e.message; }
}
function renderList(){
  const q = $("dSearch").value.trim().toLowerCase(), box = $("dList"); box.innerHTML = "";
  const rows = D.list.filter(d => !q || fullName(d).toLowerCase().includes(q));
  if(!rows.length){ box.append(el("div","empty", D.list.length ? "Aucun résultat." : "Aucun dossier pour l'instant.")); return; }
  for(const d of rows){
    const b = el("button","dcard"); b.type = "button";
    b.append(el("div","n", fullName(d) || "(sans nom)"));
    const m = el("div","m");
    const st = el("span","badge"+(d.statut==="Clos"?" clos":""), d.statut); m.append(st);
    if(d.echeance){ const late = d.statut!=="Clos" && d.echeance < today(); m.append(el("span","badge"+(late?" late":""), (late?"⚠️ ":"")+"Échéance " + frDate(d.echeance))); }
    m.append(document.createTextNode(d.langue_nom || ""));
    b.append(m); b.onclick = () => openDossier(d.id); box.append(b);
  }
}
$("dSearch").oninput = renderList;
$("dNew").onclick = () => openForm(null);

// ---------- formulaire
for(const e of LANGS) $("fLang").add(new Option(e[1].split(" — ").pop(), e[0]));
function openForm(d){
  D.editing = d; $("dFormTitle").textContent = d ? "Modifier le dossier" : "Nouveau dossier";
  $("fPrenom").value = d?.prenom || ""; $("fNom").value = d?.nom || ""; $("fTel").value = d?.tel || "";
  $("fLang").value = d?.langue_code || $("lang").value; $("fStatut").value = d?.statut || "En cours";
  $("fEch").value = d?.echeance || ""; $("fNotes").value = d?.notes || ""; $("fMsg").textContent = "";
  show("dform");
}
$("fCancel").onclick = () => D.editing ? show("dossier") : show("dossiers");
$("fSave").onclick = async () => {
  const e = LANGS.find(l => l[0] === $("fLang").value);
  const body = {prenom:$("fPrenom").value, nom:$("fNom").value, tel:$("fTel").value, langue_code:e[0],
    langue_nom:e[2], statut:$("fStatut").value, echeance:$("fEch").value, notes:$("fNotes").value};
  try{
    D.cur = D.editing ? await dj("/api/dossiers/"+D.editing.id,"PUT",body) : await dj("/api/dossiers","POST",body);
    renderDossier(); show("dossier");
  }catch(err){ $("fMsg").textContent = "⚠️ " + err.message; }
};

// ---------- fiche
async function openDossier(id){
  try{ D.cur = await dj("/api/dossiers/"+id,"GET"); renderDossier(); show("dossier"); }
  catch(e){ $("dMsg").textContent = "⚠️ " + e.message; }
}
function renderDossier(){
  const d = D.cur, h = $("dHead"); h.innerHTML = "";
  const card = el("div","dcard"); card.append(el("div","n", fullName(d)));
  const m = el("div","m"); m.append(el("span","badge"+(d.statut==="Clos"?" clos":""), d.statut));
  if(d.echeance) m.append(el("span","badge", "Échéance " + frDate(d.echeance)));
  m.append(document.createTextNode([d.langue_nom, d.tel].filter(Boolean).join(" · "))); card.append(m);
  if(d.notes){ const n = el("div","m", d.notes); n.style.whiteSpace = "pre-wrap"; n.style.color = "var(--ink)"; card.append(n); }
  h.append(card);
  $("jDate").value = today(); $("jText").value = "";
  $("dClose").textContent = d.statut === "Clos" ? "Rouvrir le dossier" : "Clore le dossier";
  const list = $("jList"); list.innerHTML = "";
  for(const e of [...d.journal].reverse()){
    const row = el("div","entry");
    const x = el("button","", "✕"); x.setAttribute("aria-label","Supprimer cette note");
    x.onclick = async () => { if(confirm("Supprimer cette ligne du suivi ?")){ D.cur = await dj(`/api/dossiers/${d.id}/journal/${e.id}`,"DELETE"); renderDossier(); } };
    row.append(x, el("div","h", `${TYPES[e.type]||""} · ${frDate(e.date)}${e.auteur ? " · " + e.auteur : ""}`), el("div","", e.texte));
    row.lastChild.style.whiteSpace = "pre-wrap"; list.append(row);
  }
  if(!d.journal.length) list.append(el("div","empty","Aucun suivi pour l'instant."));
}
async function addJournal(type, texte, date){
  D.cur = await dj(`/api/dossiers/${D.cur.id}/journal`,"POST",{type, texte, date: date || today(), auteur: who()});
}
$("jAdd").onclick = async () => {
  const t = $("jText").value.trim(); if(!t) return;
  try{ await addJournal($("jType").value, t, $("jDate").value); renderDossier(); }catch(e){ alert(e.message); }
};
$("dEdit").onclick = () => openForm(D.cur);
$("dClose").onclick = async () => {
  try{ D.cur = await dj("/api/dossiers/"+D.cur.id,"PUT",{statut: D.cur.statut==="Clos" ? "En cours" : "Clos"}); renderDossier(); }catch(e){ alert(e.message); }
};
$("dDel").onclick = async () => {
  if(!confirm("Supprimer définitivement ce dossier et tout son suivi ? Cette action est irréversible.")) return;
  try{ await dj("/api/dossiers/"+D.cur.id,"DELETE"); D.cur = null; openDossiers(); }catch(e){ alert(e.message); }
};
$("dTranslate").onclick = () => {
  if(D.cur.langue_code){ $("lang").value = D.cur.langue_code; $("lang").dispatchEvent(new Event("change")); }
  go("conv");
};

// ---------- courriers standards
$("dLetter").onclick = async () => {
  try{
    if(!D.letters) D.letters = await api("/api/letters",{method:"GET"});
    const sel = $("lTpl"); sel.innerHTML = "";
    D.letters.templates.forEach((t,i) => sel.add(new Option(t.titre, i)));
    $("lTransOut").classList.add("hide"); $("lMsg").textContent = "";
    pickTemplate(); show("letter");
  }catch(e){ alert(e.message); }
};
$("lTpl").onchange = pickTemplate;
function pickTemplate(){
  const t = D.tpl = D.letters.templates[+$("lTpl").value || 0], box = $("lFields"); box.innerHTML = "";
  const fields = [];
  if(t.pour === "organisme") fields.push({key:"destinataire", label:"Destinataire (nom et adresse)", type:"textarea"});
  fields.push({key:"signataire", label:"Signataire", type:"text", default: load("who")||""});
  fields.push({key:"fonction", label:"Fonction", type:"text", default:"bénévole"});
  fields.push(...t.champs);
  for(const f of fields){
    const l = el("label","", f.label); const inp = el(f.type==="textarea" ? "textarea" : "input");
    if(f.type==="date"){ inp.type = "date"; } else if(f.type!=="textarea"){ inp.type = "text"; }
    inp.dataset.key = f.key; inp.value = f.default || ""; inp.oninput = renderLetter;
    box.append(l, inp);
  }
  $("lTransOut").classList.add("hide");
  renderLetter();
}
function letterValues(){
  const a = D.letters.asso, v = {prenom:D.cur.prenom, nom:D.cur.nom, asso_nom:a.nom, asso_adresse:a.adresse,
    asso_contact:a.contact, ville:a.ville, date:frDate(today())};
  $("lFields").querySelectorAll("[data-key]").forEach(i => v[i.dataset.key] = i.type==="date" ? frDate(i.value) : i.value.trim());
  return v;
}
const fill = (txt, v) => txt.replace(/\{\{(\w+)\}\}/g, (m,k) => v[k] || "…………");
function paper(into){
  const t = D.tpl, v = letterValues(), a = D.letters.asso; into.innerHTML = "";
  into.append(el("div","from", `${a.nom}\n${a.adresse}\n${a.contact}`));
  if(t.pour === "organisme") into.append(el("div","to", v.destinataire || "…………"));
  const lieu = el("div","", `${v.ville ? "Fait à " + v.ville + ", le " : "Le "}${v.date}`); lieu.style.textAlign = "right"; lieu.style.marginTop = "14px"; into.append(lieu);
  into.append(el("div","ob", "Objet : " + fill(t.objet, v)));
  const body = fill(t.corps, v); into.append(el("div","bd", body));
  const sig = el("div","", [v.signataire, v.fonction && ("("+v.fonction+")"), a.nom].filter(Boolean).join("\n")); sig.style.cssText = "margin-top:26px;white-space:pre-line;text-align:right"; into.append(sig);
  return {body, objet: fill(t.objet, v)};
}
function renderLetter(){ paper($("lPreview")); }
$("lPrint").onclick = async () => {
  paper($("printArea")); // lit les champs actuels
  const t = D.tpl;
  try{ await addJournal("courrier", "Courrier généré : " + t.titre); }catch(e){}
  window.print();
};
$("lTrans").onclick = async () => {
  const {body} = paper(document.createElement("div")), lang = D.cur.langue_nom || "";
  if(!lang){ $("lMsg").textContent = "Indiquez la langue dans le dossier."; return; }
  $("lMsg").textContent = "Traduction…";
  try{
    const out = await api("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:body,from:"français",to:lang})});
    $("lTransOut").textContent = out.translation; $("lTransOut").classList.remove("hide");
    $("lMsg").textContent = "⚠️ Traduction automatique : joignez-la au courrier en français, qui seul fait foi.";
  }catch(e){ $("lMsg").textContent = "⚠️ " + e.message; }
};
// retour vers la fiche depuis le courrier : bouton « Accueil » de l'en-tête déjà prévu

// ---------- bouton retour : remonte d'un niveau dans les dossiers
const UP = {dossiers:null, dform:()=>D.editing ? show("dossier") : show("dossiers"), dossier:()=>openDossiers(), letter:()=>{ renderDossier(); show("dossier"); }};
const _homeBack = $("back").onclick;
$("back").onclick = () => {
  const cur = document.querySelector(".screen.on").id;
  if(UP[cur]) UP[cur](); else _homeBack();
};
const _showD = show;
show = function(id){ _showD(id); const t = $("back").lastChild; if(t && t.nodeType===3) t.textContent = UP[id] ? " Retour" : " Accueil"; };

// ---------- export / import Excel
async function download(path, filename){
  const r = await fetch(path, {headers:{"X-Access-Code": $("code").value}});
  if(!r.ok){ const j = await r.json().catch(()=>({})); throw new Error(j.error || ("Erreur "+r.status)); }
  const a = document.createElement("a"); a.href = URL.createObjectURL(await r.blob()); a.download = filename;
  document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
$("dExport").onclick = async () => {
  try{ await download("/api/dossiers-export", "dossiers-" + today() + ".xlsx"); $("dMsg").textContent = "✅ Fichier Excel téléchargé."; }
  catch(e){ $("dMsg").textContent = "⚠️ " + e.message; }
};
$("dModele").onclick = async () => {
  try{ await download("/api/dossiers-modele", "modele-dossiers.xlsx"); $("dMsg").textContent = "✅ Modèle téléchargé : remplissez-le puis importez-le."; }
  catch(e){ $("dMsg").textContent = "⚠️ " + e.message; }
};
$("dImport").onclick = () => $("dFile").click();
$("dFile").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if(!f) return;
  $("dMsg").textContent = "Import en cours…";
  try{
    const fd = new FormData(); fd.append("file", f);
    const j = await api("/api/dossiers-import", {method:"POST", body: fd});
    await openDossiers();
    $("dMsg").textContent = `✅ ${j.crees} dossier(s) ajouté(s)` + (j.ignores ? `, ${j.ignores} déjà existant(s) ignoré(s)` : "") + "." + (j.problemes.length ? "\n⚠️ " + j.problemes.join("\n⚠️ ") : "");
    $("dMsg").style.whiteSpace = "pre-line";
  }catch(err){ $("dMsg").textContent = "⚠️ " + err.message; }
};
