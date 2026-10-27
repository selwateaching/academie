// Génère VieScolairePro_presentation.pptx à partir des captures du dossier img/
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
    dk1: "26211E", lt1: "FFFFFF", dk2: "4E5443", lt2: "F4EBD7",
    accent1: "D3803C", accent2: "777F67", accent3: "B0B18C", accent4: "EDC59D", accent5: "A8432A", accent6: "5B7A9A",
    hlink: "D3803C", folHlink: "777F67",
  },
};
const OUT = path.join(__dirname, "VieScolairePro_presentation.pptx");
const IMG = (n) => path.join(__dirname, "img", n + ".png");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "VieScolairePro — présentation du produit";
pres.author = "VieScolairePro";
const C = pres.SchemeColor;
const SOMBRE = "4E5443"; // fond des diapositives de titre (vert-gris de l'application)

// ---- Layouts
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

// ---- Aides
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
// Image dans une boîte maxW x maxH, ancrée en (x, y) ; cadre blanc avec ombre
async function capture(slide, n, x, y, maxW, maxH, nom, align = "left") {
  const r = await dim(n);
  let w = maxW, h = w / r;
  if (h > maxH) { h = maxH; w = h * r; }
  const px = align === "right" ? x + maxW - w : (align === "center" ? x + (maxW - w) / 2 : x);
  slide.addShape(pres.shapes.RECTANGLE, { x: px - 0.04, y: y - 0.04, w: w + 0.08, h: h + 0.08, fill: { color: "FFFFFF" }, line: { color: "D8D2C4", width: 0.75 },
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.18 }, objectName: "Cadre " + nom });
  slide.addImage({ path: IMG(n), x: px, y, w, h, altText: nom });
  return { x: px, y, w, h };
}
const puces = (items) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6 } }));
function texte(slide, items, x, y, w, h) {
  slide.addText(puces(items), { x, y, w, h, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "Texte" });
}
function legende(slide, t, x, y, w) {
  slide.addText(t, { x, y, w, h: 0.3, fontSize: 11, color: C.accent2, margin: 0, align: "left", isTextBox: true, objectName: "Légende" });
}

