// Onglets Entreprises (offres + candidats suggérés) et Tableau de bord, données de démonstration.
const E = {list: [], cur: null, editing: null};
const nrm = t => String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ");
const DONE_ETAPES = /embauch|suivi apres|clos/;   // étapes où le candidat n'est plus à proposer

// ---------- onglets
function showTab(t){
  document.querySelectorAll("#dTabs button").forEach(b => b.classList.toggle("sel", b.dataset.tab === t));
  $("tabCand").classList.toggle("hide", t !== "cand"); $("tabEnt").classList.toggle("hide", t !== "ent"); $("tabBoard").classList.toggle("hide", t !== "board");
  if(t === "cand") dj("/api/dossiers","GET").then(j => { D.list = j.dossiers; renderList(); }).catch(e => $("dMsg").textContent = "⚠️ " + e.message);
  if(t === "ent") loadEntreprises(); if(t === "board") renderBoard();
}
document.querySelectorAll("#dTabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
const _openDossiers = openDossiers;
openDossiers = async function(){ await _openDossiers(); const sel = document.querySelector("#dTabs .sel"); if(sel && sel.dataset.tab !== "cand") showTab(sel.dataset.tab); };

// ---------- entreprises : liste
async function loadEntreprises(){
  try{ await ensureCfg(); E.list = (await dj("/api/entreprises","GET")).entreprises; renderEntList(); }
  catch(e){ $("eList").replaceChildren(el("div","empty","⚠️ " + e.message)); }
}
const ouvertes = e => (e.offres||[]).filter(o => o.statut === "Ouverte");
function renderEntList(){
  const box = $("eList"); box.innerHTML = "";
  if(!E.list.length){ box.append(el("div","empty","Aucune entreprise pour l'instant.")); return; }
  for(const e of E.list){
    const b = el("button","dcard"); b.type = "button";
    b.append(el("div","n", e.nom)); const m = el("div","m");
    if(e.demo) m.append(el("span","badge late","DÉMO"));
    const n = ouvertes(e).reduce((a,o) => a + o.nb, 0);
    m.append(el("span","badge"+(ouvertes(e).some(o => o.urgence === "Urgente") ? " late" : ""), n ? `${n} poste(s) à pourvoir` : "Aucune offre ouverte"));
    m.append(document.createTextNode([e.secteur, e.contact_nom].filter(Boolean).join(" · ")));
    b.append(m); b.onclick = () => openEntreprise(e.id); box.append(b);
  }
}
$("eNew").onclick = () => openEForm(null);

// ---------- formulaire entreprise
function openEForm(e){
  E.editing = e; $("eFormTitle").textContent = e ? "Modifier l'entreprise" : "Nouvelle entreprise";
  $("eNom").value = e?.nom || ""; $("eSecteur").value = e?.secteur || ""; $("eContactNom").value = e?.contact_nom || "";
  $("eContactTel").value = e?.contact_tel || ""; $("eContactEmail").value = e?.contact_email || "";
  $("eAdresse").value = e?.adresse || ""; $("eNotes").value = e?.notes || ""; $("eMsg").textContent = ""; show("eform");
}
$("eCancel").onclick = () => E.editing ? show("entreprise") : (show("dossiers"), showTab("ent"));
$("eSave").onclick = async () => {
  const body = {nom:$("eNom").value, secteur:$("eSecteur").value, contact_nom:$("eContactNom").value, contact_tel:$("eContactTel").value,
    contact_email:$("eContactEmail").value, adresse:$("eAdresse").value, notes:$("eNotes").value};
  try{
    E.cur = E.editing ? await dj("/api/entreprises/"+E.editing.id,"PUT",body) : await dj("/api/entreprises","POST",body);
    renderEntreprise(); show("entreprise");
  }catch(err){ $("eMsg").textContent = "⚠️ " + err.message; }
};

// ---------- fiche entreprise + offres + candidats suggérés
async function openEntreprise(id){
  try{
    await ensureCfg();
    E.cur = (await dj("/api/entreprises","GET")).entreprises.find(e => e.id === id);
    D.list = (await dj("/api/dossiers","GET")).dossiers;
    fillSelect($("oNiv"), D.cfg.niveaux_francais, "Français minimum : aucun");
    renderEntreprise(); show("entreprise");
  }catch(e){ alert(e.message); }
}
function suggestions(offre){
  const toks = nrm(offre.poste).split(/\s+/).filter(w => w.length >= 4).map(w => w.slice(0,5));
  const niv = D.cfg.niveaux_francais, need = niv.indexOf(offre.niveau_min);
  return D.list.map(c => {
    if(c.statut === "Clos" || DONE_ETAPES.test(nrm(c.etape))) return null;
    const m = nrm(c.metier); if(!m.trim() || !toks.some(t => m.includes(t))) return null;
    const okNiv = need < 0 || niv.indexOf(c.niveau_fr) >= need;
    return {c, okNiv, score: 3 + (c.consentement ? 2 : 0) + (okNiv ? 1 : 0) - (c.entreprise ? 1 : 0)};
  }).filter(Boolean).sort((a,b) => b.score - a.score).slice(0, 8);
}
function renderEntreprise(){
  const e = E.cur, h = $("eHead"); h.innerHTML = "";
  const card = el("div","dcard"); card.append(el("div","n", e.nom));
  const info = [e.secteur, e.contact_nom && "Contact : " + e.contact_nom, e.contact_tel, e.contact_email, e.adresse].filter(Boolean).join("\n");
  const m = el("div","m", info); m.style.whiteSpace = "pre-line"; m.style.color = "var(--ink)"; card.append(m);
  if(e.notes){ const n = el("div","m", e.notes); n.style.whiteSpace = "pre-wrap"; card.append(n); }
  h.append(card);
  const box = $("oList"); box.innerHTML = "";
  if(!(e.offres||[]).length) box.append(el("div","empty","Aucune offre pour l'instant."));
  for(const o of e.offres || []){
    const c = el("div","offre"), top = el("div","n", `${o.nb} × ${o.poste}`); c.append(top);
    const mm = el("div","m"); mm.append(el("span","badge"+(o.urgence==="Urgente"?" late":""), o.urgence));
    mm.append(document.createTextNode(o.niveau_min ? "Français min. : " + o.niveau_min : "")); c.append(mm);
    const row = el("div","row"); row.style.marginTop = "6px";
    const st = el("select"); for(const x of ["Ouverte","Pourvue","Annulée"]) st.add(new Option(x,x)); st.value = o.statut;
    st.onchange = () => saveOffres(E.cur.offres.map(z => z.id === o.id ? {...z, statut: st.value} : z));
    const del = el("button","back","🗑"); del.setAttribute("aria-label","Supprimer l'offre");
    del.onclick = () => confirm("Supprimer cette offre ?") && saveOffres(E.cur.offres.filter(z => z.id !== o.id));
    row.append(st, del); c.append(row);
    if(o.statut === "Ouverte"){
      const sg = suggestions(o), s = el("div","sugg");
      s.append(el("b","", sg.length ? "👥 Candidats suggérés" : "👥 Aucun candidat correspondant pour l'instant"));
      for(const x of sg){
        const r = el("div","c"), t = el("span","", `${fullName(x.c)} — ${x.c.metier}${x.c.niveau_fr ? " · " + x.c.niveau_fr : ""}${x.okNiv ? "" : " (français < min.)"}${x.c.consentement ? " · ✅ consentement" : " · ⚠️ sans consentement"}${x.c.entreprise ? " · déjà proposé à " + x.c.entreprise : ""}`);
        const b = el("button","btn","Proposer"); b.onclick = () => proposer(x.c, o);
        r.append(t, b); s.append(r);
      }
      c.append(s);
    }
    box.append(c);
  }
}
async function saveOffres(offres){
  try{ E.cur = await dj("/api/entreprises/"+E.cur.id,"PUT",{offres}); renderEntreprise(); }catch(e){ alert(e.message); }
}
async function proposer(c, o){
  if(!c.consentement){ alert("Le consentement de cette personne à la transmission de son dossier n'est pas enregistré.\n\nFaites-lui signer le courrier « Consentement » (Dossiers → son dossier → Courrier standard), puis enregistrez la date."); return; }
  if(!confirm(`Proposer ${fullName(c)} à ${E.cur.nom} pour le poste « ${o.poste} » ?`)) return;
  const etape = D.cfg.etapes.find(x => /propos/i.test(nrm(x))) || c.etape;
  try{
    await dj("/api/dossiers/"+c.id, "PUT", {entreprise: E.cur.nom, etape});
    await dj(`/api/dossiers/${c.id}/journal`, "POST", {type:"demarche", texte:`Proposé à ${E.cur.nom} pour le poste « ${o.poste} ».`, date: today(), auteur: who()});
    D.list = (await dj("/api/dossiers","GET")).dossiers; renderEntreprise();
  }catch(e){ alert(e.message); }
}
$("oAdd").onclick = () => {
  const poste = $("oPoste").value.trim(); if(!poste) return;
  saveOffres([...(E.cur.offres||[]), {poste, nb:+$("oNb").value || 1, urgence:$("oUrg").value, niveau_min:$("oNiv").value, statut:"Ouverte"}]);
  $("oPoste").value = ""; $("oNb").value = 1;
};
$("eEdit").onclick = () => openEForm(E.cur);
$("eDel").onclick = async () => {
  if(!confirm("Supprimer cette entreprise et ses offres ?")) return;
  try{ await dj("/api/entreprises/"+E.cur.id,"DELETE"); show("dossiers"); showTab("ent"); }catch(e){ alert(e.message); }
};
UP.eform = () => E.editing ? show("entreprise") : (show("dossiers"), showTab("ent"));
UP.entreprise = () => { show("dossiers"); showTab("ent"); };

// ---------- tableau de bord
async function renderBoard(){
  const box = $("tabBoard"); box.innerHTML = "";
  try{
    await ensureCfg();
    const [ds, es] = await Promise.all([dj("/api/dossiers","GET"), dj("/api/entreprises","GET")]);
    D.list = ds.dossiers; E.list = es.entreprises;
    const actifs = D.list.filter(d => d.statut !== "Clos"), kp = el("div","kpis");
    const kpi = (n, t, warn) => { const k = el("div","kpi"+(warn?" warn2":"")); k.append(el("b","",String(n)), document.createTextNode(t)); kp.append(k); };
    const postes = E.list.flatMap(e => ouvertes(e)), nbPostes = postes.reduce((a,o) => a + o.nb, 0);
    const titres = actifs.filter(d => titreBadge(d));
    kpi(actifs.length, "candidats en cours");
    kpi(nbPostes, "postes à pourvoir" + (postes.some(o => o.urgence==="Urgente") ? " (dont urgents)" : ""), postes.some(o => o.urgence==="Urgente"));
    kpi(titres.length, "titre(s) de séjour à surveiller", titres.length > 0);
    kpi(actifs.filter(d => !d.consentement).length, "sans consentement enregistré", actifs.some(d => !d.consentement));
    box.append(kp);
    box.append(el("h3","","Candidats par étape"));
    const max = Math.max(1, ...D.cfg.etapes.map(e => actifs.filter(d => d.etape === e).length));
    for(const e of D.cfg.etapes){
      const n = actifs.filter(d => d.etape === e).length, r = el("div","brow");
      const bar = el("div","bar"); bar.style.width = (n/max*100) + "%";
      const t = el("div","t"); t.append(bar); r.append(el("div","l",e), el("div","n",String(n)), t); box.append(r);
    }
    if(titres.length){
      box.append(el("h3","","Titres de séjour à surveiller"));
      for(const d of titres.sort((a,b) => joursTitre(a) - joursTitre(b))) box.append(el("div","m", `${fullName(d)} — ${joursTitre(d) < 0 ? "expiré depuis " + (-joursTitre(d)) + " j" : "expire dans " + joursTitre(d) + " j"}`));
    }
    // démonstration
    box.append(el("h3","","Démonstration"));
    const p = el("div","warn","Crée 8 candidats et 3 entreprises FICTIFS pour présenter l'application sans aucune vraie donnée. Ils sont marqués « DÉMO » et se suppriment d'un clic, sans toucher aux vrais dossiers.");
    const r = el("div","row"); r.style.margin = "8px 0";
    const a = el("button","btn sec","Créer les données de démo"), z = el("button","btn sec","Supprimer les données de démo");
    a.onclick = async () => { try{ await dj("/api/demo","POST",{}); renderBoard(); }catch(e){ alert(e.message); } };
    z.onclick = async () => { if(confirm("Supprimer tous les dossiers et entreprises marqués DÉMO ?")){ try{ const j = await dj("/api/demo","DELETE"); alert(j.supprimes + " élément(s) de démo supprimé(s)."); renderBoard(); }catch(e){ alert(e.message); } } };
    r.append(a, z); box.append(p, r);
  }catch(e){ box.append(el("div","empty","⚠️ " + e.message)); }
}
