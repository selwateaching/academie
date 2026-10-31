"""Assistant d'aide de VieScolairePro : fiches « comment faire » et recherche, sans dépendance externe.

Le chatbot fonctionne sans clé : il retrouve les fiches les plus proches de la question (mots-clés, synonymes, fautes de frappe)
et les affiche pas à pas avec un lien vers la bonne page. Si une clé de rédaction est configurée (VSP_IA_API_KEY), une IA reformule
la réponse à partir de ces seules fiches ; elle ne répond jamais en dehors d'elles.
Chaque fiche : id, catégorie, titre, mots (mots-clés et synonymes), roles, page (écran à ouvrir), pas (étapes), module (facultatif).
"""
import difflib
import re
import unicodedata

CATEGORIES = ["Pour commencer", "Élèves et classes", "Professeurs et personnel", "Absences et remplacements", "Notes et bulletins",
              "Emplois du temps", "Documents", "Réunions", "Administration et compte"]

STAFF = "staff"          # chef d'établissement, direction, CPE
ENS = "enseignant"
INF = "infirmier"
TOUS = "tous"


def G(id, cat, titre, mots, page, pas, roles=(STAFF,), module=None, kw=None):
    return {"id": id, "cat": cat, "titre": titre, "mots": mots, "page": page, "pas": pas, "roles": tuple(roles), "module": module, "kw": kw or {}}


