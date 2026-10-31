// Génère VieScolairePro_presentation.pptx à partir des captures du dossier img/ (charte « Sapin et ambre »)
// Lancer : NODE_PATH=/tmp/pptbuild/node_modules node build_deck.js
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const fa = require("react-icons/fa");
const { applyTheme } = require("/root/.claude/skills/synced/09289e91-b1f6-4013-8237-93d9f78c2882_94326edf-fb05-4656-851f-c9508e0fb5a9/pptx/scripts/apply_theme.js");
const path = require("path");

const THEME = {
  name: "VieScolairePro",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A24", lt1: "FFFFFF", dk2: "3B6256", lt2: "F6F7F5",
    accent1: "B4571B", accent2: "5E7F72", accent3: "A9C2B4", accent4: "F2B36B", accent5: "C5456B", accent6: "1F86A8",
    hlink: "B4571B", folHlink: "5E7F72",
  },
};
const OUT = path.join(__dirname, "VieScolairePro_presentation.pptx");
const IMG = (n) => path.join(__dirname, "img", n + ".png");
const BORD = "DDE5E0", CADRE = "C9D3CD";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "VieScolairePro — présentation du produit";
pres.author = "VieScolairePro";
const C = pres.SchemeColor;
const SOMBRE = "335248"; // fond des diapositives de titre (vert sapin de l'application)

pres.defineSlideMaster({
  title: "TITRE", background: { color: SOMBRE },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.35, w: 4.4, h: 1.3, fontSize: 38, bold: true, color: C.background2, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 2.8, w: 4.2, h: 1.6, fontSize: 16, color: C.background2, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENU", background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: "VieScolairePro", options: { x: 0.5, y: 5.2, w: 3, h: 0.25, fontSize: 10, color: C.accent2, margin: 0, isTextBox: true } } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.25, fontSize: 10, color: C.accent2, align: "right" },
});
pres.defineSlideMaster({
  title: "FIN", background: { color: SOMBRE },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 0.9, w: 8.4, h: 1.0, fontSize: 38, bold: true, color: C.background2, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});

async function icone(Comp, hex) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
const dims = {};
async function dim(n) {
  if (!dims[n]) { const m = await sharp(IMG(n)).metadata(); dims[n] = m.width / m.height; }
  return dims[n];
}
async function capture(slide, n, x, y, maxW, maxH, nom, align = "left") {
  const r = await dim(n);
  let w = maxW, h = w / r;
  if (h > maxH) { h = maxH; w = h * r; }
  const px = align === "right" ? x + maxW - w : (align === "center" ? x + (maxW - w) / 2 : x);
  slide.addShape(pres.shapes.RECTANGLE, { x: px - 0.04, y: y - 0.04, w: w + 0.08, h: h + 0.08, fill: { color: "FFFFFF" }, line: { color: CADRE, width: 0.75 },
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.18 }, objectName: "Cadre " + nom });
  slide.addImage({ path: IMG(n), x: px, y, w, h, altText: nom });
  return { x: px, y, w, h };
}
const puces = (items) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6 } }));
function texte(slide, items, x, y, w, h, taille = 14) {
  slide.addText(puces(items), { x, y, w, h, fontSize: taille, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "Texte" });
}
function carte(slide, x, y, w, h, nom, remplissage = C.background2) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: remplissage }, line: { color: BORD, width: 0.75 }, objectName: nom });
}
function pastille(slide, ico, x, y, nom, couleur = C.text2) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.6, h: 0.6, fill: { color: couleur }, line: { type: "none" }, objectName: "Pastille " + nom });
  slide.addImage({ data: ico, x: x + 0.13, y: y + 0.13, w: 0.34, h: 0.34, altText: nom });
}

