// Assistant d'aide : réponses instantanées (hors ligne) pour les questions courantes,
// et questions libres envoyées à /api/help.
(function(){
  const FAQ = [
    ["Comment traduire une conversation ?", "À l'accueil, choisissez d'abord la langue de la personne.\n1. Appuyez sur « Conversation » (un seul appareil) ou « Deux téléphones » (chacun le sien).\n2. Quand la personne parle : « 🎤 Ils parlent ». Quand vous répondez : « 🎤 Je parle (français) » ou écrivez.\n3. La traduction s'affiche et est lue à voix haute.\nParlez lentement, par phrases courtes."],
    ["Le micro ne marche pas", "1. Autorisez le micro quand le navigateur le demande (cadenas à côté de l'adresse).\n2. Utilisez Chrome ou Edge (Safari sur iPhone).\n3. Vérifiez qu'aucune autre application n'utilise le micro.\nEn attendant, vous pouvez écrire dans la zone de texte."],
    ["Comment utiliser deux téléphones ?", "1. Vous : « Deux téléphones » → un QR code s'affiche.\n2. La personne le scanne avec son téléphone et choisit sa langue, puis « OK ».\n3. Chacun appuie sur son 🎤 et parle : le message arrive traduit sur l'autre écran.\nBouton « 📺 Mode écran » : affichage en grand sur une télé."],
    ["Comment traduire un courrier ?", "1. Accueil → « Document ».\n2. Choisissez : Traduire, Simplifier ou Formulaire.\n3. « 📷 Prendre une photo » (bonne lumière, document à plat), ou « Choisir une image ou un PDF », ou collez le texte.\n4. Lisez le résultat, appuyez sur 🔊 pour l'écouter.\nVérifiez toujours dates et montants sur l'original."],
    ["Comment faire un courrier standard ?", "1. Accueil → « Dossiers et courriers » → ouvrez le dossier de la personne (ou « + Nouveau »).\n2. « ✉️ Courrier standard » → choisissez le modèle.\n3. Remplissez les cases, vérifiez l'aperçu.\n4. « 🖨️ Imprimer / PDF » (choisissez « Enregistrer au format PDF » pour un fichier)."],
    ["Que faire entre deux personnes ?", "Appuyez sur « 🧹 Nouvelle personne » (en haut). Cela efface la conversation, les photos et la session. L'appli le fait aussi toute seule après 10 minutes sans activité. Les dossiers enregistrés ne sont pas supprimés."],
    ["Le code d'accès", "Le code d'accès est demandé une seule fois par appareil, puis mémorisé. Il ne change jamais tout seul : seul le responsable de l'association peut le modifier. S'il est refusé, ressaisissez-le (10 essais ratés bloquent l'accès 15 minutes)."],
    ["La traduction est-elle fiable ?", "C'est une traduction automatique : très utile, mais elle peut se tromper, surtout pour les dialectes et les sujets graves. Pour la santé, la justice ou les papiers, faites vérifier par un interprète ou une personne de confiance. Reformulez avec des phrases courtes si une traduction semble étrange."]
  ];
  const $ = id => document.getElementById(id);
  const guest = !!new URLSearchParams(location.search).get("room");
  if(guest){ $("helpBtn")?.classList.add("hide"); $("helpHome")?.classList.add("hide"); return; }

  const panel = $("helpPanel"), msgs = $("helpMsgs"), hist = [];
  function bubble(role, text){
    const d = document.createElement("div"); d.className = "hmsg " + role; d.textContent = text;
    msgs.append(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function open(){
    panel.classList.remove("hide");
    if(!msgs.children.length){
      bubble("bot", "Bonjour ! Je vous aide à utiliser Tarjam. Choisissez une question ci-dessous ou posez la vôtre.");
    }
    $("helpIn").focus();
  }
  function close(){ panel.classList.add("hide"); }
  $("helpBtn").onclick = open; $("helpClose").onclick = close;
  if($("helpHome")) $("helpHome").onclick = open;
  panel.addEventListener("click", e => { if(e.target === panel) close(); });

  const chips = $("helpChips");
  for(const [q, a] of FAQ){
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = q;
    b.onclick = () => { bubble("me", q); bubble("bot", a); hist.push({role:"user",content:q},{role:"assistant",content:a}); };
    chips.append(b);
  }
  async function ask(){
    const q = $("helpIn").value.trim(); if(!q) return;
    $("helpIn").value = ""; bubble("me", q);
    if(!navigator.onLine){ bubble("bot", "Pas de connexion pour le moment. Voici les questions fréquentes ci-dessus, disponibles sans Internet."); return; }
    const wait = bubble("bot", "…");
    try{
      const screen = (document.querySelector(".screen.on") || {}).id || "home";
      const j = await api("/api/help", {method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({question:q, history:hist.slice(-6), screen})});
      wait.textContent = j.answer; hist.push({role:"user",content:q},{role:"assistant",content:j.answer});
    }catch(e){ wait.textContent = "⚠️ " + e.message; }
    msgs.scrollTop = msgs.scrollHeight;
  }
  $("helpSend").onclick = ask;
  $("helpIn").onkeydown = e => { if(e.key === "Enter") ask(); };
  document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });
})();