GUIDES = [
    # ───────────── Pour commencer
    G("demarrer", "Pour commencer", "Par où commencer avec un nouvel établissement ?",
      "commencer demarrer debut premiers pas perdu installer configurer nouvel etablissement mise en route par ou je suis perdu aide novice debutant tutoriel",
      "classes", ["Réglez l'en-tête des documents : Documents et réunions → En-tête et signataires.",
                  "Créez les niveaux et les classes : Élèves et vie scolaire → Classes et niveaux.",
                  "Ajoutez les élèves : Liste des élèves → Ajouter un élève, ou Import CSV pour un fichier entier.",
                  "Ajoutez les professeurs : Personnel → Annuaire des professeurs → Ajouter un professeur.",
                  "Saisissez les matières et leurs heures par niveau : Planification et suivi → Matières et heures par niveau.",
                  "Demandez les vœux aux professeurs (Vœux des professeurs), puis cliquez sur « Générer les besoins et l'emploi du temps ».",
                  "Relisez la proposition, puis appliquez-la. Créez enfin les comptes des professeurs : Administration → Utilisateurs."]),
    G("menu", "Pour commencer", "Comment me repérer dans le menu ?",
      "menu navigation retrouver page ou est ou trouver rubrique sommaire barre laterale gauche",
      "dashboard", ["Le menu de gauche est rangé en six rubriques numérotées : Élèves et vie scolaire, Personnel, Planification et suivi, Documents et réunions, Administration, Mon compte.",
                    "Cliquez sur le titre d'une rubrique pour la replier ou la déplier.",
                    "Sur le tableau de bord, les mêmes pages sont aussi présentées en cartes.",
                    "Sur téléphone, appuyez sur le bouton « Menu » en haut de l'écran."], roles=(TOUS,)),
    G("changer_etab", "Pour commencer", "Comment changer d'établissement ?",
      "changer etablissement college lycee autre ecole basculer selecteur plusieurs etablissements",
      "dashboard", ["En haut du menu de gauche, ouvrez la liste déroulante sous « VieScolairePro ».", "Choisissez l'établissement : toutes les pages affichent alors ses données."], roles=(TOUS,)),

    # ───────────── Élèves et classes
    G("ajouter_eleve", "Élèves et classes", "Comment ajouter un élève ?",
      "ajouter eleve nouvel eleve creer eleve inscrire inscription saisir eleve fiche eleve nouveau",
      "eleves", ["Ouvrez Élèves et vie scolaire → Liste des élèves.", "Descendez jusqu'à « Ajouter un élève ».", "Renseignez le nom, le prénom et la classe (le reste se complète plus tard).", "Cliquez sur « Ajouter »."]),
    G("importer_eleves", "Élèves et classes", "Comment importer une liste d'élèves ou de professeurs depuis Excel ?",
      "importer import csv excel fichier liste eleves liste professeurs tableur charger telecharger en masse beaucoup",
      "importer", ["Ouvrez Planification et suivi → Import CSV.", "Choisissez ce que vous importez (élèves, professeurs, créneaux).", "Respectez les colonnes indiquées sur la page : première ligne = en-têtes.", "Envoyez le fichier avec « Importer ». Pour mettre à jour des fiches existantes, cochez « Mettre à jour »."]),
    G("completer_fiches", "Élèves et classes", "Comment compléter les adresses et dates de naissance de tous les élèves ?",
      "completer fiches eleves adresse date de naissance telephone email modifier plusieurs eleves saisie rapide tableur classe",
      "eleves_completer", ["Ouvrez Liste des élèves puis cliquez sur « Compléter les fiches ».", "Choisissez une classe : un tableau liste tous ses élèves.", "Remplissez les cases (date de naissance, sexe, adresse, téléphone, e-mail).", "Cliquez sur « Enregistrer »."]),
    G("modifier_eleve", "Élèves et classes", "Comment modifier la fiche d'un élève (adresse, e-mail, classe) ?",
      "modifier eleve fiche changer classe corriger adresse email parent responsable telephone supprimer eleve",
      "eleves", ["Ouvrez Liste des élèves.", "Cliquez sur le nom de l'élève pour ouvrir sa fiche.", "Modifiez les champs voulus (nom, classe, responsable, adresse, régime…).", "Cliquez sur « Enregistrer les modifications »."]),
    G("retrouver_eleve", "Élèves et classes", "Comment retrouver un élève dont j'ai oublié le nom ou la classe ?",
      "retrouver chercher eleve oublie nom classe recherche rechercher filtrer trouver eleve",
      "eleves", ["Ouvrez Liste des élèves.", "Tapez quelques lettres du nom ou du prénom dans la zone de recherche.", "Vous pouvez aussi filtrer par niveau, classe, régime ou groupe.", "Pendant la création d'une réunion, l'encadré « Chercher une personne » fait la même chose sans quitter la page."]),
    G("exporter_eleves", "Élèves et classes", "Comment exporter une liste d'élèves vers Excel ou l'imprimer ?",
      "exporter export liste eleves excel csv imprimer pdf telecharger par classe par niveau groupe pensionnaire demi pension",
      "eleves", ["Ouvrez Liste des élèves.", "Filtrez la liste (niveau, classe, groupe, régime : externe, demi-pensionnaire, pensionnaire).", "Cliquez sur « Excel (CSV) » ou « Un fichier par classe (ZIP) » : vous pouvez choisir les colonnes.", "« Imprimer » ouvre la liste prête à imprimer ou à enregistrer en PDF."]),
    G("classes", "Élèves et classes", "Comment créer, renommer ou supprimer une classe ?",
      "creer classe creer les classes cree les classes ajouter classe renommer classe supprimer classe niveau nombre de classes 6e 5e 4e 3e seconde terminale niveaux",
      "classes", ["Ouvrez Élèves et vie scolaire → Classes et niveaux.", "Pour le nombre de classes d'un niveau : « Nombre de classes par niveau » puis « Appliquer ».", "Pour une classe isolée : « Nouvelle classe ».", "Pour renommer ou supprimer : ouvrez la carte de la classe puis « Renommer » ou « Supprimer »."]),
    G("groupes", "Élèves et classes", "Comment créer un groupe d'élèves (LV2, atelier, aide aux devoirs) ?",
      "groupe eleves lv2 atelier aide aux devoirs club option creer groupe regrouper eleves plusieurs classes",
      "eleves_groupes", ["Ouvrez Élèves et vie scolaire → Groupes d'élèves.", "Donnez un nom au groupe et choisissez sa couleur, puis « Créer le groupe ».", "Dans le groupe, choisissez une classe et cochez les élèves à ajouter."]),
    G("pp", "Élèves et classes", "Comment désigner le professeur principal d'une classe ?",
      "professeur principal pp classe designer responsable de classe",
      "classes", ["Ouvrez Classes et niveaux.", "Ouvrez la carte de la classe.", "Choisissez le professeur principal dans la liste et enregistrez."]),
    G("trombinoscope", "Élèves et classes", "Comment voir ou ajouter les photos des élèves (trombinoscope) ?",
      "trombinoscope photo photos eleves ajouter photo visage portrait imprimer trombi",
      "trombinoscope", ["Ouvrez Élèves et vie scolaire → Trombinoscope.", "Choisissez la classe, ou l'onglet Professeurs ou Personnel.", "Pour ajouter une photo, cliquez sur la pastille de l'élève et choisissez l'image.", "« Imprimer / PDF » imprime la planche de la classe. Pensez à l'accord des familles pour les photos."], roles=(STAFF, ENS), module="trombinoscope"),
    G("pyramide", "Élèves et classes", "Comment voir la pyramide des âges et la répartition filles-garçons ?",
      "pyramide ages sexe filles garcons statistiques effectifs repartition age moyen",
      "pyramide", ["Ouvrez Élèves et vie scolaire → Pyramide des âges.", "Choisissez un niveau ou une classe, puis « Afficher ».", "Les dates de naissance et le sexe doivent être renseignés dans les fiches pour être comptés."]),

    # ───────────── Professeurs et personnel
    G("ajouter_prof", "Professeurs et personnel", "Comment ajouter un professeur ?",
      "ajouter professeur nouveau professeur creer enseignant liste des profs annuaire professeurs saisir prof",
      "professeurs", ["Ouvrez Personnel → Annuaire des professeurs.", "Descendez jusqu'à « Ajouter un professeur ».", "Saisissez le nom, le prénom, la matière, l'e-mail et le téléphone.", "Cliquez sur « Ajouter »."]),
    G("liste_profs", "Professeurs et personnel", "Où trouver la liste des professeurs ?",
      "liste des professeurs liste des profs annuaire professeurs ou trouver professeurs enseignants coordonnees",
      "professeurs", ["Ouvrez Personnel → Annuaire des professeurs.", "Utilisez la recherche pour filtrer par nom, matière ou e-mail.", "« Exporter l'annuaire » donne la liste dans Excel."]),
    G("classes_prof", "Professeurs et personnel", "Comment attribuer des classes et une matière à un professeur ?",
      "attribuer affecter classes professeur matiere assigner prof a une classe donner des classes enseigne classes du professeur colonne classes vide",
      "volumes", ["La matière se saisit dans la fiche du professeur (champ « Matière »).", "Les classes se déduisent de l'emploi du temps : ouvrez Planification et suivi → Matières et heures par niveau.", "Ajoutez la matière et ses heures pour chaque niveau, puis « Enregistrer les volumes horaires ».", "Cliquez sur « Générer les besoins et l'emploi du temps » : les professeurs de la matière sont affectés aux classes.", "Pour imposer un professeur à une classe, utilisez le tableau « Choisir un professeur pour une classe »."]),
    G("ajouter_matiere", "Professeurs et personnel", "Comment ajouter une matière ?",
      "ajouter matiere nouvelle matiere creer matiere discipline modifier matiere supprimer matiere heures par niveau informatique excel",
      "volumes", ["Ouvrez Planification et suivi → Matières et heures par niveau.", "Dans le tableau 1, utilisez une ligne « Nouvelle matière… » : tapez le nom.", "Indiquez les heures par semaine pour chaque niveau concerné.", "Cliquez sur « Enregistrer les volumes horaires ».", "Pour qu'un professeur l'enseigne, écrivez la même matière dans sa fiche."]),
    G("compte_prof", "Professeurs et personnel", "Comment créer le compte de connexion d'un professeur ?",
      "creer compte professeur identifiant mot de passe connexion utilisateur login acces enseignant",
      "utilisateurs", ["Dans l'annuaire des professeurs, cliquez sur « Créer le compte » (l'e-mail doit être renseigné).", "Ou ouvrez Administration → Utilisateurs → « Créer un compte ».", "Un mot de passe temporaire est donné : le professeur devra le changer à sa première connexion."]),
    G("voeux", "Professeurs et personnel", "Comment saisir les vœux et indisponibilités des professeurs ?",
      "voeux indisponibilites souhaits professeurs contraintes jours libres mercredi disponibilites emploi du temps preferences",
      "voeux", ["Ouvrez Planification et suivi → Vœux des professeurs.", "Choisissez le professeur.", "Pour chaque demi-journée, indiquez « Impossible » (impératif) ou « Souhait ».", "Enregistrez. Les professeurs peuvent aussi saisir les leurs avec « Mes vœux »."], roles=(STAFF,)),
    G("mes_voeux", "Professeurs et personnel", "Comment indiquer mes indisponibilités et souhaits d'emploi du temps ?",
      "mes voeux mes indisponibilites mes souhaits jours libres preferences horaires emploi du temps professeur",
      "mes_voeux", ["Ouvrez Mon espace → Mes vœux.", "Pour chaque demi-journée, indiquez « Impossible » ou « Souhait ».", "Enregistrez : la direction en tient compte pour l'emploi du temps."], roles=(ENS,)),
    G("heures", "Professeurs et personnel", "Comment voir les heures de chaque professeur (service dû) ?",
      "heures professeurs comptage heures service du charge heures de cours heures par classe heures supplementaires",
      "heures", ["Ouvrez Personnel → Comptage des heures.", "L'onglet Professeurs montre les heures de chaque professeur ; saisissez le service dû puis « Enregistrer les services dus ».", "Les onglets Classes et Personnel donnent les autres comptages.", "« Imprimer / PDF » et l'export Excel sont disponibles."], module="heures"),
    G("personnel", "Professeurs et personnel", "Comment ajouter un assistant d'éducation ou un agent de vie scolaire ?",
      "ajouter surveillant assistant education pion agent personnel vie scolaire aesh annuaire personnel creer agent",
      "pers_liste", ["Ouvrez Personnel → Annuaire du personnel de vie scolaire.", "Utilisez « Ajouter une personne » : nom, prénom, catégorie, contrat.", "Ouvrez ensuite sa fiche pour ses postes, ses indisponibilités et ses souhaits."], module="personnel"),
    G("planning_personnel", "Professeurs et personnel", "Comment faire le planning des surveillants ?",
      "planning surveillants personnel vie scolaire planning agents postes horaires generer planning service etude foyer cour",
      "pers_planning", ["Vérifiez d'abord les postes et leurs besoins : Personnel → Postes et besoins.", "Ouvrez Personnel → Planning du personnel.", "Cliquez sur « Générer » : le planning se remplit selon les rôles, contrats et indisponibilités.", "Cliquez sur une plage pour la modifier, la copier ou la supprimer. « Annuler la dernière génération » revient en arrière."], module="planning_personnel"),

    # ───────────── Absences et remplacements
    G("absence_prof", "Absences et remplacements", "Comment déclarer l'absence d'un professeur ?",
      "declarer absence professeur absent prof malade maladie absence enseignant indisponibilite arret remplacement a prevoir",
      "absences", ["Ouvrez Élèves et vie scolaire → Absences des professeurs.", "Dans « Déclarer » : choisissez le professeur, le type (absence ou indisponibilité), les dates et le motif.", "Cliquez sur « Enregistrer » : les cours à remplacer sont créés automatiquement.", "Poursuivez avec Remplacements pour trouver les remplaçants."], roles=(STAFF, ENS)),
    G("remplacer", "Absences et remplacements", "Comment trouver un remplaçant ?",
      "remplacer remplacement remplacant trouver professeur libre couvrir cours pourvoir assigner suppleance",
      "remplacements", ["Ouvrez Élèves et vie scolaire → Remplacements.", "Pour chaque cours, les professeurs libres sont proposés (même matière d'abord) : cliquez sur « Assigner ».", "Pour tout faire d'un coup : « Pourvoir automatiquement ».", "Le remplaçant est prévenu par un message automatique."]),
    G("faire_appel", "Absences et remplacements", "Comment faire l'appel ?",
      "appel faire appel absents presents retard eleves absents pointer feuille d'appel saisir absences eleves",
      "appel", ["Ouvrez le menu, rubrique « Absences et retards des élèves » puis « Faire l'appel ».", "Choisissez la classe, la date et le créneau.", "Marquez les élèves absents ou en retard (« Tout le monde présent » si personne ne manque).", "Cliquez sur « Enregistrer l'appel »."], roles=(STAFF, ENS), module="assiduite"),
    G("justifier", "Absences et remplacements", "Comment justifier une absence d'élève ?",
      "justifier absence eleve justificatif motif justifiee non justifiee en attente certificat medical",
      "assiduite", ["Ouvrez Absences et retards des élèves.", "Cochez les lignes concernées.", "Dans « Pour les lignes cochées », cliquez sur « Marquer justifiée », « Non justifiée » ou « En attente » (vous pouvez ajouter le motif)."], module="assiduite"),
    G("saisir_absence_eleve", "Absences et remplacements", "Comment saisir une absence d'élève sur plusieurs jours ?",
      "saisir absence eleve plusieurs jours absence longue absent la semaine voyage maladie eleve",
      "assiduite", ["Ouvrez Absences et retards des élèves.", "Descendez jusqu'à « Saisir une absence (un ou plusieurs jours) ».", "Choisissez l'élève, les dates et le motif, puis « Enregistrer »."], module="assiduite"),
    G("etats_absences", "Absences et remplacements", "Comment obtenir l'état des absences par jour, semaine ou mois ?",
      "etat des absences par jour semaine mois bilan absences liste absents absents aujourd hui du jour imprimer taux absenteisme rapport absences",
      "etat_assiduite", ["Ouvrez Absences et retards des élèves puis le bouton « État jour · semaine · mois ».", "Choisissez Jour, Semaine ou Mois, et une classe si besoin.", "« Imprimer / PDF » ou l'export Excel donnent le document. Pour les professeurs : Absences des professeurs → « État jour · semaine · mois »."], module="assiduite", kw={}),
    G("incident", "Absences et remplacements", "Comment enregistrer un incident ?",
      "incident enregistrer incident bagarre conduite sanction signalement vie scolaire declarer incident",
      "incidents", ["Ouvrez Élèves et vie scolaire → Incidents.", "Dans « Nouvel incident » : date, classe, élève, description.", "Cliquez sur « Enregistrer ». Le bouton « Rédiger le document » crée un rapport pré-rempli."]),
    G("soins", "Absences et remplacements", "Comment programmer un soin à l'infirmerie ?",
      "infirmerie soin programmer rendez vous infirmier traitement passage infirmerie fiche sante allergie pai",
      "infirmerie_soins", ["Ouvrez Infirmerie → Planning des soins.", "Dans « Programmer un soin » : élève, date, heure, durée, intitulé.", "Les passages se notent dans « Passages à l'infirmerie », les allergies et PAI dans « Fiches santé »."], roles=(STAFF, INF), module="infirmerie"),

    # ───────────── Notes et bulletins
    G("saisir_notes", "Notes et bulletins", "Comment saisir les notes d'une classe ?",
      "saisir notes noter evaluation controle devoir interro note eleves ajouter une note creer evaluation bareme coefficient",
      "notes", ["Ouvrez Notes et évaluations (Mes notes pour un professeur).", "Cliquez sur « Nouvelle évaluation » : classe, matière, titre, date, barème, coefficient, période.", "Cliquez sur « Créer et saisir les notes ».", "Tapez la note de chaque élève (ou « abs » / « disp »), puis « Enregistrer les notes »."], roles=(STAFF, ENS), module="notes"),
    G("releve", "Notes et bulletins", "Comment imprimer le relevé de notes ou le bulletin d'un élève ?",
      "releve de notes bulletin imprimer notes eleve parent convoque moyenne bulletin trimestre mi parcours moyennes",
      "bulletins_classe", ["Ouvrez la fiche de l'élève (Liste des élèves) puis « Notes et bulletin ».", "Choisissez le trimestre ou l'année.", "« Relevé de notes » donne les notes ; « Relevé à mi-parcours » un bilan intermédiaire ; « Bulletin » le document avec appréciations.", "Pour toute une classe : Élèves et vie scolaire → Bulletins de classe.", "Cliquez sur « Imprimer / PDF »."], module="notes"),
    G("appreciations", "Notes et bulletins", "Comment écrire les appréciations des bulletins ?",
      "appreciations bulletin commentaire matiere appreciation generale conseil de classe saisir appreciation",
      "appreciations", ["Ouvrez Notes et évaluations → onglet Appréciations.", "Choisissez la classe et la période.", "Saisissez l'appréciation de chaque élève, puis « Enregistrer les appréciations ». L'appréciation générale se rédige dans le bulletin."], module="notes"),
    G("periodes", "Notes et bulletins", "Comment régler les trimestres ou semestres ?",
      "periodes trimestres semestres dates trimestre annee scolaire calendrier decoupage",
      "periodes", ["Ouvrez Administration → Périodes (trimestres).", "Modifiez les noms et les dates, ou utilisez « Ajouter une période »."], module="notes"),

    # ───────────── Emplois du temps
    G("voir_edt", "Emplois du temps", "Où voir l'emploi du temps d'une classe ou d'un professeur ?",
      "emploi du temps classe voir edt horaires cours semaine professeur planning cours imprimer emploi du temps quand mes eleves ont cours",
      "emploi_du_temps", ["Ouvrez Personnel → Emplois du temps.", "Choisissez la classe (ou le professeur) dans les listes en haut.", "Utilisez Jour, Semaine ou Mois, puis « Imprimer / PDF » si besoin."], roles=(STAFF, ENS)),
    G("generer_edt", "Emplois du temps", "Comment générer l'emploi du temps ?",
      "generer emploi du temps creer edt proposition automatique faire emploi du temps construire planning classes appliquer proposition",
      "planification", ["Saisissez les matières et heures par niveau (Planification et suivi → Matières et heures par niveau).", "Recueillez les vœux des professeurs (Vœux des professeurs).", "Cliquez sur « Générer les besoins et l'emploi du temps » (ou « Générer une proposition » dans Génération des emplois du temps).", "Relisez la proposition par classe ou par professeur : les trous sont en rouge.", "Cochez la confirmation puis « Appliquer » pour remplacer l'emploi du temps actuel."]),
    G("trous", "Emplois du temps", "Que signifient les « trous » de la proposition d'emploi du temps ?",
      "trous emploi du temps heures libres heure creuse souhait non respecte seances placees indicateurs proposition",
      "planification", ["Un trou est une heure libre entre deux cours d'une même journée.", "Les quatre cadres du haut : séances placées, heures sur un souhait non respecté, trous des professeurs, trous des classes.", "Les trous apparaissent en rouge dans la grille ; la zone « Où sont les trous ? » les liste.", "Pour en réduire : assouplissez des vœux ou le maximum d'heures par jour (Réglages de l'établissement), puis régénérez."]),
    G("reglages_edt", "Emplois du temps", "Comment régler les horaires et les demi-journées sans cours (mercredi après-midi) ?",
      "reglages etablissement horaires creneaux mercredi apres midi demi journee sans cours maximum heures par jour classe fermee",
      "planification_parametres", ["Ouvrez Planification et suivi → Réglages de l'établissement.", "Cochez les demi-journées sans cours, saisissez les horaires des créneaux et la charge maximale.", "Cliquez sur « Enregistrer »."]),

    # ───────────── Documents
    G("rediger_document", "Documents", "Comment rédiger un document (convocation, avertissement, rapport) ?",
      "rediger document convocation parents avertissement rapport incident courrier lettre modele compte rendu entretien creer document",
      "document_nouveau", ["Ouvrez Documents et réunions → Rédiger un document.", "1. Choisissez le type de document et l'élève : classe, professeur principal et responsable sont remplis seuls.", "2. Complétez les informations (date, motif).", "3. Relisez et modifiez le texte, puis « Enregistrer le document ».", "Imprimez en PDF ou exportez en Word."], roles=(STAFF, ENS), module="redaction"),
    G("entete", "Documents", "Comment mettre le logo et l'en-tête de l'établissement sur les documents ?",
      "entete logo pied de page signature signataire directeur adresse documents officiel en tete etablissement",
      "documents_parametres", ["Ouvrez Documents et réunions → En-tête et signataires.", "Renseignez la ligne officielle, le nom, l'adresse, le contact, le logo et le pied de page, puis « Enregistrer l'en-tête ».", "Ajoutez les signataires (directeur, CPE…) avec « Ajouter »."], module="redaction"),
    G("bibliotheque", "Documents", "Où retrouver tous les documents rédigés ?",
      "retrouver document archive bibliotheque documents classer rechercher document ancien convocation archive classe par date niveau",
      "documents", ["Ouvrez Documents et réunions → Bibliothèque de documents.", "Filtrez par recherche, niveau, classe, type ou dates, et classez par date, niveau, élève ou type.", "La fiche d'un élève affiche aussi ses documents."], roles=(STAFF, ENS)),
    G("partager_fichier", "Documents", "Comment partager un fichier (PDF, Word, Excel) avec l'équipe ?",
      "partager fichier document partage deposer pdf word excel envoyer fichier equipe reglement interieur",
      "documents", ["Ouvrez Bibliothèque de documents.", "Dans « Partager un document » : titre, choix du fichier (8 Mo maximum).", "Cliquez sur « Envoyer » : le fichier est disponible pour tous."], roles=(STAFF,)),
    G("messagerie", "Documents", "Comment envoyer un message à un professeur ou à une classe ?",
      "message messagerie envoyer message ecrire professeur classe tous mail courrier interne nouveau message accuse de lecture",
      "message_nouveau", ["Ouvrez Messagerie → « Nouveau message ».", "Choisissez les destinataires (une personne, une classe, un niveau ou tous).", "Écrivez le sujet et le message, puis « Envoyer »."], roles=(TOUS,), module="messagerie"),
    G("taches", "Documents", "Comment suivre mes tâches et échéances ?",
      "taches echeances a faire rappel todo liste de taches rappeler deadline",
      "taches", ["Ouvrez Planification et suivi → Tâches.", "« Nouvelle tâche » : titre, description, échéance.", "Cochez la tâche quand elle est faite."], module="taches"),
    G("rapports", "Documents", "Comment obtenir des statistiques et des rapports ?",
      "rapports statistiques bilan chiffres professeurs les plus absents export excel imprimer rapport statistique analyse",
      "rapports", ["Ouvrez Planification et suivi → Rapports.", "Choisissez la période puis « Calculer ».", "Imprimez en PDF ou utilisez les exports Excel (CSV)."], module="rapports"),

    # ───────────── Réunions
    G("creer_reunion", "Réunions", "Comment créer une réunion ?",
      "creer reunion nouvelle reunion convoquer convocation conseil de classe conseil des enseignants reunion parents organiser reunion planifier",
      "reunions", ["Ouvrez Documents et réunions → Réunions → « Nouvelle réunion ».", "Choisissez ce que vous voulez faire : convoquer seulement, convoquer et enregistrer, ou rédiger un compte rendu.", "Saisissez le titre, la date, l'heure, le lieu et l'ordre du jour.", "Choisissez les professeurs (par classe ou à la main) et, si besoin, les élèves, puis « Créer la réunion »."], roles=(STAFF,), module="reunions"),
    G("enregistrer_reunion", "Réunions", "Comment enregistrer une réunion et obtenir le compte rendu ?",
      "enregistrer reunion micro enregistrement compte rendu transcription ia intelligente audio dictaphone proces verbal",
      "reunions", ["Créez la réunion avec l'option « Convoquer et enregistrer » (ou ouvrez-la puis « Enregistrer cette réunion »).", "Étape 1 : cochez les participants, leur consentement et l'attestation.", "Étape 2 : « Démarrer l'enregistrement », autorisez le micro, laissez la page ouverte ; « Arrêter » à la fin.", "Étape 3 : « Transcrire l'enregistrement », corrigez le texte.", "Étape 4 : « Générer le compte rendu IA », relisez, corrigez, puis « Enregistrer et valider »."], roles=(STAFF,), module="reunions_ia"),
    G("micro", "Réunions", "Le micro ne marche pas, que faire ?",
      "micro ne marche pas microphone refuse autorisation pas de son enregistrement impossible permission blocage navigateur",
      "reunions", ["Autorisez le micro : cliquez sur le cadenas dans la barre d'adresse, mettez « Microphone » sur « Autoriser », rechargez la page.", "Fermez les applications qui utilisent le micro (Teams, Zoom…).", "Utilisez Chrome, Edge, Firefox ou Safari récents, sur une adresse en https.", "Si la barre de niveau reste vide, rapprochez-vous du micro."], roles=(STAFF,), module="reunions_ia"),
    G("hors_sujet", "Réunions", "Comment supprimer ce qui est hors sujet dans la transcription ?",
      "hors sujet supprimer phrases transcription rouge bavardage digression retirer passages ordre du jour",
      "reunions", ["Dans la réunion, à l'étape 3, cliquez sur « Repérer les passages hors sujet ».", "Les passages étrangers au sujet passent en rouge, cochés. Décochez ceux à garder.", "Cliquez sur « Supprimer les passages cochés de la transcription »."], roles=(STAFF,), module="reunions_ia"),
    G("valider_cr", "Réunions", "Comment valider, imprimer ou partager un compte rendu ?",
      "valider compte rendu imprimer pdf partager envoyer compte rendu word telecharger proces verbal decisions actions format",
      "reunions", ["Ouvrez la réunion, étape 4 : corrigez les rubriques puis « Enregistrer et valider le compte rendu ».", "Choisissez un format (détaillé, résumé, décisions, actions, procès-verbal), puis « Imprimer / Enregistrer en PDF » ou « Télécharger Word ».", "Après validation, « Partager par la messagerie interne » l'envoie aux destinataires choisis."], roles=(STAFF,), module="reunions_ia"),
    G("repondre_reunion", "Réunions", "Comment répondre à une convocation ?",
      "repondre convocation reunion present absent reponse invitation convoque",
      "reunions", ["Ouvrez Réunions.", "Sur la ligne de la réunion, cliquez sur « Présent » ou « Absent »."], roles=(ENS,)),

    # ───────────── Administration et compte
    G("mot_de_passe", "Administration et compte", "Comment changer mon mot de passe ou activer la double authentification ?",
      "mot de passe changer modifier oublie mdp securite double authentification mfa code application securiser compte",
      "compte", ["Ouvrez Mon compte → Sécurité.", "« Mot de passe » : saisissez l'ancien et le nouveau, puis « Modifier ».", "« Double authentification (MFA) » : « Activer », scannez le code avec une application d'authentification."], roles=(TOUS,)),
    G("oubli_mdp", "Administration et compte", "J'ai oublié mon mot de passe",
      "oublie mot de passe perdu mot de passe reinitialiser connexion impossible je ne peux plus me connecter",
      "utilisateurs", ["Demandez à l'administrateur ou à la direction de le réinitialiser : Administration → Utilisateurs.", "Un mot de passe temporaire vous est donné ; vous devrez le changer à la connexion."], roles=(STAFF,)),
    G("utilisateurs", "Administration et compte", "Comment créer ou désactiver un compte utilisateur ?",
      "creer compte utilisateur desactiver compte droits roles acces direction cpe enseignant infirmier utilisateurs",
      "utilisateurs", ["Ouvrez Administration → Utilisateurs.", "« Créer un compte » : nom, e-mail, rôle (direction, CPE, enseignant, infirmier).", "Les actions de la ligne permettent de réinitialiser le mot de passe ou de désactiver le compte."], roles=(STAFF,), module="utilisateurs"),
    G("etablissements", "Administration et compte", "Comment ajouter ou supprimer un établissement ?",
      "ajouter etablissement creer etablissement supprimer college lycee renommer rattacher groupe scolaire",
      "etablissements", ["Ouvrez Administration → Établissements (réservé à l'administrateur).", "« Ajouter un établissement » : saisissez le nom puis « Créer l'établissement ».", "Chaque établissement garde ses propres données."], roles=("admin",)),
    G("sauvegarde", "Administration et compte", "Comment faire une sauvegarde des données ?",
      "sauvegarde backup copie de securite exporter toutes les donnees telecharger sauvegarde restaurer",
      "sauvegarde", ["Ouvrez Administration → Sauvegarde (direction et administrateur).", "Cliquez sur « Télécharger la sauvegarde » : un fichier ZIP contient la base et les fichiers déposés.", "Conservez-le en lieu sûr. Faites-le avant chaque mise à jour."], roles=("admin", "direction"), module="sauvegarde"),
    G("rgpd", "Administration et compte", "Comment exporter ou supprimer mes données personnelles (RGPD) ?",
      "rgpd donnees personnelles supprimer mon compte exporter mes donnees confidentialite vie privee",
      "rgpd", ["Ouvrez Mon compte → RGPD.", "Vous y voyez vos données et pouvez les exporter.", "« Supprimer mon compte » est définitif."], roles=(TOUS,)),
    G("historique", "Administration et compte", "Comment savoir qui a fait quoi (historique) ?",
      "historique journal audit qui a modifie actions tracabilite qui a supprime journal des actions",
      "historique", ["Ouvrez Planification et suivi → Historique.", "La liste donne la date, la personne et l'action pour chaque opération importante."], roles=(STAFF,)),
]
PAR_ID = {g["id"]: g for g in GUIDES}