(async () => {
  const ico = {
    eleves: await icone(fa.FaUserGraduate, "FFFFFF"), perso: await icone(fa.FaUsers, "FFFFFF"), plan: await icone(fa.FaCalendarAlt, "FFFFFF"),
    docs: await icone(fa.FaFileAlt, "FFFFFF"), admin: await icone(fa.FaCog, "FFFFFF"), compte: await icone(fa.FaUserShield, "FFFFFF"),
    absent: await icone(fa.FaUserSlash, "FFFFFF"), remp: await icone(fa.FaExchangeAlt, "FFFFFF"), msg: await icone(fa.FaEnvelope, "FFFFFF"), cours: await icone(fa.FaChalkboardTeacher, "FFFFFF"),
    micro: await icone(fa.FaMicrophone, "FFFFFF"), texte: await icone(fa.FaAlignLeft, "FFFFFF"), ia: await icone(fa.FaMagic, "FFFFFF"), valide: await icone(fa.FaCheckCircle, "FFFFFF"),
    consent: await icone(fa.FaHandshake, "FFFFFF"), cadenas: await icone(fa.FaLock, "FFFFFF"), horloge: await icone(fa.FaClock, "FFFFFF"), gomme: await icone(fa.FaTrashAlt, "FFFFFF"), journal: await icone(fa.FaClipboardList, "FFFFFF"),
  };
  // Aide : diapositive « texte à gauche, capture à droite »
  async function standard(titre, items, img, alt, notes, o = {}) {
    const s = pres.addSlide({ masterName: "CONTENU" });
    s.addText(titre, { placeholder: "title" });
    texte(s, items, 0.5, 1.3, o.tw || 3.4, 3.7, o.taille || 14);
    await capture(s, img, o.x || 4.2, o.y || 1.2, o.w || 5.3, o.h || 3.8, alt, "right");
    s.addNotes(notes);
    return s;
  }

  // 1. Titre
  let s = pres.addSlide({ masterName: "TITRE" });
  s.addText("VieScolairePro", { placeholder: "title" });
  s.addText("Le logiciel de vie scolaire qui relie absences, remplacements, emplois du temps, notes, réunions et suivi des élèves.", { placeholder: "body" });
  s.addText("Présentation du produit", { x: 0.6, y: 0.6, w: 4, h: 0.3, fontSize: 12, color: C.accent4, margin: 0, isTextBox: true, objectName: "Surtitre" });
  await capture(s, "accueil", 5.15, 0.55, 4.4, 4.5, "Tableau de bord de VieScolairePro", "right");
  s.addNotes("Bienvenue. VieScolairePro est une application web de gestion de la vie scolaire : elle remplace les tableurs, les papiers et les messages dispersés par un seul outil dont les pages communiquent entre elles. La démonstration en ligne est indiquée en dernière diapositive.");

  // 2. Tout est relié
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Un seul outil, des pages qui communiquent", { placeholder: "title" });
  const etapes = [
    ["Absence déclarée", "Motif choisi dans une liste ou saisi librement", ico.absent],
    ["Cours à remplacer", "Créés automatiquement pour chaque cours concerné", ico.cours],
    ["Remplaçants proposés", "Professeurs libres, même matière d'abord", ico.remp],
    ["Équipe prévenue", "Message automatique aux remplaçants", ico.msg],
  ];
  const w4 = 2.0, g4 = 0.33;
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * (w4 + g4);
    carte(s, x, 1.5, w4, 2.35, "Carte " + (i + 1));
    pastille(s, etapes[i][2], x + 0.7, 1.7, etapes[i][0]);
    s.addText(etapes[i][0], { x: x + 0.1, y: 2.45, w: w4 - 0.2, h: 0.4, fontSize: 16, bold: true, color: C.text1, align: "center", margin: 0, isTextBox: true });
    s.addText(etapes[i][1], { x: x + 0.12, y: 2.9, w: w4 - 0.24, h: 0.85, fontSize: 13, color: C.text2, align: "center", valign: "top", margin: 0, isTextBox: true });
    if (i < 3) s.addText("→", { x: x + w4, y: 2.35, w: g4, h: 0.5, fontSize: 24, bold: true, color: C.accent1, align: "center", margin: 0, isTextBox: true, objectName: "Flèche " + (i + 1) });
  }
  s.addText("Le même enchaînement alimente « Cours perturbés », les rapports, le comptage des heures et l'historique.", { x: 0.5, y: 4.2, w: 9, h: 0.5, fontSize: 16, color: C.text1, margin: 0, isTextBox: true });
  s.addNotes("Le point fort du produit : une action dans une page se répercute dans les autres. Une absence crée les cours à remplacer, propose des remplaçants libres, prévient les professeurs par message et alimente l'analyse des cours perturbés.");

  // 3. Six rubriques
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Six rubriques, une logique", { placeholder: "title" });
  const rub = [
    [ico.eleves, "1. Élèves et vie scolaire", "Élèves, groupes, notes et bulletins, assiduité, remplacements, incidents, infirmerie"],
    [ico.perso, "2. Personnel", "Professeurs, personnel de vie scolaire, emplois du temps, planning, comptage des heures"],
    [ico.plan, "3. Planification et suivi", "Matières et heures par niveau, génération des emplois du temps, tâches, rapports"],
    [ico.docs, "4. Documents et réunions", "Réunions et comptes rendus, rédaction assistée, bibliothèque de documents"],
    [ico.admin, "5. Administration", "Utilisateurs, périodes, établissements, sauvegarde, sécurité, RGPD"],
    [ico.compte, "6. Mon compte", "Mot de passe, double authentification, déconnexion"],
  ];
  const cw = 2.85, cg = 0.225;
  rub.forEach((r, i) => {
    const x = 0.5 + (i % 3) * (cw + cg), y = 1.3 + Math.floor(i / 3) * 1.95;
    carte(s, x, y, cw, 1.75, "Rubrique " + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.18, y: y + 0.18, w: 0.5, h: 0.5, fill: { color: C.text2 }, line: { type: "none" }, objectName: "Pastille rubrique " + (i + 1) });
    s.addImage({ data: r[0], x: x + 0.29, y: y + 0.29, w: 0.28, h: 0.28, altText: r[1] });
    s.addText(r[1], { x: x + 0.8, y: y + 0.18, w: cw - 0.95, h: 0.5, fontSize: 15, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
    s.addText(r[2], { x: x + 0.18, y: y + 0.8, w: cw - 0.36, h: 0.85, fontSize: 12, color: C.text2, valign: "top", margin: 0, isTextBox: true });
  });
  s.addNotes("Le menu de gauche suit exactement ces six rubriques, avec une icône cohérente et des compteurs. Chaque rôle (direction, CPE, enseignant, infirmière…) ne voit que ce qui le concerne.");

  // 4. Tableau de bord
  await standard("Un tableau de bord coloré qui indique quoi faire",
    ["Huit tuiles : élèves, professeurs, absents, remplacements, incidents, messages, tâches", "Graphiques animés : assiduité de la semaine, élèves par niveau, remplacements, régimes, incidents", "Alertes du jour et accès rapide à chaque rubrique", "Menu latéral repliable, adapté au rôle"],
    "accueil", "Tableau de bord avec tuiles colorées et graphiques", "Le tableau de bord réunit les chiffres du jour dans huit tuiles cliquables, six graphiques qui s'animent au survol, les alertes (remplacements dans les 48 h, tâches en retard) et les accès par rubrique.", { w: 4.0, h: 4.0 });

  // 5. Élèves
  await standard("Fiches élèves complètes et filtres",
    ["Adresse, code postal, ville, téléphone, régime (externe, demi-pensionnaire, pensionnaire)", "Une couleur par niveau, filtres par niveau, classe, régime et groupe", "Exports Excel ou ZIP par niveau, classe ou groupe, avec choix des colonnes", "Import CSV avec mise à jour des fiches existantes"],
    "eleves", "Liste des élèves avec couleurs par niveau et filtres", "La liste des élèves se filtre et s'exporte par niveau, classe, groupe ou régime. Les colonnes exportées se choisissent. L'import CSV peut mettre à jour des fiches existantes.");

  // 6. Saisie rapide
  await standard("Compléter les fiches comme dans un tableur",
    ["Un tableau par classe : date de naissance, sexe, adresse, téléphone, e-mail", "Modification de plusieurs élèves en une seule fois", "Gain de temps à la rentrée", "Données reprises partout : fiches, exports, documents"],
    "eleves_completer", "Saisie rapide des fiches élèves d'une classe", "La saisie rapide permet de compléter une classe entière dans un tableau ressemblant à un tableur, au lieu d'ouvrir chaque fiche.");

  // 7. Classes et groupes
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Classes et groupes d'élèves, repérés par la couleur", { placeholder: "title" });
  texte(s, ["Cartes de classes colorées par niveau, renommables et supprimables", "Nombre de classes par niveau réglable", "Groupes libres (LV2, atelier, aide aux devoirs…) avec une couleur chacun", "Étiquettes colorées dans la liste des élèves"], 0.5, 1.3, 3.4, 3.7);
  await capture(s, "classes", 4.2, 1.2, 5.3, 2.45, "Classes et niveaux en cartes colorées", "right");
  await capture(s, "groupes", 4.2, 3.8, 5.3, 1.3, "Groupes d'élèves colorés", "right");
  s.addNotes("Chaque niveau a sa couleur ; chaque groupe reçoit automatiquement une couleur différente, modifiable. Les couleurs aident à repérer d'un coup d'œil.");

  // 8. Absences
  await standard("Absences et indisponibilités des professeurs",
    ["Déclaration en quelques clics : professeur, dates, motif", "Motif choisi dans une liste, avec saisie libre", "Les cours à remplacer sont créés automatiquement", "États jour, semaine et mois imprimables"],
    "absences", "Liste des absences et indisponibilités", "Motifs d'absence proposés dans une liste avec saisie libre. Une indisponibilité (sortie scolaire, par exemple) n'entraîne pas de remplacement ; une absence crée un remplacement par cours concerné.");

  // 9. Remplacements
  await standard("Remplacements : le bon professeur, au bon créneau",
    ["Professeurs libres proposés, même matière d'abord", "Conflit signalé et refusé, sauf décision explicite", "Pourvoi automatique en un clic, remplaçants prévenus", "Suivi : pourvus, à pourvoir, annulés"],
    "remplacements", "Organisation des remplacements", "Pour chaque cours, les professeurs libres sont proposés (même matière d'abord, puis le moins sollicité). Un menu permet aussi de choisir un autre professeur avec sa disponibilité.");

  // 10. Assiduité : appel
  await standard("Assiduité des élèves : l'appel en quelques clics",
    ["Appel par créneau de cours ou par demi-journée", "Présent, absent, retard, en un clic", "Un enseignant ne fait l'appel que de ses classes", "Justifications en lot : justifiée, non justifiée, en attente"],
    "appel", "Écran d'appel d'une classe", "L'appel peut être fait par les enseignants ou par la vie scolaire. Les absences et retards alimentent la fiche de l'élève, les états et le tableau de bord.");

  // 11. États d'assiduité
  await standard("États des absences : jour, semaine, mois",
    ["État journalier, hebdomadaire et mensuel", "Taux d'absentéisme par classe et par élève", "Même état pour les absences des professeurs", "Impression et export Excel"],
    "etat_assiduite", "État journalier des absences des élèves", "Les états se choisissent par jour, semaine ou mois, pour les élèves comme pour les professeurs, avec impression et export Excel.");

  // 12. Notes et bulletins
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Notes, relevés et bulletins", { placeholder: "title" });
  texte(s, ["Les professeurs saisissent les notes de leurs classes", "La vie scolaire voit toutes les notes d'un élève", "Moyennes, rang, appréciations", "Relevé de notes, relevé à mi-parcours et bulletin imprimables, par élève ou par classe"], 0.5, 1.3, 3.4, 3.7);
  await capture(s, "notes", 4.2, 1.2, 3.0, 3.8, "Saisie des notes", "left");
  await capture(s, "bulletin", 7.3, 1.2, 2.2, 3.8, "Bulletin d'un élève", "right");
  s.addNotes("Un parent convoqué : le CPE a tout sous la main, il peut imprimer le relevé de notes ou le bulletin. Un relevé à mi-parcours est aussi possible, sans attendre la fin du trimestre.");

  // 13. EDT
  await standard("Emplois du temps lisibles",
    ["Vues jour, semaine et mois, par professeur ou par classe", "Une couleur par matière, légende affichée", "États visibles : remplacé, à pourvoir, annulé", "Impression PDF en un clic"],
    "edt", "Emploi du temps de la classe 3A en semaine", "L'emploi du temps affiche l'état réel des cours de la semaine : les cours remplacés indiquent le remplaçant, les cours sans professeur disponible sont signalés.", { h: 3.7 });

  // 14. Matières et heures
  await standard("Matières et heures par niveau",
    ["On ajoute une matière et ses heures pour chaque niveau", "Les besoins de toutes les classes sont déduits", "Choix d'un professeur par classe possible", "Affectation selon la matière, la charge et les vœux"],
    "volumes", "Matières et heures par niveau", "Cette page remplace la saisie classe par classe : les heures de chaque matière par niveau suffisent. Les professeurs sont répartis selon leur matière, leur service dû et leurs vœux.");

  // 15. Proposition
  await standard("Génération automatique, trous mis en évidence",
    ["Proposition sans conflit, relue avant application", "Séances placées, souhaits respectés, trous comptés", "Les trous s'affichent en rouge dans la grille", "Liste des trous par professeur et par classe"],
    "proposition", "Proposition d'emploi du temps avec indicateurs", "Le moteur place les séances sans conflit, respecte les indisponibilités, minimise les souhaits non respectés et les trous. Les trous sont affichés dans la grille et listés par professeur et par classe.", { h: 3.9 });

  // 16. Planning personnel
  await standard("Planning du personnel de vie scolaire",
    ["Postes colorés : service, étude, foyer, cour, portail, self…", "Génération automatique selon rôles, contrats et indisponibilités", "Solde hebdomadaire de chaque agent", "Modification, copie vers d'autres jours, annulation"],
    "planning_personnel", "Planning du personnel en grille", "Chaque assistant a des rôles (postes). Le moteur répartit les agents sur les besoins par plage horaire ; un clic sur une plage permet de la modifier, la supprimer ou la copier.");

  // 17. Heures
  await standard("Comptage des heures",
    ["Heures de chaque professeur, avec service dû et écart", "Heures remplacées et effectuées en remplacement", "Heures par classe, détail par matière", "Export Excel et impression"],
    "heures", "Comptage des heures des professeurs", "Trois vues : professeurs, classes et personnel de vie scolaire. Le service dû de chaque professeur se saisit directement dans le tableau.");

  // 18. Trombinoscope
  await standard("Trombinoscope",
    ["Élèves par classe avec le professeur principal", "Professeurs et personnel de vie scolaire", "Recherche instantanée et tri", "Photos réduites automatiquement, initiales par défaut"],
    "trombinoscope", "Trombinoscope d'une classe", "Le trombinoscope est visible par les enseignants et la vie scolaire ; seule la vie scolaire ajoute les photos. Penser à l'autorisation de droit à l'image des familles.");

  // 19. Pyramide
  await standard("Pyramide des âges, filles et garçons",
    ["Tuiles : total, garçons, filles, âge moyen, âge le plus fréquent", "Barres avec effectifs, détail au survol", "Répartition filles-garçons et faits marquants", "Filtre par niveau ou classe, export Excel"],
    "pyramide", "Pyramide des âges et des sexes", "Les chiffres comptent les élèves dont la date de naissance et le sexe sont renseignés ; un message indique combien ne sont pas comptés.", { h: 3.9 });

  // 20. Infirmerie
  await standard("Infirmerie et santé",
    ["Planning des soins relié aux emplois du temps", "Professeur prévenu sans information médicale", "Passages à l'infirmerie et fiches santé", "Accès réservé aux personnes habilitées, consultations journalisées"],
    "infirmerie", "Planning des soins de l'infirmerie", "Quand un soin tombe pendant un cours, l'application l'indique et permet de prévenir le professeur par un message automatique qui ne contient aucune information médicale.");

  // 21. Rédaction
  await standard("Documents rédigés automatiquement",
    ["Un incident devient un rapport pré-rempli en un clic", "Élève, classe, professeur principal, faits repris", "Modèles modifiables, texte libre", "Impression PDF et export Word"],
    "document_nouveau", "Rédaction assistée d'un document", "Depuis la page Incidents, le bouton Rédiger le document ouvre le formulaire pré-rempli. Le texte du modèle se construit seul et reste modifiable.");

  // 22. En-tête
  await standard("En-tête et signataires communs",
    ["Ligne officielle, nom, adresse, logo et pied de page", "Signataires choisis document par document", "« Fait à … le … » et cases de signature", "Réglé une seule fois par établissement"],
    "entete", "Réglage de l'en-tête et des signataires", "L'en-tête et les signataires se règlent une seule fois et s'appliquent à l'écran, à l'impression PDF et à l'export Word.");

  // 23. Bibliothèque
  await standard("Bibliothèque de documents classée",
    ["Tous les documents rédigés, archivés avec leur date", "Classement par date, niveau, classe, élève ou type", "Recherche et filtres par période", "Fichiers partagés (PDF, Word, Excel)"],
    "documents", "Bibliothèque de documents avec filtres", "Tout document rédigé est archivé. On le retrouve par date, niveau, classe, élève ou type, et dans la fiche de l'élève concerné.");

  // 24. Réunions : un point d'entrée
  await standard("Réunions : un seul point d'entrée",
    ["Trois façons de créer : convoquer, convoquer et enregistrer, rédiger un compte rendu", "Liste unique avec onglets À venir, Passées, Comptes rendus", "État de chaque réunion : convoquée, enregistrée, transcrite, validée", "Recherche d'une personne sans quitter la page, brouillon mémorisé"],
    "reunions", "Liste des réunions et création", "Une seule création de réunion. Selon le besoin : convocation seule, convocation avec enregistrement et compte rendu IA, ou compte rendu seul pour une réunion déjà tenue.", { h: 3.9 });

  // 25. Réunions intelligentes : les 4 étapes
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Réunions : de la parole au compte rendu", { placeholder: "title" });
  const ri = [
    ["1. Consentement", "Participants cochés dans l'annuaire, accord de chacun", ico.consent],
    ["2. Enregistrement", "Micro de l'ordinateur ou du téléphone, pause, reprise", ico.micro],
    ["3. Transcription", "Texte corrigeable, hors-sujet repéré en rouge", ico.texte],
    ["4. Compte rendu", "Brouillon IA relu, corrigé, puis validé", ico.valide],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * (w4 + g4);
    carte(s, x, 1.5, w4, 2.35, "Étape " + (i + 1));
    pastille(s, ri[i][2], x + 0.7, 1.7, ri[i][0], C.accent1);
    s.addText(ri[i][0], { x: x + 0.1, y: 2.45, w: w4 - 0.2, h: 0.4, fontSize: 16, bold: true, color: C.text1, align: "center", margin: 0, isTextBox: true });
    s.addText(ri[i][1], { x: x + 0.12, y: 2.9, w: w4 - 0.24, h: 0.85, fontSize: 13, color: C.text2, align: "center", valign: "top", margin: 0, isTextBox: true });
    if (i < 3) s.addText("→", { x: x + w4, y: 2.35, w: g4, h: 0.5, fontSize: 24, bold: true, color: C.accent1, align: "center", margin: 0, isTextBox: true, objectName: "Flèche " + (i + 1) });
  }
  s.addText("L'IA propose, le responsable relit et valide : elle n'invente ni décision ni responsable, et signale ce qui manque.", { x: 0.5, y: 4.2, w: 9, h: 0.6, fontSize: 16, color: C.text1, margin: 0, isTextBox: true });
  s.addNotes("Le chef d'établissement prépare la réunion, obtient le consentement, lance l'enregistrement puis laisse faire. Après la réunion, la transcription est corrigée, un compte rendu structuré est proposé, relu et validé. L'IA ne remplace pas le responsable.");

  // 26. Préparation et consentement
  await standard("Préparation et consentement des participants",
    ["Participants cochés dans l'annuaire : professeurs, direction, personnel", "Texte d'information à lire avant de commencer", "Consentement de chaque participant et attestation du responsable", "Sans consentement, l'enregistrement est bloqué"],
    "ri_preparation", "Préparation d'une réunion et consentements", "Le logiciel fournit le texte à lire aux participants. Chaque participant doit être coché et le responsable atteste l'information. Sans cela, l'enregistrement ne démarre pas, y compris côté serveur.", { h: 3.9 });

  // 27. Enregistrement
  await standard("Enregistrement : chronomètre, micro, pause",
    ["Démarrer, pause, reprise, arrêt", "Chronomètre, voyant et niveau sonore du micro", "Sauvegarde toutes les 5 secondes : rien n'est perdu en cas de coupure", "Messages clairs : micro refusé, absent, connexion perdue"],
    "ri_enregistrement", "Enregistrement d'une réunion en cours", "L'audio est envoyé par morceaux pendant la réunion. Si la page se ferme ou si la connexion saute, ce qui a été reçu est conservé et l'on reprend dans une nouvelle partie.", { h: 2.4, y: 1.6 });

  // 28. Transcription et hors-sujet
  await standard("Hors-sujet repéré en rouge, supprimé en un clic",
    ["Transcription automatique en français, arabe et autres langues", "Texte entièrement corrigeable", "L'IA repère les passages étrangers au sujet : ils passent en rouge", "On décoche ce qu'on garde, on supprime le reste"],
    "ri_hors_sujet", "Passages hors sujet en rouge dans la transcription", "Le titre et l'ordre du jour servent de référence. L'IA ne signale que ce qui est clairement hors sujet ; le responsable vérifie avant de supprimer. Les phrases parasites inventées sur les silences sont supprimées automatiquement.", { h: 2.8, y: 1.5 });

  // 29. Compte rendu
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Compte rendu structuré, en cinq formats", { placeholder: "title" });
  texte(s, ["Objet, participants, points abordés, décisions, actions avec responsable et échéance, conclusion", "Informations manquantes signalées", "Compte rendu détaillé, résumé d'une page, décisions, tableau des actions, procès-verbal", "Impression PDF, Word, partage par la messagerie"], 0.5, 1.3, 3.5, 3.7, 13);
  await capture(s, "ri_detaille", 4.2, 1.15, 3.3, 3.95, "Compte rendu détaillé validé", "left");
  await capture(s, "ri_actions", 7.6, 1.15, 1.9, 1.4, "Tableau des actions", "right");
  s.addNotes("Le compte rendu est rédigé en langage administratif à partir de la transcription. Il ne contient que ce qui a été dit ; l'IA écrit « Non précisé » quand un responsable ou une échéance n'est pas mentionné. Il est relu, corrigé et validé par le responsable avant impression ou partage.");

  // 30. RGPD
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Confidentialité et conformité", { placeholder: "title" });
  const rg = [
    [ico.consent, "Consentement", "Chaque participant informé et coché avant tout enregistrement"],
    [ico.cadenas, "Accès restreint", "Chef d'établissement, direction, CPE ; consultations journalisées"],
    [ico.horloge, "Conservation limitée", "Audio supprimé après 30 jours, réunion après 3 ans (réglable)"],
    [ico.gomme, "Suppression", "À tout moment : audio seul ou réunion entière"],
    [ico.journal, "Journal d'audit", "Chaque action sensible est tracée"],
    [ico.ia, "IA sous contrôle", "Brouillon relu et validé ; aucune clé, aucun envoi"],
  ];
  rg.forEach((r, i) => {
    const x = 0.5 + (i % 3) * (cw + cg), y = 1.3 + Math.floor(i / 3) * 1.95;
    carte(s, x, y, cw, 1.75, "Garantie " + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.18, y: y + 0.18, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "Pastille garantie " + (i + 1) });
    s.addImage({ data: r[0], x: x + 0.29, y: y + 0.29, w: 0.28, h: 0.28, altText: r[1] });
    s.addText(r[1], { x: x + 0.8, y: y + 0.18, w: cw - 0.95, h: 0.5, fontSize: 15, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
    s.addText(r[2], { x: x + 0.18, y: y + 0.8, w: cw - 0.36, h: 0.85, fontSize: 12, color: C.text2, valign: "top", margin: 0, isTextBox: true });
  });
  s.addNotes("Le module respecte le RGPD : information et consentement, accès limité, durée de conservation configurable, suppression possible, journalisation. Les services de transcription et de rédaction sont des services externes : leur utilisation est facultative et exige une clé ; sans clé, rien n'est envoyé.");

  // 31. Établissements et sécurité
  await standard("Plusieurs établissements, des données cloisonnées",
    ["Collège, lycée ou groupe scolaire dans une même application", "Chaque établissement a ses propres données et réglages", "L'administrateur ajoute, renomme ou supprime un établissement", "Rôles : administrateur, direction, CPE, enseignant, infirmier", "Double authentification, journal d'audit, RGPD, sauvegarde"],
    "etablissements", "Gestion des établissements par l'administrateur", "Les données sont séparées par établissement : un compte rattaché à un seul établissement ne peut ni lire ni modifier les données d'un autre. La suppression d'un établissement est protégée par confirmation du nom et du mot de passe.", { tw: 3.5, h: 3.4, y: 1.35 });

  // 32. Charte graphique
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Une charte graphique sobre et accessible", { placeholder: "title" });
  const sw = [["Sapin", "3B6256", "FFFFFF"], ["Ambre", "B4571B", "FFFFFF"], ["Fond clair", "F6F7F5", "1F2A24"], ["Encre", "1F2A24", "FFFFFF"], ["Sauge", "A9C2B4", "1F2A24"]];
  sw.forEach((c, i) => {
    const x = 0.5 + i * 1.78;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.3, w: 1.6, h: 1.1, rectRadius: 0.08, fill: { color: c[1] }, line: { color: CADRE, width: 0.75 }, objectName: "Couleur " + c[0] });
    s.addText(c[0], { x, y: 1.3, w: 1.6, h: 0.7, fontSize: 14, bold: true, color: c[2], align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText("#" + c[1], { x, y: 1.9, w: 1.6, h: 0.4, fontSize: 11, color: c[2], align: "center", valign: "top", margin: 0, isTextBox: true });
  });
  texte(s, ["Palette « Sapin et ambre » : vert sapin, fond clair neutre, accent orange brûlé", "Contrastes vérifiés (au moins 4,5 : 1) et mode sombre", "Liens soulignés, champs étiquetés, navigation au clavier", "Une couleur par niveau, par groupe et par matière pour repérer d'un coup d'œil", "Palette modifiable par client (nom, couleur, logo)"], 0.5, 2.75, 9, 2.3, 15);
  s.addNotes("Après comparaison de plusieurs palettes, la palette Sapin et ambre a été retenue pour son sérieux et sa lisibilité. Elle est contrôlée avec un outil d'accessibilité automatique et se décline par client.");

  // 33. Mobile et évolutif
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Sur téléphone et adaptable à chaque client", { placeholder: "title" });
  texte(s, ["Affichage adapté au téléphone, installable sur l'écran d'accueil", "Enregistrement des réunions depuis le téléphone", "Modules activables ou désactivables par client", "Configuration par client : nom, couleur, logo, règles", "Évolutions de base de données versionnées"], 0.5, 1.3, 4.3, 3.7);
  const pw = 1.55, ph = pw * 1992 / 1170;
  const cap = async (n, x) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.05, y: 1.2, w: pw + 0.1, h: ph + 0.1, rectRadius: 0.1, fill: { color: "1F2A24" }, line: { type: "none" }, shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.2 }, objectName: "Téléphone " + n });
    s.addImage({ path: IMG(n), x, y: 1.25, w: pw, h: ph, altText: "Capture sur téléphone" });
  };
  await cap("mobile_accueil", 5.35); await cap("mobile_menu", 7.3);
  s.addNotes("L'interface s'adapte aux petits écrans avec un bouton Menu. Pour chaque client, un fichier de configuration règle le nom, la couleur, le logo, les modules actifs et les règles propres à l'établissement.");

  // 34. État actuel
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Aujourd'hui et prochaines évolutions", { placeholder: "title" });
  carte(s, 0.5, 1.25, 4.4, 3.6, "Carte disponible");
  s.addText("Disponible aujourd'hui", { x: 0.7, y: 1.4, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addText(puces(["Absences, remplacements, assiduité, notes et bulletins", "Emplois du temps et génération automatique", "Personnel de vie scolaire et comptage des heures", "Élèves, groupes, trombinoscope, infirmerie, documents", "Réunions : convocations, enregistrement, compte rendu", "Établissements, rôles, sécurité, RGPD"]),
    { x: 0.7, y: 1.9, w: 4.0, h: 2.9, fontSize: 13, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 1.25, w: 4.4, h: 3.6, rectRadius: 0.08, fill: { color: "FFFFFF" }, line: { color: C.accent1, width: 1.25 }, objectName: "Carte à venir" });
  s.addText("À définir selon vos demandes", { x: 5.3, y: 1.4, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addText(puces(["Envoi d'e-mails et notifications (aujourd'hui : messages internes)", "Reconnaissance des voix pour attribuer les interventions", "Semaines A/B et samedi dans les emplois du temps", "API pour des intégrations tierces", "Exports PDF et Excel générés côté serveur"]),
    { x: 5.3, y: 1.9, w: 4.0, h: 2.9, fontSize: 13, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  s.addNotes("Transparence sur le périmètre. Pour de vraies données : hébergement avec disque persistant, démonstration désactivée, clés des services d'IA à configurer pour les réunions intelligentes, sauvegarde régulière.");

  // 35. Fin
  s = pres.addSlide({ masterName: "FIN" });
  s.addText("Essayez la démonstration", { placeholder: "title" });
  s.addText("viescolaire-pro.onrender.com", { x: 0.8, y: 2.1, w: 8.4, h: 0.6, fontSize: 28, bold: true, color: C.accent4, margin: 0, isTextBox: true, objectName: "Adresse de la démo" });
  s.addText(puces(["CPE : cpe@demo.fr — direction : direction@demo.fr", "Administrateur (établissements) : admin@demo.fr", "Enseignant : prof1@demo.fr — infirmière : infirmerie@demo.fr", "Mot de passe de démonstration : demo1234"]),
    { x: 0.8, y: 3.0, w: 8.4, h: 1.7, fontSize: 16, color: C.background2, valign: "top", margin: 0, isTextBox: true, objectName: "Comptes de démonstration" });
  s.addNotes("Les comptes de démonstration sont partagés et les données fictives. Les données saisies sur la démo sont réinitialisées à chaque mise à jour du site.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("OK", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