(async () => {
  const ico = {
    eleves: await icone(fa.FaUserGraduate, "FFFFFF"), perso: await icone(fa.FaUsers, "FFFFFF"), plan: await icone(fa.FaCalendarAlt, "FFFFFF"),
    docs: await icone(fa.FaFileAlt, "FFFFFF"), admin: await icone(fa.FaCog, "FFFFFF"), compte: await icone(fa.FaUserShield, "FFFFFF"),
    absent: await icone(fa.FaUserSlash, "FFFFFF"), remp: await icone(fa.FaExchangeAlt, "FFFFFF"), msg: await icone(fa.FaEnvelope, "FFFFFF"), cours: await icone(fa.FaChalkboardTeacher, "FFFFFF"),
    ok: await icone(fa.FaCheckCircle, "D3803C"),
  };

  // 1. Titre
  let s = pres.addSlide({ masterName: "TITRE" });
  s.addText("VieScolairePro", { placeholder: "title" });
  s.addText("Le logiciel de vie scolaire qui relie absences, remplacements, emplois du temps, personnel et suivi des élèves.", { placeholder: "body" });
  s.addText("Présentation du produit", { x: 0.6, y: 0.6, w: 4, h: 0.3, fontSize: 12, color: C.accent4, margin: 0, isTextBox: true, objectName: "Surtitre" });
  await capture(s, "accueil", 5.15, 0.95, 4.4, 3.7, "Page d'accueil de VieScolairePro", "right");
  s.addNotes("Bienvenue. VieScolairePro est une application web de gestion de la vie scolaire : elle remplace les tableurs, les papiers et les messages dispersés par un seul outil dont les pages communiquent entre elles. La démonstration en ligne est disponible à l'adresse indiquée en dernière diapositive.");

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
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: w4, h: 2.35, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: "E6DCC3", width: 0.75 }, objectName: "Carte " + (i + 1) });
    s.addShape(pres.shapes.OVAL, { x: x + 0.7, y: 1.7, w: 0.6, h: 0.6, fill: { color: C.text2 }, line: { type: "none" }, objectName: "Pastille " + (i + 1) });
    s.addImage({ data: etapes[i][2], x: x + 0.83, y: 1.83, w: 0.34, h: 0.34, altText: etapes[i][0] });
    s.addText(etapes[i][0], { x: x + 0.1, y: 2.45, w: w4 - 0.2, h: 0.4, fontSize: 16, bold: true, color: C.text1, align: "center", margin: 0, isTextBox: true });
    s.addText(etapes[i][1], { x: x + 0.12, y: 2.9, w: w4 - 0.24, h: 0.85, fontSize: 13, color: C.text2, align: "center", valign: "top", margin: 0, isTextBox: true });
    if (i < 3) s.addText("→", { x: x + w4, y: 2.35, w: g4, h: 0.5, fontSize: 24, bold: true, color: C.accent1, align: "center", margin: 0, isTextBox: true, objectName: "Flèche " + (i + 1) });
  }
  s.addText("Le même enchaînement alimente « Cours perturbés », les rapports, le comptage des heures et l'historique.", { x: 0.5, y: 4.2, w: 9, h: 0.5, fontSize: 16, color: C.text1, margin: 0, isTextBox: true });
  s.addNotes("Le point fort du produit : une action dans une page se répercute dans les autres. Une absence crée les cours à remplacer, propose des remplaçants libres, prévient les professeurs par message et alimente l'analyse des cours perturbés.");

  // 3. Les six rubriques
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Six rubriques, une logique", { placeholder: "title" });
  const rub = [
    [ico.eleves, "1. Élèves et vie scolaire", "Élèves, classes, trombinoscope, absences, remplacements, incidents, infirmerie, messagerie"],
    [ico.perso, "2. Personnel", "Professeurs, assistants de vie scolaire, emplois du temps, planning, comptage des heures"],
    [ico.plan, "3. Planification et suivi", "Génération des emplois du temps, tâches, rapports, assistant, import, historique"],
    [ico.docs, "4. Documents et réunions", "Réunions, rédaction assistée, modèles, en-tête et signataires"],
    [ico.admin, "5. Administration", "Utilisateurs, établissements, sauvegarde, sécurité, RGPD"],
    [ico.compte, "6. Mon compte", "Mot de passe, double authentification, déconnexion"],
  ];
  const cw = 2.85, cg = 0.225;
  rub.forEach((r, i) => {
    const x = 0.5 + (i % 3) * (cw + cg), y = 1.3 + Math.floor(i / 3) * 1.95;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: 1.75, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: "E6DCC3", width: 0.75 }, objectName: "Rubrique " + (i + 1) });
    s.addShape(pres.shapes.OVAL, { x: x + 0.18, y: y + 0.18, w: 0.5, h: 0.5, fill: { color: C.text2 }, line: { type: "none" }, objectName: "Pastille rubrique " + (i + 1) });
    s.addImage({ data: r[0], x: x + 0.29, y: y + 0.29, w: 0.28, h: 0.28, altText: r[1] });
    s.addText(r[1], { x: x + 0.8, y: y + 0.18, w: cw - 0.95, h: 0.5, fontSize: 15, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
    s.addText(r[2], { x: x + 0.18, y: y + 0.8, w: cw - 0.36, h: 0.85, fontSize: 12, color: C.text2, valign: "top", margin: 0, isTextBox: true });
  });
  s.addNotes("Le menu de gauche suit exactement ces six rubriques. Chaque rôle (direction, CPE, enseignant, infirmière…) ne voit que ce qui le concerne.");

  // 4. Tableau de bord
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Un tableau de bord qui indique quoi faire", { placeholder: "title" });
  texte(s, ["Alertes du jour : remplacements à pourvoir, tâches en retard, incidents en attente", "Compteurs en direct sur chaque rubrique", "Accès rapide à toutes les pages par rubrique", "Menu latéral repliable, adapté au rôle"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "accueil", 4.2, 1.2, 5.3, 3.8, "Tableau de bord avec alertes et accès par rubrique", "right");
  s.addNotes("La page d'accueil réunit les alertes (remplacements à pourvoir dans les 48 h, tâches en retard) et les accès directs par rubrique, avec des compteurs : absences du jour, remplacements à pourvoir, incidents ouverts, messages non lus.");

  // 5. Absences
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Absences et indisponibilités", { placeholder: "title" });
  texte(s, ["Déclaration en quelques clics : professeur, dates, motif", "Motif choisi dans une liste, avec saisie libre", "Les cours à remplacer sont créés automatiquement", "Suivi : pourvus, à pourvoir, annulés"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "absences", 4.2, 1.2, 5.3, 3.8, "Liste des absences et indisponibilités", "right");
  s.addNotes("Motifs d'absence proposés dans une liste avec saisie libre. Une indisponibilité (sortie scolaire, par exemple) n'entraîne pas de remplacement ; une absence crée un remplacement par cours concerné.");

  // 5 bis. Remplacements
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Remplacements : le bon professeur, au bon créneau", { placeholder: "title" });
  texte(s, ["Professeurs libres proposés, même matière d'abord", "Date, créneau et semaine affichés pour chaque cours", "Conflit signalé et refusé, sauf décision explicite", "Pourvoi automatique en un clic, remplaçants prévenus"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "remplacements", 4.2, 1.2, 5.3, 3.8, "Organisation des remplacements", "right");
  s.addNotes("Pour chaque cours, les professeurs libres sont proposés (même matière d'abord, puis le moins sollicité). Un menu permet aussi de choisir un autre professeur avec sa disponibilité : libre, en cours, absent ou déjà en remplacement.");

  // 6. Emplois du temps
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Emplois du temps lisibles", { placeholder: "title" });
  texte(s, ["Vues jour, semaine et mois, par professeur ou par classe", "Une couleur par matière, légende affichée", "États visibles : remplacé, à pourvoir, annulé", "Impression PDF en un clic"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "edt", 4.2, 1.2, 5.3, 3.7, "Emploi du temps de la classe 3A en semaine", "right");
  s.addNotes("L'emploi du temps affiche l'état réel des cours de la semaine : les cours remplacés indiquent le remplaçant, les cours sans professeur disponible sont signalés.");

  // 7. Génération automatique
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Génération automatique de l'emploi du temps", { placeholder: "title" });
  texte(s, ["Saisie des besoins : classe, matière, professeur, heures", "Vœux des professeurs : indisponibilités et souhaits", "Règles propres à chaque établissement : rien n'est imposé", "Proposition sans conflit, relue avant application"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "planification", 4.2, 1.3, 5.3, 3.5, "Page de génération automatique de l'emploi du temps", "right");
  s.addNotes("Le moteur place les séances sans conflit (professeur, classe, salle), respecte les indisponibilités impératives, minimise les souhaits non respectés et explique les séances impossibles à placer. Les demi-journées sans cours, les horaires et le maximum d'heures par classe se règlent par établissement (exemple : mercredi après-midi).");

  // 8. Personnel de vie scolaire
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Planning intelligent du personnel de vie scolaire", { placeholder: "title" });
  texte(s, ["Postes colorés : service, étude, foyer, cour, portail, self…", "Génération automatique selon rôles, contrats et indisponibilités", "Solde hebdomadaire de chaque agent", "Modification, copie vers d'autres jours, annulation"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "planning_personnel", 4.2, 1.2, 5.3, 3.8, "Planning du personnel en grille", "right");
  s.addNotes("Chaque assistant a des rôles (postes). Le moteur répartit les agents sur les besoins par plage horaire ; un clic sur une plage permet de la modifier, la supprimer ou la copier. Les besoins non couverts sont signalés.");

  // 9. Comptage des heures
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Comptage des heures", { placeholder: "title" });
  texte(s, ["Heures hebdomadaires de chaque professeur, avec service dû et écart", "Heures remplacées et effectuées en remplacement sur la période", "Heures par classe, détail par matière", "Contrat, heures planifiées et solde de chaque agent", "Export Excel et impression"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "heures", 4.2, 1.2, 5.3, 3.8, "Comptage des heures des professeurs", "right");
  s.addNotes("Trois vues : professeurs, classes et personnel de vie scolaire. Le service dû de chaque professeur se saisit directement dans le tableau.");

  // 10. Trombinoscope
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Trombinoscope", { placeholder: "title" });
  texte(s, ["Élèves par classe avec le professeur principal", "Professeurs et personnel de vie scolaire", "Recherche instantanée et tri par nom ou prénom", "Photos réduites automatiquement, initiales par défaut"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "trombinoscope", 4.2, 1.2, 5.3, 3.8, "Trombinoscope d'une classe", "right");
  s.addNotes("Le trombinoscope est visible par les enseignants et la vie scolaire ; seule la vie scolaire ajoute les photos. Penser à l'autorisation de droit à l'image des familles.");

  // 10 bis. Pyramide
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Pyramide des âges, filles et garçons", { placeholder: "title" });
  texte(s, ["Total des élèves, garçons, filles et pourcentages", "Âge moyen et tranche d'âges", "Filtre par niveau ou classe", "Tableau des effectifs, export Excel, impression"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "pyramide", 4.2, 1.2, 5.3, 3.8, "Pyramide des âges et des sexes", "right");
  s.addNotes("Les chiffres comptent les élèves dont la date de naissance et le sexe sont renseignés ; un message indique combien ne sont pas comptés.");

  // 11. Infirmerie
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Infirmerie et santé", { placeholder: "title" });
  texte(s, ["Planning des soins relié aux emplois du temps", "Professeur prévenu par message, sans information médicale", "Passages à l'infirmerie et fiches santé", "Accès réservé aux personnes habilitées, consultations journalisées"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "infirmerie", 4.2, 1.3, 5.3, 3.5, "Planning des soins de l'infirmerie", "right");
  s.addNotes("Quand un soin tombe pendant un cours, l'application l'indique et permet de prévenir le professeur par un message automatique qui ne contient aucune information médicale.");

  // 12. Rédaction assistée
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Documents rédigés automatiquement", { placeholder: "title" });
  texte(s, ["Un incident devient un rapport pré-rempli en un clic", "Élève, classe, professeur principal, faits repris", "Modèles modifiables, texte libre", "Impression PDF et export Word"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "document_nouveau", 4.2, 1.2, 5.3, 3.8, "Rédaction assistée d'un document à partir d'un incident", "right");
  s.addNotes("Depuis la page Incidents, le bouton Rédiger le document ouvre le formulaire pré-rempli : élève, classe, professeur principal, date, faits. Le texte du modèle se construit seul et reste modifiable.");

  // 12 bis. En-tête et signataires
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("En-tête et signataires communs", { placeholder: "title" });
  texte(s, ["Ligne officielle, nom, adresse, logo et pied de page", "Signataires choisis document par document", "« Fait à … le … » et cases de signature", "Réglé une seule fois par établissement"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "document_genere", 4.2, 1.2, 5.3, 3.8, "Document avec en-tête et signataires", "right");
  s.addNotes("L'en-tête et les signataires se règlent une seule fois dans Documents, En-tête et signataires, et s'appliquent à l'écran, à l'impression PDF et à l'export Word.");

  // 13. Réunions et messagerie
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Réunions et communication", { placeholder: "title" });
  texte(s, ["Choisir une classe coche automatiquement ses professeurs", "Élèves convoqués par classe, convocations aux parents", "Messagerie par matière, par classe ou à tous", "Messages automatiques liés aux remplacements et aux soins"], 0.5, 1.3, 3.4, 3.6);
  await capture(s, "reunions", 4.2, 1.2, 5.3, 3.8, "Organisation des réunions", "right");
  s.addNotes("Les convocations aux parents sont rédigées automatiquement avec le modèle et l'en-tête de l'établissement, et retrouvables dans Documents.");

  // 14. Multi-établissements et sécurité
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Plusieurs établissements, des données cloisonnées", { placeholder: "title" });
  texte(s, ["Collège, lycée ou groupe scolaire dans une même application", "Chaque établissement a ses propres données et réglages", "L'administrateur ajoute, renomme ou supprime un établissement", "Rôles : administrateur, direction, CPE, enseignant, infirmier", "Double authentification, journal d'audit, RGPD, sauvegarde"], 0.5, 1.3, 3.5, 3.7);
  await capture(s, "etablissements", 4.2, 1.35, 5.3, 3.4, "Gestion des établissements par l'administrateur", "right");
  s.addNotes("Les données sont séparées par établissement : un compte rattaché à un seul établissement ne peut ni lire ni modifier les données d'un autre. La suppression d'un établissement est protégée par confirmation du nom et du mot de passe.");

  // 15. Mobile et évolutif
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Sur téléphone et adaptable à chaque client", { placeholder: "title" });
  texte(s, ["Affichage adapté au téléphone, installable sur l'écran d'accueil", "Modules activables ou désactivables par client", "Configuration par client : nom, couleur, logo, règles", "Extensions pour des besoins spécifiques", "Évolutions de base de données versionnées"], 0.5, 1.3, 4.3, 3.7);
  const pw = 1.55, ph = pw * 1992 / 1170;
  const cap = async (n, x) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.05, y: 1.2, w: pw + 0.1, h: ph + 0.1, rectRadius: 0.1, fill: { color: "26211E" }, line: { type: "none" }, shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.2 }, objectName: "Téléphone " + n });
    s.addImage({ path: IMG(n), x, y: 1.25, w: pw, h: ph, altText: "Capture sur téléphone" });
  };
  await cap("mobile_accueil", 5.35); await cap("mobile_menu", 7.3);
  s.addNotes("L'interface s'adapte aux petits écrans avec un bouton Menu. Pour chaque client, un fichier de configuration règle le nom, la couleur, le logo, les modules actifs et les règles propres à l'établissement.");

  // 16. État actuel / prochaines étapes
  s = pres.addSlide({ masterName: "CONTENU" });
  s.addText("Aujourd'hui et prochaines évolutions", { placeholder: "title" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.25, w: 4.4, h: 3.6, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: "E6DCC3", width: 0.75 }, objectName: "Carte disponible" });
  s.addText("Disponible dans la démonstration", { x: 0.7, y: 1.4, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addText(puces(["Absences, remplacements, cours perturbés", "Emplois du temps et génération automatique", "Personnel de vie scolaire et comptage des heures", "Élèves, trombinoscope, infirmerie, documents", "Établissements, rôles, sécurité, sauvegarde"]),
    { x: 0.7, y: 1.9, w: 4.0, h: 2.8, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 1.25, w: 4.4, h: 3.6, rectRadius: 0.08, fill: { color: "FFFFFF" }, line: { color: C.accent1, width: 1.25 }, objectName: "Carte à venir" });
  s.addText("À définir selon vos demandes", { x: 5.3, y: 1.4, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addText(puces(["Envoi d'e-mails (aujourd'hui : messages internes)", "Semaines A/B et samedi dans les emplois du temps", "API pour des intégrations tierces", "Exports Excel et PDF générés côté serveur", "Hébergement avec stockage durable pour la production"]),
    { x: 5.3, y: 1.9, w: 4.0, h: 2.8, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  s.addNotes("Transparence sur le périmètre : l'application est utilisable et démontrable aujourd'hui ; les évolutions de droite se planifient selon les demandes du client. Pour de vraies données, il faut un hébergement avec disque persistant et la démo désactivée.");

  // 17. Fin
  s = pres.addSlide({ masterName: "FIN" });
  s.addText("Essayez la démonstration", { placeholder: "title" });
  s.addText("viescolaire-pro.onrender.com", { x: 0.8, y: 2.1, w: 8.4, h: 0.6, fontSize: 28, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "Adresse de la démo" });
  s.addText(puces(["CPE : cpe@demo.fr — direction : direction@demo.fr", "Administrateur (établissements) : admin@demo.fr", "Enseignant : prof1@demo.fr — infirmière : infirmerie@demo.fr", "Mot de passe de démonstration : demo1234"]),
    { x: 0.8, y: 3.0, w: 8.4, h: 1.7, fontSize: 16, color: C.background2, valign: "top", margin: 0, isTextBox: true, objectName: "Comptes de démonstration" });
  s.addNotes("Les comptes de démonstration sont partagés et les données fictives. Les données saisies sur la démo peuvent être réinitialisées.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("OK", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