MOTS_VIDES = set("""le la les un une des du de d l et ou a au aux en dans sur pour par avec sans ce cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs
je tu il elle on nous vous ils elles me te se qui que quoi dont ou comment quand pourquoi est sont suis etre avoir ai as avons avez ont fait faire peut peux peuvent veux veut
voudrais pouvez puis il y a plus moins tres bien tout tous toute toutes si pas ne n ni mais donc car faut falloir dois doit pouvoir svp stp merci bonjour salut""".split())


def normaliser(texte):
    t = unicodedata.normalize("NFD", (texte or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def racine(mot):
    for suf in ("ements", "ement", "ations", "ation", "eurs", "eur", "es", "s", "x"):
        if len(mot) > len(suf) + 3 and mot.endswith(suf):
            return mot[:-len(suf)]
    return mot


def jetons(texte):
    return [racine(m) for m in normaliser(texte).split() if m not in MOTS_VIDES and len(m) > 1]


_INDEX = None
_IDF = {}


def _index():
    global _INDEX
    if _INDEX is None:
        _INDEX = {}
        for g in GUIDES:
            titre = set(jetons(g["titre"]))
            mots = set(jetons(g["mots"]))
            texte = set(jetons(" ".join(g["pas"])))
            _INDEX[g["id"]] = (titre, mots, texte, normaliser(g["titre"] + " " + g["mots"]))
        from math import log
        df = {}
        for titre, mots, _t, _p in _INDEX.values():
            for m in titre | mots:
                df[m] = df.get(m, 0) + 1
        n = len(_INDEX)
        for m, d in df.items():                 # un mot rare (« photo », « sauvegarde ») pèse plus qu'un mot courant (« élève », « ajouter »)
            _IDF[m] = 0.6 + 1.4 * log(n / d) / log(n)
    return _INDEX


def score(question, g):
    q = jetons(question)
    if not q:
        return 0.0
    titre, mots, texte, plein = _index()[g["id"]]
    total, qnorm = 0.0, normaliser(question)
    for t in q:
        w = _IDF.get(t, 1.0)
        if t in titre:
            total += 3.0 * w
        elif t in mots:
            total += 2.0 * w
        elif len(t) >= 5 and any(difflib.SequenceMatcher(None, t, m).ratio() >= 0.84 for m in (titre | mots)):
            total += 1.5
        elif t in texte:
            total += 0.5
    # expressions de deux mots proches de la question (ex. « emploi du temps », « mot de passe »)
    mots_q = normaliser(question).split()
    for i in range(len(mots_q) - 1):
        bi = mots_q[i] + " " + mots_q[i + 1]
        if bi in plein:
            total += 1.5
    return total


def meilleur(question, guides):
    """(score, fiche) de la fiche la plus proche, ou (0, None)."""
    notes = [(score(question, g), g) for g in guides]
    return max(notes, key=lambda x: x[0]) if notes else (0.0, None)


def chercher(question, guides, n=3, seuil=3.0):
    """Les n fiches les plus proches de la question parmi `guides` (déjà filtrées selon le rôle)."""
    notes = sorted(((score(question, g), g) for g in guides), key=lambda x: -x[0])
    if not notes or notes[0][0] < seuil:
        return []
    meilleur = notes[0][0]
    return [g for s, g in notes[:n] if s >= max(seuil, meilleur * 0.7)]
