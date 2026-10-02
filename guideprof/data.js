/* Données du Guide du professeur débutant.
   Format par séquence : [nom, enseigner[], eleveSaitFaire[], jeFaisFaire[], jeVerifie[], siPasCompris[]]
   (tableaux vides quand l'information n'était pas fournie pour cette séquence) */
const GUIDE_DATA = {
niveaux: [
  { id:'1AP', label:'1AP', cycle:'Primaire' },
  { id:'2AP', label:'2AP', cycle:'Primaire' },
  { id:'3AP', label:'3AP', cycle:'Primaire' },
  { id:'4AP', label:'4AP', cycle:'Primaire' },
  { id:'5AP', label:'5AP', cycle:'Primaire' },
  { id:'1AM', label:'1AM', cycle:'Moyen' },
  { id:'2AM', label:'2AM', cycle:'Moyen' },
  { id:'3AM', label:'3AM', cycle:'Moyen' },
  { id:'1AS', label:'1AS', cycle:'Secondaire' },
  { id:'2AS', label:'2AS', cycle:'Secondaire' },
  { id:'3AS', label:'3AS', cycle:'Secondaire' }
],

programme: {

"1AP": {
  "Arabe": [
    ["Séquence 1 — Entrer dans l'école",
      ["Se présenter.","Reconnaître son prénom.","Comprendre les consignes simples.","Reconnaître les lettres.","Écouter et répéter correctement."],
      ["Dire son prénom.","Comprendre « ouvre », « ferme », « écoute », « regarde », etc.","Reconnaître les premières lettres."],
      [],
      ["L'élève reconnaît-il les lettres ?","Comprend-il les consignes ?","Peut-il répéter correctement ?"],
      []],
    ["Séquence 2 — Découvrir les lettres",
      ["Forme des lettres.","Nom des lettres.","Son des lettres.","Différence entre les lettres."],
      ["Reconnaître une lettre.","Donner son nom.","Produire son son.","Reproduire la lettre."],
      [],[],[]],
    ["Séquence 3 — Les syllabes et les sons",
      ["Voyelles.","Sons simples.","Assemblage des sons.","Syllabes."],
      ["Lire des syllabes simples.","Associer une lettre à son son.","Combiner plusieurs sons."],
      [],[],[]],
    ["Séquence 4 — Premiers mots",
      ["Lecture de mots simples.","Écriture de mots.","Copie.","Dictée de mots simples."],
      ["Lire un mot simple.","Copier correctement.","Écrire sous dictée des mots étudiés."],
      [],[],[]],
    ["Séquence 5 — Premières phrases",
      ["Construction d'une phrase simple.","Sens de lecture.","Espacement entre les mots.","Ponctuation simple."],
      ["Lire une phrase courte.","Construire une phrase.","Copier une phrase.","Écrire une phrase simple."],
      [],[],[]]
  ],
  "Mathématiques": [
    ["Séquence 1 — Se repérer",
      ["Devant / derrière.","Dessus / dessous.","À droite / à gauche.","Près / loin.","Dedans / dehors."],
      ["Se situer.","Situer un objet.","Suivre une consigne de position."],
      [],[],[]],
    ["Séquence 2 — Classer et comparer",
      ["Grand / petit.","Long / court.","Beaucoup / peu.","Plus / moins.","Même quantité."],
      ["Comparer deux objets.","Comparer deux collections.","Classer des objets."],
      [],[],[]],
    ["Séquence 3 — Découvrir les nombres",
      ["Reconnaître les nombres.","Compter.","Associer nombre et quantité.","Écrire les nombres."],
      ["Compter une collection.","Reconnaître un nombre.","Écrire un nombre.","Associer 5 objets au nombre 5, etc."],
      [],[],[]],
    ["Séquence 4 — Ajouter et retirer",
      ["Ajouter une quantité.","Retirer une quantité.","Comprendre les situations simples d'addition et de soustraction."],
      ["Résoudre une petite situation.","Trouver combien il reste.","Trouver combien il y a en tout."],
      [],[],[]],
    ["Séquence 5 — Formes et grandeurs",
      ["Cercle.","Carré.","Triangle.","Rectangle.","Comparaison des longueurs."],
      ["Reconnaître une forme.","Nommer une forme.","Reproduire une forme.","Comparer des longueurs."],
      [],[],[]]
  ],
  "Éducation scientifique et technologique": [
    ["Séquence 1 — Mon corps",
      ["Les principales parties du corps.","Les cinq sens.","Règles simples d'hygiène."],
      ["Nommer les parties du corps.","Identifier les cinq sens.","Expliquer quelques règles d'hygiène."],
      [],[],[]],
    ["Séquence 2 — Ma santé",
      ["Propreté.","Lavage des mains.","Alimentation.","Sommeil.","Activité physique."],
      ["Expliquer pourquoi il faut se laver les mains.","Reconnaître les bonnes habitudes."],
      [],[],[]],
    ["Séquence 3 — Les animaux et les plantes",
      ["Différence animal/plante.","Besoins des êtres vivants.","Quelques animaux et plantes de l'environnement."],
      ["Reconnaître un animal.","Reconnaître une plante.","Identifier quelques besoins essentiels."],
      [],[],[]]
  ],
  "Éducation islamique": [
    ["Séquence 1 — Découvrir l'Islam",
      ["Allah.","Le Prophète Muhammad ﷺ.","Les valeurs de respect et de bonté."],
      ["Connaître les éléments essentiels étudiés.","Respecter les autres."],
      [],[],[]],
    ["Séquence 2 — Les premières pratiques",
      ["Propreté.","Salutation.","Bismillah.","Quelques invocations simples."],
      ["Utiliser les salutations.","Dire les formules apprises.","Appliquer les règles de propreté."],
      [],[],[]],
    ["Séquence 3 — Sourates et apprentissage",
      ["Sourates prévues au programme.","Écoute et mémorisation.","Prononciation correcte."],
      ["Réciter les passages appris."],
      [],[],[]]
  ],
  "Éducation civique": [
    ["Séquence 1 — Moi et les autres",
      ["Respect.","Politesse.","Écoute.","Entraide."],
      ["Saluer.","Écouter.","Respecter les autres."],
      [],[],[]],
    ["Séquence 2 — La vie à l'école",
      ["Règles de la classe.","Respect du matériel.","Respect des camarades."],
      ["Respecter les règles.","Prendre soin du matériel."],
      [],[],[]]
  ],
  "Éducation artistique": [
    ["Séquence 1 — Découvrir les couleurs",
      ["Couleurs principales.","Mélanges simples."],
      ["Reconnaître les couleurs.","Utiliser différentes couleurs."],
      [],[],[]],
    ["Séquence 2 — Dessiner",
      ["Traits.","Formes.","Motifs simples."],
      ["Reproduire un modèle simple.","Dessiner librement."],
      [],[],[]]
  ],
  "Éducation physique": [
    ["Séquence 1 — Bouger son corps",["Marcher.","Courir.","Sauter.","Se déplacer."],[],[],[],[]],
    ["Séquence 2 — Se déplacer et contrôler ses mouvements",["Courir dans une direction.","S'arrêter.","Changer de direction.","Garder son équilibre."],[],[],[],[]],
    ["Séquence 3 — Jouer ensemble",["Respecter les règles.","Attendre son tour.","Coopérer."],[],[],[],[]]
  ]
},

"2AP": {
  "Arabe": [
    ["Séquence 1 — Comprendre et utiliser les consignes",
      ["Comprendre des consignes plus longues.","Identifier les informations importantes.","Enrichir le vocabulaire courant.","Construire des phrases simples."],
      ["Écouter une consigne et l'exécuter.","Répondre à une question simple.","Formuler une phrase correcte."],
      [],
      ["L'élève comprend-il la consigne ?","Répond-il avec une phrase complète ?"],
      ["Reformuler la consigne.","Donner un exemple.","Faire réaliser la première activité collectivement."]],
    ["Séquence 2 — Lire correctement",
      ["Correspondance lettres/sons.","Syllabes.","Mots.","Phrases courtes.","Ponctuation."],
      ["Lire des mots étudiés.","Lire une phrase sans deviner les mots.","Respecter la ponctuation."],
      [],[],[]],
    ["Séquence 3 — Comprendre un texte court",
      ["Personnages.","Lieu.","Moment.","Actions principales.","Idée générale."],
      ["Répondre à des questions sur le texte.","Retrouver une information.","Raconter brièvement ce qu'il a compris."],
      [],[],[]],
    ["Séquence 4 — Écrire",
      ["Formation correcte des lettres.","Copie.","Dictée.","Mots et phrases.","Ponctuation."],
      ["Copier sans erreurs majeures.","Écrire des mots sous dictée.","Produire quelques phrases simples."],
      [],[],[]],
    ["Séquence 5 — Produire un petit texte",
      ["Organiser plusieurs phrases.","Utiliser des mots de liaison simples.","Décrire une personne, un objet ou une situation."],
      ["Produire un petit texte cohérent.","Relire et corriger quelques erreurs."],
      [],[],[]]
  ],
  "Mathématiques": [
    ["Séquence 1 — Les nombres",["Lire les nombres.","Écrire les nombres.","Compter.","Comparer.","Ranger."],["Lire et écrire les nombres étudiés.","Comparer deux nombres.","Ranger des nombres dans l'ordre."],[],[],[]],
    ["Séquence 2 — Addition et soustraction",["Sens de l'addition.","Sens de la soustraction.","Calcul posé.","Calcul mental simple."],["Effectuer une addition.","Effectuer une soustraction.","Choisir l'opération adaptée à une situation."],[],[],[]],
    ["Séquence 3 — Résoudre un problème",["Comprendre la situation.","Identifier les informations utiles.","Choisir une opération.","Donner une réponse."],["Lire un problème.","Trouver ce qu'on cherche.","Choisir l'opération.","Écrire une réponse."],[],[],[]],
    ["Séquence 4 — Multiplication",["Addition répétée.","Groupements.","Premières tables."],["Comprendre une situation de multiplication.","Calculer des produits simples."],[],[],[]],
    ["Séquence 5 — Mesures",["Longueur.","Masse.","Temps.","Monnaie."],["Comparer des longueurs.","Utiliser les unités étudiées.","Lire l'heure.","Utiliser des montants simples."],[],[],[]],
    ["Séquence 6 — Géométrie",["Figures géométriques.","Lignes.","Points.","Reproduction de figures."],["Reconnaître une figure.","La nommer.","La reproduire."],[],[],[]]
  ],
  "Éducation scientifique et technologique": [
    ["Séquence 1 — Le corps humain",["Parties du corps.","Organes et fonctions simples.","Hygiène."],["Nommer les principales parties du corps.","Expliquer quelques règles d'hygiène."],[],[],[]],
    ["Séquence 2 — Alimentation et santé",["Aliments.","Alimentation équilibrée.","Hygiène alimentaire."],["Reconnaître différents aliments.","Distinguer de bonnes et mauvaises habitudes alimentaires."],[],[],[]],
    ["Séquence 3 — Les êtres vivants",["Animaux.","Plantes.","Besoins des êtres vivants."],["Identifier un être vivant.","Comparer animal et plante.","Identifier leurs besoins essentiels."],[],[],[]],
    ["Séquence 4 — L'environnement",["Eau.","Air.","Sol.","Protection de l'environnement."],["Identifier quelques éléments de son environnement.","Adopter des comportements simples de protection."],[],[],[]]
  ],
  "Éducation islamique": [
    ["Séquence 1 — Les bonnes valeurs",["Respect.","Honnêteté.","Entraide.","Politesse.","Respect des parents."],["Reconnaître une bonne attitude.","Adopter les comportements étudiés."],[],[],[]],
    ["Séquence 2 — La prière et la propreté",["Importance de la propreté.","Préparation à la prière.","Gestes et comportements étudiés."],["Appliquer les règles de propreté.","Connaître les étapes étudiées."],[],[],[]],
    ["Séquence 3 — Histoires et enseignements",["Récits adaptés au niveau.","Enseignements moraux et religieux."],["Raconter les éléments essentiels.","Identifier la leçon à retenir."],[],[],[]],
    ["Séquence 4 — Mémorisation",["Sourates prévues au programme.","Invocations et formules étudiées."],["Réciter correctement les passages appris."],[],[],[]]
  ],
  "Éducation civique": [
    ["Séquence 1 — Vivre ensemble",["Respect.","Tolérance.","Entraide.","Écoute."],["Respecter les autres.","Coopérer avec ses camarades."],[],[],[]],
    ["Séquence 2 — Les règles de l'école",["Règles de la classe.","Responsabilités.","Respect du matériel."],["Respecter les règles.","Prendre soin des équipements."],[],[],[]],
    ["Séquence 3 — Mon environnement",["Quartier.","École.","Espaces publics.","Propreté."],["Respecter les espaces communs.","Participer à leur protection."],[],[],[]]
  ],
  "Éducation artistique": [
    ["Séquence 1 — Dessin et formes",["Lignes.","Formes.","Motifs.","Organisation de l'espace."],["Reproduire une forme.","Créer un dessin simple."],[],[],[]],
    ["Séquence 2 — Couleurs",["Couleurs.","Mélanges.","Contrastes simples."],["Identifier les couleurs.","Utiliser les couleurs pour réaliser une production."],[],[],[]],
    ["Séquence 3 — Création",["Imaginer.","Composer.","Décorer."],["Réaliser une production personnelle."],[],[],[]]
  ],
  "Éducation physique": [
    ["Séquence 1 — Courir et se déplacer",["Courir.","Accélérer.","Ralentir.","Changer de direction."],[],[],[],[]],
    ["Séquence 2 — Sauter",["Sauter.","Réceptionner.","Enchaîner plusieurs mouvements."],[],[],[],[]],
    ["Séquence 3 — Lancer",["Lancer avec précision.","Lancer à distance.","Attraper."],[],[],[],[]],
    ["Séquence 4 — Jouer ensemble",["Respecter les règles.","Attendre son tour.","Coopérer.","Accepter le résultat."],[],[],[],[]]
  ]
},

"3AP": {
  "Arabe": [
    ["Séquence 1 — Lire et comprendre un texte court",
      ["Lire des mots et des phrases.","Comprendre le vocabulaire du texte.","Identifier le sujet du texte.","Repérer les informations importantes."],
      ["Lire à voix haute.","Répondre à des questions.","Retrouver une information dans le texte.","Dire avec ses propres mots ce qu'il a compris."],
      [],
      ["Questions orales.","Questions écrites.","Lecture individuelle."],
      ["Relire un passage court.","Expliquer le vocabulaire.","Poser des questions plus simples."]],
    ["Séquence 2 — Enrichir son vocabulaire",
      ["Mots nouveaux.","Synonymes simples.","Contraires.","Familles de mots.","Vocabulaire lié au thème étudié."],
      ["Expliquer un mot.","Employer un nouveau mot dans une phrase.","Trouver un contraire ou un mot de même sens."],
      [],[],[]],
    ["Séquence 3 — Construire une phrase",
      ["Phrase simple.","Sujet.","Verbe.","Compléments.","Ponctuation."],
      ["Identifier les éléments d'une phrase.","Construire une phrase correcte.","Transformer une phrase simple."],
      [],[],[]],
    ["Séquence 4 — Grammaire et conjugaison",
      ["Nom.","Verbe.","Adjectif.","Singulier/pluriel.","Masculin/féminin.","Temps étudiés."],
      ["Identifier les mots.","Accorder les mots.","Conjuguer les verbes étudiés.","Utiliser correctement les formes apprises."],
      [],[],[]],
    ["Séquence 5 — Écrire un texte",
      ["Organiser plusieurs phrases.","Utiliser un vocabulaire adapté.","Respecter la ponctuation.","Relier les idées."],
      ["Décrire.","Raconter.","Produire un petit texte cohérent.","Relire et corriger."],
      [],[],[]]
  ],
  "Anglais": [
    ["Séquence 1 — Se présenter",["Hello / Goodbye.","Name.","Age.","Simple classroom expressions."],["Saluer.","Dire son nom.","Dire son âge.","Comprendre des consignes très simples."],[],[],[]],
    ["Séquence 2 — La classe",["Book.","Pen.","Pencil.","Bag.","Desk.","Chair.","Classroom commands."],["Reconnaître le vocabulaire.","Comprendre une consigne.","Nommer les objets."],[],[],[]],
    ["Séquence 3 — Les nombres et les couleurs",["Numbers.","Basic colours."],["Compter.","Identifier une couleur.","Répondre à une question simple."],[],[],[]],
    ["Séquence 4 — La famille",["Mother.","Father.","Brother.","Sister.","Family vocabulary."],["Nommer les membres de la famille.","Présenter simplement sa famille."],[],[],[]],
    ["Séquence 5 — Le corps",["Head.","Hand.","Eye.","Ear.","Nose.","Mouth.","Other basic body vocabulary."],["Montrer une partie du corps.","La nommer.","Comprendre une consigne simple."],[],[],[]]
  ],
  "Mathématiques": [
    ["Séquence 1 — Les nombres",["Lire et écrire les nombres étudiés.","Comparer.","Ranger.","Décomposer les nombres."],["Lire un nombre.","L'écrire.","Le comparer à un autre.","Le décomposer."],[],[],[]],
    ["Séquence 2 — Addition et soustraction",["Calcul mental.","Addition posée.","Soustraction posée.","Situations d'addition et de soustraction."],["Poser correctement une opération.","Calculer.","Choisir l'opération adaptée."],[],[],[]],
    ["Séquence 3 — Multiplication",["Sens de la multiplication.","Tables étudiées.","Multiplication posée selon le niveau."],["Utiliser les tables.","Résoudre une situation multiplicative.","Effectuer les calculs étudiés."],[],[],[]],
    ["Séquence 4 — Division et partage",["Partage équitable.","Groupements.","Division dans les situations adaptées au niveau."],["Partager une quantité.","Résoudre un problème de partage."],[],[],[]],
    ["Séquence 5 — Problèmes",["Lire une situation.","Chercher les informations utiles.","Choisir une opération.","Vérifier la réponse."],["Comprendre ce qu'on lui demande.","Choisir une stratégie.","Donner une réponse complète."],[],[],[]],
    ["Séquence 6 — Mesures",["Longueur.","Masse.","Contenance.","Temps.","Monnaie."],["Mesurer.","Comparer.","Utiliser les unités étudiées.","Résoudre des situations de mesure."],[],[],[]],
    ["Séquence 7 — Géométrie",["Figures.","Droites et segments.","Alignement.","Reproduction de figures."],["Reconnaître les figures.","Les décrire.","Les reproduire avec les instruments adaptés."],[],[],[]]
  ],
  "Sciences et technologie": [
    ["Séquence 1 — Le corps humain",["Principales parties du corps.","Organes étudiés.","Fonctions essentielles."],["Identifier les parties étudiées.","Expliquer simplement leur rôle."],[],[],[]],
    ["Séquence 2 — Alimentation et santé",["Différents aliments.","Besoins du corps.","Équilibre alimentaire.","Hygiène."],["Classer des aliments.","Identifier de bonnes habitudes.","Expliquer quelques règles de santé."],[],[],[]],
    ["Séquence 3 — Les êtres vivants",["Animaux.","Plantes.","Caractéristiques des êtres vivants.","Besoins."],["Observer.","Classer.","Comparer."],[],[],[]],
    ["Séquence 4 — L'environnement",["Eau.","Air.","Sol.","Pollution.","Protection de l'environnement."],["Identifier une situation de pollution.","Proposer un comportement respectueux de l'environnement."],[],[],[]]
  ],
  "Éducation islamique": [
    ["Séquence 1 — Les comportements du musulman",["Respect.","Honnêteté.","Bonté.","Entraide.","Respect des parents."],["Reconnaître les bons comportements.","Les appliquer dans la vie quotidienne."],[],[],[]],
    ["Séquence 2 — La prière",["Importance de la prière.","Préparation.","Étapes étudiées."],["Connaître les éléments étudiés.","Respecter les règles apprises."],[],[],[]],
    ["Séquence 3 — Le Prophète ﷺ",["Épisodes adaptés à l'âge.","Valeurs et enseignements."],["Raconter les éléments essentiels.","Identifier la valeur enseignée."],[],[],[]],
    ["Séquence 4 — Sourates et invocations",["Sourates prévues.","Invocations prévues.","Prononciation."],["Réciter les textes appris correctement."],[],[],[]]
  ],
  "Éducation civique": [
    ["Séquence 1 — Mes droits et mes devoirs",["Respect.","Responsabilité.","Règles de vie collective."],["Identifier un droit et un devoir.","Respecter les règles."],[],[],[]],
    ["Séquence 2 — La vie en groupe",["Coopération.","Dialogue.","Respect des différences."],["Travailler avec les autres.","Résoudre un petit désaccord par le dialogue."],[],[],[]],
    ["Séquence 3 — Protéger son environnement",["Propreté.","Espaces publics.","Protection de la nature."],["Adopter un comportement responsable."],[],[],[]]
  ],
  "Éducation artistique": [
    ["Séquence 1 — Dessin et représentation",["Observer.","Reproduire.","Dessiner des formes et objets simples."],[],[],[],[]],
    ["Séquence 2 — Couleurs",["Couleurs.","Mélanges.","Contrastes."],[],[],[],[]],
    ["Séquence 3 — Création artistique",["Imaginer.","Composer.","Réaliser une production personnelle."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["Séquence 1 — Courir",["Courir vite.","Courir longtemps.","Contrôler son effort."],[],[],[],[]],
    ["Séquence 2 — Sauter",["Sauter.","Se réceptionner.","Enchaîner les mouvements."],[],[],[],[]],
    ["Séquence 3 — Lancer et attraper",["Lancer avec précision.","Attraper.","Coopérer."],[],[],[],[]],
    ["Séquence 4 — Jeux collectifs",["Respecter les règles.","Se déplacer.","Coopérer.","Respecter les autres."],[],[],[],[]]
  ]
},

"4AP": {
  "Arabe": [
    ["Séquence 1 — Comprendre un texte et retrouver les informations",
      ["Lire un texte.","Comprendre les mots importants.","Identifier qui, où, quand et quoi.","Distinguer les informations importantes."],
      ["Lire correctement.","Répondre aux questions.","Retrouver une information dans le texte.","Résumer oralement ce qu'il a compris."],
      [],
      ["Questions de compréhension.","Lecture individuelle.","Reformulation orale."],
      ["Découper le texte en petits passages.","Expliquer les mots difficiles.","Reprendre avec des questions simples."]],
    ["Séquence 2 — Le vocabulaire",
      ["Mots nouveaux.","Synonymes.","Contraires.","Familles de mots.","Vocabulaire lié au thème."],
      ["Expliquer un mot.","Trouver un mot de même sens ou de sens contraire.","Employer le nouveau vocabulaire dans une phrase."],
      [],[],[]],
    ["Séquence 3 — La phrase",
      ["Phrase déclarative.","Phrase interrogative.","Sujet.","Verbe.","Compléments.","Ponctuation."],
      ["Reconnaître une phrase.","Identifier ses éléments.","Construire une phrase correcte.","Transformer une phrase simple."],
      [],[],[]],
    ["Séquence 4 — Grammaire et conjugaison",
      ["Nom.","Déterminant.","Adjectif.","Verbe.","Singulier/pluriel.","Masculin/féminin.","Temps étudiés."],
      ["Identifier les différentes catégories de mots.","Faire les accords.","Conjuguer les verbes étudiés.","Utiliser correctement les formes apprises."],
      [],[],[]],
    ["Séquence 5 — Produire un texte",
      ["Organiser les idées.","Construire plusieurs phrases liées.","Utiliser la ponctuation.","Relire son travail."],
      ["Décrire.","Raconter.","Produire un texte court organisé.","Corriger ses erreurs simples."],
      [],[],[]]
  ],
  "Français": [
    ["Séquence 1 — Se présenter et communiquer",["Bonjour / au revoir.","Se présenter.","Dire son nom.","Dire son âge.","Poser des questions simples.","Répondre simplement."],["Saluer.","Se présenter.","Poser une question simple.","Répondre à son camarade."],[],[],[]],
    ["Séquence 2 — Comprendre une consigne",["Écouter.","Identifier une action.","Comprendre les consignes de classe."],["Comprendre : écoute, répète, lis, écris, regarde, souligne, entoure…","Exécuter une consigne simple."],[],[],[]],
    ["Séquence 3 — Lire des mots et des phrases",["Lettres et sons.","Syllabes.","Mots.","Phrases courtes.","Ponctuation."],["Lire un mot.","Lire une phrase.","Identifier les mots connus.","Respecter la ponctuation."],[],[],[]],
    ["Séquence 4 — Comprendre un petit texte",["Personnages.","Lieu.","Actions.","Informations essentielles."],["Comprendre un texte court.","Répondre à des questions.","Retrouver une information."],[],[],[]],
    ["Séquence 5 — Construire des phrases",["Nom.","Verbe.","Sujet.","Déterminant.","Adjectif simple.","Ponctuation."],["Construire une phrase simple.","Remettre des mots dans l'ordre.","Compléter une phrase."],[],[],[]],
    ["Séquence 6 — Écrire",["Copier.","Écrire des mots.","Écrire des phrases.","Produire un petit texte."],["Copier correctement.","Écrire sous dictée des mots étudiés.","Produire quelques phrases."],[],[],[]]
  ],
  "Anglais": [
    ["Séquence 1 — Greetings and introductions",["Hello.","Good morning.","Goodbye.","My name is…","What is your name?","How are you?"],["Saluer.","Dire son nom.","Demander le nom d'une personne.","Répondre simplement."],[],[],[]],
    ["Séquence 2 — Numbers and age",["Nombres.","Age.","How old are you?"],["Compter.","Dire son âge.","Demander l'âge."],[],[],[]],
    ["Séquence 3 — Colours and classroom objects",["Couleurs.","School bag.","Book.","Pen.","Pencil.","Ruler.","Chair.","Desk."],["Nommer les objets.","Identifier une couleur.","Comprendre une consigne simple."],[],[],[]],
    ["Séquence 4 — Family",["Mother.","Father.","Brother.","Sister.","Family."],["Nommer les membres de sa famille.","Présenter simplement sa famille."],[],[],[]],
    ["Séquence 5 — Body",["Head.","Eyes.","Ears.","Nose.","Mouth.","Hands.","Legs."],["Montrer une partie du corps.","La nommer.","Comprendre une instruction simple."],[],[],[]]
  ],
  "Mathématiques": [
    ["Séquence 1 — Nombres et numération",["Lire et écrire les nombres.","Décomposer.","Comparer.","Ranger."],["Lire un nombre.","L'écrire.","Le décomposer.","Le comparer."],[],[],[]],
    ["Séquence 2 — Addition et soustraction",["Calcul mental.","Calcul posé.","Situations additives et soustractives."],["Poser une opération.","Calculer correctement.","Choisir l'opération adaptée."],[],[],[]],
    ["Séquence 3 — Multiplication",["Tables.","Multiplication.","Situations multiplicatives."],["Utiliser les tables.","Effectuer une multiplication.","Résoudre un problème simple."],[],[],[]],
    ["Séquence 4 — Division",["Partage.","Groupement.","Division."],["Comprendre une situation de partage.","Effectuer les calculs étudiés.","Vérifier son résultat."],[],[],[]],
    ["Séquence 5 — Problèmes",["Comprendre la question.","Rechercher les données utiles.","Choisir l'opération.","Vérifier le résultat."],["Résoudre un problème.","Expliquer comment il a trouvé la réponse."],[],[],[]],
    ["Séquence 6 — Mesures",["Longueur.","Masse.","Contenance.","Temps.","Monnaie."],["Mesurer.","Comparer.","Convertir les unités étudiées.","Résoudre une situation de mesure."],[],[],[]],
    ["Séquence 7 — Géométrie",["Droite.","Segment.","Figures géométriques.","Angles simples.","Symétrie selon les apprentissages du niveau."],["Reconnaître.","Décrire.","Reproduire une figure.","Utiliser correctement les instruments."],[],[],[]]
  ],
  "Sciences et technologie": [
    ["Séquence 1 — Le corps et la santé",["Organes.","Fonctionnement simple du corps.","Hygiène.","Alimentation."],["Identifier les éléments étudiés.","Expliquer des règles simples de santé."],[],[],[]],
    ["Séquence 2 — Les êtres vivants",["Animaux.","Plantes.","Reproduction et développement selon les notions étudiées.","Besoins des êtres vivants."],["Observer.","Comparer.","Classer."],[],[],[]],
    ["Séquence 3 — L'eau",["Utilisations de l'eau.","Importance de l'eau.","Économie et protection de l'eau."],["Identifier les usages de l'eau.","Expliquer pourquoi il faut la préserver."],[],[],[]],
    ["Séquence 4 — L'environnement",["Pollution.","Déchets.","Protection de la nature."],["Identifier une pollution.","Proposer des comportements responsables."],[],[],[]]
  ],
  "Éducation islamique": [
    ["Séquence 1 — Les valeurs islamiques",["Respect.","Honnêteté.","Entraide.","Respect des parents.","Bonne conduite."],[],[],[],[]],
    ["Séquence 2 — La prière",["Propreté.","Préparation.","Étapes étudiées.","Respect de la prière."],[],[],[],[]],
    ["Séquence 3 — Le Prophète ﷺ",["Récits adaptés au niveau.","Valeurs.","Enseignements."],[],[],[],[]],
    ["Séquence 4 — Coran et invocations",["Sourates prévues.","Mémorisation.","Prononciation.","Invocations étudiées."],[],[],[],[]]
  ],
  "Éducation civique": [
    ["Séquence 1 — Droits et devoirs",["Mes droits.","Mes devoirs.","Respect des règles."],[],[],[],[]],
    ["Séquence 2 — Vivre ensemble",["Respect.","Tolérance.","Coopération.","Dialogue."],[],[],[],[]],
    ["Séquence 3 — Citoyenneté et environnement",["Respect des espaces publics.","Propreté.","Protection de l'environnement."],[],[],[],[]]
  ],
  "Éducation artistique": [
    ["Séquence 1 — Dessin et observation",["Observer.","Reproduire.","Représenter."],[],[],[],[]],
    ["Séquence 2 — Couleurs et composition",["Couleurs.","Mélanges.","Organisation de l'espace."],[],[],[],[]],
    ["Séquence 3 — Création",["Imaginer.","Composer.","Réaliser une production personnelle."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["Séquence 1 — Courir",["Vitesse.","Endurance.","Contrôle de l'effort."],[],[],[],[]],
    ["Séquence 2 — Sauter",["Impulsion.","Saut.","Réception."],[],[],[],[]],
    ["Séquence 3 — Lancer",["Précision.","Distance.","Coordination."],[],[],[],[]],
    ["Séquence 4 — Jeux collectifs",["Règles.","Coopération.","Déplacement.","Respect des autres."],[],[],[],[]]
  ]
},

"5AP": {
  "Arabe": [
    ["Séquence 1 — Comprendre un texte",
      ["Lire un texte avec fluidité.","Comprendre le vocabulaire.","Identifier le thème.","Repérer les informations importantes.","Distinguer les idées principales et secondaires."],
      ["Lire à voix haute.","Répondre à des questions.","Justifier une réponse par le texte.","Reformuler ce qu'il a compris."],
      [],["Questions de compréhension.","Lecture individuelle.","Reformulation."],
      ["Découper le texte.","Expliquer le vocabulaire.","Revenir aux informations essentielles."]],
    ["Séquence 2 — Enrichir le vocabulaire",["Synonymes.","Contraires.","Familles de mots.","Expressions.","Vocabulaire spécifique au thème."],["Expliquer un mot.","Trouver un synonyme ou un contraire.","Utiliser un mot nouveau dans une phrase."],[],[],[]],
    ["Séquence 3 — Grammaire",["Nature des mots.","Fonction des mots.","Types de phrases.","Accords.","Groupe nominal.","Sujet et verbe."],["Identifier les éléments d'une phrase.","Faire les accords.","Transformer une phrase.","Construire une phrase correcte."],[],[],[]],
    ["Séquence 4 — Conjugaison",["Présent.","Passé.","Futur.","Verbes étudiés.","Terminaisons."],["Identifier le temps.","Conjuguer les verbes étudiés.","Employer le bon temps dans une phrase."],[],[],[]],
    ["Séquence 5 — Orthographe",["Orthographe des mots étudiés.","Accords.","Homophones étudiés.","Ponctuation."],["Écrire correctement les mots.","Faire les accords.","Se relire et corriger ses erreurs."],[],[],[]],
    ["Séquence 6 — Produire un texte",["Organiser les idées.","Construire un paragraphe.","Utiliser des connecteurs.","Introduire et terminer un texte."],["Raconter.","Décrire.","Expliquer.","Produire un texte cohérent.","Relire et améliorer son travail."],[],[],[]]
  ],
  "Français": [
    ["Séquence 1 — Comprendre et communiquer à l'oral",["Écouter un message.","Comprendre une situation.","Identifier les informations importantes.","Utiliser des expressions courantes."],["Comprendre une intervention simple.","Répondre correctement.","Prendre la parole.","Poser une question."],[],["Comprendre une intervention simple.","Répondre correctement."],["Parler plus simplement.","Montrer un exemple puis refaire avec l'élève."]],
    ["Séquence 2 — Lire et comprendre",["Lire avec fluidité.","Comprendre le vocabulaire.","Identifier le thème.","Repérer les informations importantes."],["Lire un texte.","Répondre à des questions.","Justifier une réponse.","Reformuler."],[],[],[]],
    ["Séquence 3 — Vocabulaire",["Synonymes.","Contraires.","Familles de mots.","Expressions.","Champ lexical."],["Comprendre un mot dans son contexte.","Employer un vocabulaire plus précis.","Réutiliser les mots appris."],[],[],[]],
    ["Séquence 4 — Grammaire",["Phrase.","Sujet.","Verbe.","Compléments.","Nom.","Déterminant.","Adjectif.","Types de phrases."],["Identifier les éléments d'une phrase.","Construire une phrase correcte.","Transformer une phrase."],[],[],[]],
    ["Séquence 5 — Conjugaison",["Présent.","Futur.","Passé composé.","Verbes fréquents."],["Conjuguer les verbes étudiés.","Choisir le temps adapté.","Employer correctement le verbe dans une phrase."],[],[],[]],
    ["Séquence 6 — Orthographe",["Accords dans le groupe nominal.","Accord sujet/verbe.","Mots fréquents.","Homophones étudiés.","Ponctuation."],["Écrire une phrase correctement.","Se relire.","Corriger ses erreurs."],[],[],[]],
    ["Séquence 7 — Production écrite",["Organiser un texte.","Faire un paragraphe.","Utiliser des connecteurs.","Relire et corriger."],["Raconter.","Décrire.","Donner des informations.","Produire un texte organisé."],[],[],[]]
  ],
  "Anglais": [
    ["Séquence 1 — Introduce yourself",["Greetings.","Name.","Age.","Personal information."],["Se présenter.","Poser des questions simples.","Répondre."],[],[],[]],
    ["Séquence 2 — Family and friends",["Family members.","Friend.","Basic descriptions."],["Présenter quelqu'un.","Dire qui est une personne.","Donner quelques informations simples."],[],[],[]],
    ["Séquence 3 — Daily activities",["Get up.","Eat.","Go to school.","Study.","Play.","Sleep."],["Décrire simplement sa journée.","Comprendre une routine."],[],[],[]],
    ["Séquence 4 — Food",["Foods.","Drinks.","Likes / dislikes."],["Dire ce qu'il aime ou n'aime pas.","Demander ce qu'une personne aime."],[],[],[]],
    ["Séquence 5 — Home and school",["Rooms.","Furniture.","School vocabulary.","Basic prepositions."],["Décrire simplement une pièce.","Situer un objet."],[],[],[]],
    ["Séquence 6 — Weather and seasons",["Sunny.","Rainy.","Windy.","Hot / cold.","Seasons."],["Décrire le temps.","Nommer les saisons.","Répondre à une question simple sur la météo."],[],[],[]]
  ],
  "Mathématiques": [
    ["Séquence 1 — Nombres et numération",["Lire et écrire les nombres.","Valeur des chiffres.","Décomposer.","Comparer.","Ranger."],["Lire un grand nombre.","Le décomposer.","Le comparer.","Le ranger."],[],[],[]],
    ["Séquence 2 — Opérations",["Addition.","Soustraction.","Multiplication.","Division.","Calcul mental."],["Poser les opérations.","Calculer correctement.","Choisir l'opération adaptée."],[],[],[]],
    ["Séquence 3 — Fractions et nombres décimaux",["Partage.","Fraction simple.","Écriture décimale.","Comparaison."],["Lire une fraction simple.","Représenter une fraction.","Lire et comparer des nombres décimaux."],[],[],[]],
    ["Séquence 4 — Problèmes",["Comprendre la situation.","Sélectionner les données utiles.","Choisir une stratégie.","Vérifier le résultat."],["Résoudre un problème en plusieurs étapes.","Expliquer son raisonnement."],[],[],[]],
    ["Séquence 5 — Mesures",["Longueurs.","Masses.","Contenances.","Durées.","Monnaie."],["Convertir les unités étudiées.","Comparer des mesures.","Résoudre des problèmes de mesure."],[],[],[]],
    ["Séquence 6 — Géométrie",["Droites.","Segments.","Angles.","Figures.","Symétrie.","Périmètre selon les notions étudiées."],["Construire une figure.","Utiliser les instruments.","Calculer les mesures étudiées."],[],[],[]]
  ],
  "Sciences et technologie": [
    ["Séquence 1 — Le corps humain et la santé",["Organes.","Fonctions essentielles.","Hygiène.","Alimentation.","Prévention."],["Identifier les principaux éléments étudiés.","Expliquer les règles essentielles de santé."],[],[],[]],
    ["Séquence 2 — Les êtres vivants",["Caractéristiques des êtres vivants.","Animaux.","Végétaux.","Reproduction et développement selon le programme."],["Observer.","Comparer.","Classer.","Décrire."],[],[],[]],
    ["Séquence 3 — Matière et transformations",["États de la matière.","Changements d'état.","Propriétés simples."],["Identifier un état.","Observer une transformation.","Décrire ce qui change."],[],[],[]],
    ["Séquence 4 — Énergie et objets techniques",["Sources d'énergie.","Utilisation de l'énergie.","Objets techniques du quotidien."],["Identifier une source d'énergie.","Expliquer simplement l'utilisation d'un objet."],[],[],[]],
    ["Séquence 5 — Environnement",["Pollution.","Déchets.","Ressources naturelles.","Protection de l'environnement."],["Identifier un problème environnemental.","Proposer des solutions simples."],[],[],[]]
  ],
  "Éducation islamique": [
    ["Séquence 1 — Foi et comportement",["Valeurs islamiques.","Sincérité.","Respect.","Honnêteté.","Entraide."],["Identifier les comportements conformes aux valeurs étudiées.","Les appliquer dans la vie quotidienne."],[],[],[]],
    ["Séquence 2 — Pratiques religieuses",["Propreté.","Prière.","Jeûne selon les notions du niveau.","Comportements religieux."],["Connaître les règles étudiées.","Les appliquer correctement."],[],[],[]],
    ["Séquence 3 — Vie du Prophète ﷺ",["Épisodes étudiés.","Valeurs et enseignements."],["Raconter les faits essentiels.","Identifier les enseignements."],[],[],[]],
    ["Séquence 4 — Coran et invocations",["Sourates prévues au programme.","Invocations.","Prononciation."],["Réciter les passages étudiés."],[],[],[]]
  ],
  "Histoire": [
    ["Séquence 1 — Se repérer dans le temps",["Avant / après.","Siècle.","Date.","Chronologie."],["Placer un événement sur une ligne du temps.","Classer des événements."],[],[],[]],
    ["Séquence 2 — L'histoire de l'Algérie",["Principales périodes étudiées.","Événements majeurs.","Personnages historiques étudiés."],["Situer les événements.","Identifier les personnages.","Raconter un événement avec les informations essentielles."],[],[],[]],
    ["Séquence 3 — L'Algérie contemporaine",["Éléments historiques étudiés.","Principaux événements.","Repères chronologiques."],["Organiser les événements dans l'ordre.","Expliquer les principales étapes étudiées."],[],[],[]]
  ],
  "Géographie": [
    ["Séquence 1 — Se repérer sur une carte",["Carte.","Légende.","Orientation.","Points cardinaux."],["Lire une carte simple.","Se repérer.","Utiliser une légende."],[],[],[]],
    ["Séquence 2 — L'Algérie",["Localisation.","Relief.","Climat.","Principales régions."],["Localiser l'Algérie.","Identifier les grandes régions.","Lire une carte simple."],[],[],[]],
    ["Séquence 3 — Population et activités",["Population.","Villes.","Agriculture.","Industrie.","Services."],["Identifier les principales activités.","Lire des informations simples sur une carte ou un graphique."],[],[],[]]
  ],
  "Éducation civique": [
    ["Séquence 1 — Citoyen et société",["Droits.","Devoirs.","Responsabilité.","Respect des autres."],["Distinguer droit et devoir.","Adopter un comportement responsable."],[],[],[]],
    ["Séquence 2 — La vie collective",["Règles.","Coopération.","Dialogue.","Résolution des conflits."],["Participer à une activité collective.","Respecter les règles.","Chercher une solution par le dialogue."],[],[],[]],
    ["Séquence 3 — Protection de l'environnement",["Ressources.","Pollution.","Déchets.","Protection."],["Identifier un problème.","Proposer une action concrète."],[],[],[]]
  ],
  "Éducation artistique": [
    ["Séquence 1 — Observer et représenter",["Observer.","Dessiner.","Reproduire.","Organiser l'espace."],[],[],[],[]],
    ["Séquence 2 — Couleurs et techniques",["Couleurs.","Mélanges.","Techniques graphiques.","Composition."],[],[],[],[]],
    ["Séquence 3 — Création artistique",["Imaginer.","Créer.","Présenter une production."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["Séquence 1 — Course",["Vitesse.","Endurance.","Gestion de l'effort."],[],[],[],[]],
    ["Séquence 2 — Sauts",["Impulsion.","Coordination.","Réception."],[],[],[],[]],
    ["Séquence 3 — Lancers",["Précision.","Distance.","Coordination."],[],[],[],[]],
    ["Séquence 4 — Jeux collectifs",["Règles.","Coopération.","Stratégie simple.","Respect des autres."],[],[],[],[]]
  ]
},

"1AM": {
  "Arabe": [
    ["1. Comprendre un texte",
      ["Lire correctement.","Comprendre le sujet du texte.","Repérer les informations importantes.","Comprendre le vocabulaire.","Répondre à des questions sur le texte."],
      ["Lire un texte.","Identifier de quoi il parle.","Retrouver une information précise.","Répondre en utilisant le texte.","Reformuler une idée avec ses propres mots."],
      [],
      ["Questions de compréhension.","Lecture individuelle.","Reformulation orale.","Petit résumé."],
      ["Reprendre le vocabulaire difficile.","Découper le texte en paragraphes.","Faire rechercher les informations une par une.","Poser d'abord des questions simples."]],
    ["2. Le vocabulaire",
      ["Synonymes.","Antonymes.","Familles de mots.","Mots dérivés.","Expressions.","Vocabulaire lié au thème étudié."],
      ["Expliquer un mot dans son contexte.","Trouver un synonyme ou un antonyme.","Utiliser un nouveau mot dans une phrase.","Reconnaître une famille de mots."],
      ["Exercices de classement.","Phrases à compléter.","Recherche de mots dans le texte."],
      [],
      ["Utiliser des exemples concrets et revenir au texte."]],
    ["3. Grammaire",
      ["Reconnaître les différents éléments de la phrase.","Identifier le sujet et le verbe.","Distinguer les types de phrases.","Comprendre les relations entre les mots.","Travailler les accords étudiés."],
      ["Analyser une phrase simple.","Identifier les éléments demandés.","Transformer une phrase.","Construire correctement une phrase."],
      [],
      ["Donner une phrase puis demander à l'élève d'identifier et de justifier."],
      ["Partir de phrases très courtes avant d'aller vers des phrases plus complexes."]],
    ["4. Conjugaison",
      ["Les temps étudiés.","Les formes verbales.","Les terminaisons.","L'utilisation des temps dans une phrase."],
      ["Reconnaître le temps d'un verbe.","Conjuguer les verbes étudiés.","Choisir le temps adapté.","Employer le verbe correctement dans une phrase."],
      ["Conjugaison + phrases à compléter + transformation de phrases."],
      [],
      ["Faire travailler d'abord quelques verbes modèles avant de multiplier les verbes."]],
    ["5. Orthographe",
      ["Règles d'orthographe étudiées.","Accords.","Ponctuation.","Mots fréquents.","Correction des erreurs."],
      ["Écrire correctement.","Repérer une erreur.","Corriger son propre texte."],
      ["Courte dictée, exercice de correction, production écrite."],
      [],
      ["Prendre quelques erreurs réelles de la classe et les corriger collectivement."]],
    ["6. Produire un texte",
      ["Trouver des idées.","Les organiser.","Construire des paragraphes.","Utiliser des connecteurs.","Relire et corriger."],
      ["Rédiger un texte cohérent.","Respecter le sujet.","Organiser ses idées.","Utiliser un vocabulaire adapté.","Corriger certaines erreurs."],
      ["Donner une consigne claire et une petite grille de vérification."],
      [],
      ["Ne pas lui demander immédiatement d'écrire tout le texte. Faire d'abord : 1) trouver les idées ; 2) les classer ; 3) construire quelques phrases ; 4) assembler les phrases."]]
  ],
  "Français": [
    ["1. Comprendre et communiquer à l'oral",
      ["Écouter.","Comprendre une situation de communication.","Identifier les informations importantes.","Prendre la parole.","Respecter les règles de communication."],
      ["Comprendre une consigne.","Répondre clairement.","Raconter ou expliquer quelque chose.","Poser une question."],
      [],["Questions orales, dialogue, reformulation."],
      ["Parler plus simplement, montrer un exemple puis refaire avec l'élève."]],
    ["2. Lire et comprendre",
      ["Lire correctement.","Comprendre le thème.","Repérer les informations.","Comprendre le vocabulaire.","Distinguer les informations essentielles."],
      ["Lire un texte.","Répondre à des questions.","Retrouver une information.","Expliquer une idée du texte."],
      [],["Questions + justification par le texte."],[]],
    ["3. Vocabulaire",["Synonymes.","Antonymes.","Familles de mots.","Mots de même champ lexical.","Sens d'un mot selon le contexte."],["Comprendre un mot.","Trouver un mot proche ou contraire.","Réutiliser le vocabulaire."],[],[],[]],
    ["4. Grammaire",["Phrase.","Sujet.","Verbe.","Compléments.","Groupe nominal.","Types et formes de phrases.","Accords étudiés."],["Identifier les éléments d'une phrase.","Transformer une phrase.","Construire une phrase correcte."],[],[],[]],
    ["5. Conjugaison",["Temps étudiés.","Verbes fréquents.","Formation des temps.","Valeur des temps dans le texte."],["Identifier un temps.","Conjuguer un verbe.","Employer le temps approprié."],[],[],[]],
    ["6. Orthographe",["Accords.","Homophones étudiés.","Pluriel.","Féminin.","Ponctuation.","Orthographe lexicale."],["Écrire correctement.","Repérer ses erreurs.","Se corriger."],[],[],[]],
    ["7. Production écrite",["Comprendre une consigne.","Rechercher des idées.","Organiser un texte.","Construire des paragraphes.","Utiliser des connecteurs.","Relire."],["Rédiger un texte répondant à une consigne.","Organiser ses idées.","Produire des phrases correctes.","Améliorer son texte après correction."],[],[],[]]
  ],
  "Anglais": [
    ["1. Se présenter et présenter quelqu'un",["Nom, âge, origine, goûts, famille.","Questions/réponses simples.","Présentation orale."],[],[],[],[]],
    ["2. La vie scolaire",["Classroom, school subjects, school objects.","Donner et comprendre des consignes simples.","Parler de son école."],[],[],[],[]],
    ["3. La famille et les personnes",["Membres de la famille.","Description physique simple.","Personnalité et goûts."],[],[],[],[]],
    ["4. Les activités quotidiennes",["Se lever, manger, aller à l'école, étudier, jouer, dormir.","Parler de sa journée."],[],[],[],[]],
    ["5. La maison",["Pièces.","Meubles.","Localisation d'objets.","Décrire une pièce."],[],[],[],[]],
    ["6. Alimentation et goûts",["Aliments et boissons.","Like / dislike.","Exprimer une préférence.","Demander ce qu'une personne aime."],[],[],[],
      ["Pour chaque thème, le professeur doit faire travailler écouter → comprendre → répéter → parler → lire → écrire."]]
  ],
  "Mathématiques": [
    ["1. Nombres et calcul",["Nombres entiers.","Comparaison.","Ordre.","Calculs.","Techniques opératoires."],["Lire et écrire les nombres.","Comparer.","Effectuer les calculs.","Choisir une opération adaptée."],[],[],[]],
    ["2. Fractions",["Fraction comme partage.","Numérateur/dénominateur.","Représentation.","Comparaison dans les cas étudiés."],["Lire une fraction.","Représenter une fraction.","Interpréter une fraction dans une situation."],[],[],[]],
    ["3. Problèmes",["Comprendre l'énoncé.","Rechercher les informations utiles.","Choisir une stratégie.","Effectuer les calculs.","Vérifier la réponse."],["Expliquer ce qu'on lui demande.","Choisir l'opération.","Rédiger une réponse."],[],[],["Faire représenter le problème par un dessin, un tableau ou un schéma."]],
    ["4. Mesures",["Longueurs.","Masses.","Capacités.","Durées.","Conversions étudiées."],["Mesurer, comparer, convertir et utiliser les mesures dans un problème."],[],[],[]],
    ["5. Géométrie",["Droites.","Segments.","Angles.","Figures géométriques.","Propriétés étudiées.","Utilisation des instruments."],["Tracer.","Mesurer.","Construire.","Reconnaître une figure.","Utiliser correctement règle, équerre et compas."],[],[],[]]
  ],
  "Sciences et technologie": [
    ["1. Le vivant",["Caractéristiques des êtres vivants.","Animaux.","Végétaux.","Besoins des êtres vivants.","Observation et classification."],[],[],[],[]],
    ["2. Le corps humain et la santé",["Fonctionnement général du corps.","Alimentation.","Hygiène.","Prévention."],[],[],[],[]],
    ["3. L'environnement",["Milieu de vie.","Relations entre êtres vivants.","Ressources naturelles.","Pollution.","Protection de l'environnement."],[],[],[],[]],
    ["4. Matière et transformations",["Propriétés de la matière.","États.","Changements observables.","Expériences simples."],[],[],[],[]],
    ["5. Objets et techniques",["Objets techniques.","Fonctionnement simple.","Utilisation.","Sécurité."],[],[],[],[]]
  ],
  "Éducation islamique": [
    ["1. Foi et comportement",["Valeurs islamiques.","Sincérité.","Respect.","Honnêteté.","Entraide."],[],[],[],[]],
    ["2. Pratiques religieuses",["Purification.","Prière.","Comportements religieux étudiés."],[],[],[],[]],
    ["3. Vie du Prophète ﷺ",["Épisodes étudiés.","Comportements.","Enseignements à retenir."],[],[],[],[]],
    ["4. Coran et invocations",["Sourates prévues.","Mémorisation.","Récitation.","Compréhension des enseignements essentiels."],[],[],[],[]]
  ],
  "Histoire": [
    ["1. Se repérer dans le temps",["Lire une chronologie.","Situer une période.","Distinguer avant/après.","Utiliser les dates et siècles."],[],[],[],[]],
    ["2. Les premières civilisations",["Apparition des premières civilisations.","Organisation des sociétés.","Grandes caractéristiques étudiées."],[],[],[],[]],
    ["3. Les civilisations anciennes",["Principaux repères.","Organisation politique et sociale.","Culture et héritages."],[],
      ["Frise chronologique, carte, questions courtes, classement d'événements."],[],[]]
  ],
  "Géographie": [
    ["1. Lire une carte",["Titre.","Légende.","Orientation.","Échelle.","Localisation."],[],[],[],[]],
    ["2. L'espace géographique",["Relief.","Climat.","Paysages.","Répartition des populations."],[],[],[],[]],
    ["3. L'Algérie",["Situation géographique.","Grands ensembles.","Relief.","Climat.","Population."],
      ["Localiser → lire → décrire → comparer → expliquer simplement."],[],[],[]]
  ],
  "Éducation civique": [
    ["1. L'élève dans la société",["Droits.","Devoirs.","Responsabilité.","Respect des autres."],[],[],[],[]],
    ["2. Vie au collège",["Règlement.","Respect des personnes.","Coopération.","Comportement responsable."],[],[],[],[]],
    ["3. Citoyenneté",["Vivre ensemble.","Dialogue.","Respect des différences.","Participation à la vie collective."],[],[],[],[]]
  ],
  "Éducation artistique": [
    ["1. Observer et représenter",["L'élève apprend à observer puis représenter ce qu'il voit."],[],[],[],[]],
    ["2. Couleurs et composition",["Couleurs.","Formes.","Organisation de l'espace.","Différentes techniques."],[],[],[],[]],
    ["3. Création",["L'élève réalise une production personnelle à partir d'une consigne."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["1. Course",["Courir, gérer son effort, respecter une consigne."],[],[],[],[]],
    ["2. Sauts",["Impulsion, coordination, réception."],[],[],[],[]],
    ["3. Lancers",["Lancer avec précision et contrôler son geste."],[],[],[],[]],
    ["4. Jeux collectifs",["Règles.","Coopération.","Déplacement.","Respect des autres."],[],[],[],[]]
  ]
},

"2AM": {
  "Arabe": [
    ["1. Comprendre un texte",
      ["Lire avec fluidité.","Identifier le thème.","Repérer les idées importantes.","Comprendre les mots difficiles grâce au contexte.","Distinguer les informations essentielles des détails."],
      ["Lire et comprendre un texte.","Répondre à des questions.","Justifier une réponse par le texte.","Reformuler une idée."],
      ["Lecture silencieuse puis orale.","Questions de compréhension.","Recherche d'informations.","Reformulation d'un paragraphe."],
      ["Je demande à l'élève d'expliquer avec ses propres mots ce qu'il a compris."],
      ["Je reprends paragraphe par paragraphe, j'explique le vocabulaire et je pose des questions très simples avant de revenir à la compréhension globale."]],
    ["2. Vocabulaire",
      ["Synonymes.","Antonymes.","Familles de mots.","Mots dérivés.","Champs lexicaux.","Sens d'un mot selon le contexte."],
      ["Expliquer un mot.","Trouver un mot de sens proche ou contraire.","Identifier une famille de mots.","Employer le vocabulaire dans une phrase."],
      ["Classement de mots, recherche dans le texte, phrases à compléter et création de phrases."],
      ["Je donne un mot et demande à l'élève de l'expliquer puis de l'utiliser."],
      ["Je repars d'exemples connus et de situations concrètes."]],
    ["3. Grammaire",
      ["Organisation de la phrase.","Groupes de mots.","Fonctions grammaticales étudiées.","Types et formes de phrases.","Accords.","Transformations de phrases."],
      ["Identifier les éléments d'une phrase.","Expliquer leur rôle.","Transformer une phrase.","Construire une phrase correcte."],
      ["Manipulation de phrases, classement, transformation et production."],
      ["Je donne une phrase inconnue et demande à l'élève de faire l'analyse."],
      ["Je commence par une phrase très courte et j'ajoute progressivement les éléments."]],
    ["4. Conjugaison",
      ["Temps étudiés.","Formes verbales.","Terminaisons.","Emploi des temps dans un texte."],
      ["Reconnaître un temps.","Conjuguer les verbes étudiés.","Choisir le temps adapté.","Réutiliser le verbe dans une phrase."],
      ["Conjugaison, transformations et phrases à compléter."],
      ["Je donne une phrase et demande de changer le temps."],
      ["Je travaille d'abord avec quelques verbes modèles."]],
    ["5. Orthographe",
      ["Accords.","Orthographe des mots.","Homophones étudiés.","Ponctuation.","Correction des erreurs."],
      ["Écrire correctement.","Repérer une erreur.","Expliquer pourquoi elle est incorrecte.","Se corriger."],
      ["Dictée courte, correction collective, phrases à corriger."],[],[]],
    ["6. Production écrite",
      ["Comprendre la consigne.","Chercher des idées.","Organiser les idées.","Construire les paragraphes.","Utiliser des connecteurs.","Relire et corriger."],
      ["Produire un texte organisé, compréhensible et adapté au sujet."],
      ["Avant d'écrire : 1) comprendre le sujet ; 2) chercher les idées ; 3) les classer ; 4) faire un petit plan ; 5) rédiger ; 6) relire."],
      ["Je vérifie séparément : respect du sujet, organisation, vocabulaire, phrases, orthographe."],
      ["Je lui donne un modèle de structure et je construis avec lui les premières phrases."]]
  ],
  "Français": [
    ["1. Compréhension orale",["Comprendre une consigne.","Identifier les personnes, lieux, actions et informations importantes.","Répondre oralement.","Reformuler."],[],[],["Questions, résumé oral, reformulation."],[]],
    ["2. Lecture et compréhension",["Identifier le thème.","Repérer les informations.","Comprendre les relations entre les idées.","Utiliser le contexte pour comprendre le vocabulaire."],["Lire.","Répondre.","Justifier.","Reformuler.","Faire ressortir l'idée principale."],[],[],[]],
    ["3. Vocabulaire",["Synonymes et antonymes.","Familles de mots.","Dérivation.","Champ lexical.","Sens propre et sens figuré selon les notions étudiées."],["Choisir le mot approprié et l'utiliser correctement."],[],[],[]],
    ["4. Grammaire",["Phrase simple et phrase complexe.","Groupes et fonctions.","Types et formes de phrases.","Expansions du nom.","Accords.","Transformations."],["Analyser.","Transformer.","Enrichir.","Produire des phrases correctes."],[],[],[]],
    ["5. Conjugaison",["Temps étudiés.","Verbes réguliers et irréguliers fréquents.","Valeurs des temps dans les textes."],["Reconnaître.","Conjuguer.","Choisir.","Réutiliser."],[],[],[]],
    ["6. Orthographe",["Accords dans le groupe nominal.","Accord sujet/verbe.","Homophones étudiés.","Ponctuation.","Orthographe lexicale."],[],[],["Courte dictée + correction expliquée."],[]],
    ["7. Production écrite",["Passer de « j'ai des idées » à « je construis un texte organisé »."],[],["Méthode : Sujet → idées → classement → plan → rédaction → relecture → correction."],[],[]]
  ],
  "Anglais": [
    ["1. Daily life",["Activités quotidiennes.","Horaires.","Habitudes.","Parler de sa journée."],[],[],[],[]],
    ["2. Hobbies and free time",["Sports.","Jeux.","Musique.","Activités.","Exprimer ses préférences."],[],[],[],[]],
    ["3. Describing people",["Apparence.","Vêtements.","Personnalité.","Présenter une personne."],[],[],[],[]],
    ["4. Places and directions",["Lieux de la ville.","Demander son chemin.","Indiquer une direction.","Situer un endroit."],[],[],[],[]],
    ["5. Food and shopping",["Aliments.","Quantités.","Prix.","Demander quelque chose.","Exprimer ses goûts."],[],[],[],[]],
    ["6. Weather and environment",["Météo.","Saisons.","Environnement.","Décrire une situation simple."],[],[],[],
      ["Pour chaque séquence : écouter → comprendre → répéter → parler → lire → écrire."]]
  ],
  "Mathématiques": [
    ["1. Nombres et calcul",["Nombres.","Comparaison et ordre.","Calcul numérique.","Priorités de calcul selon les notions étudiées."],["Calculer correctement et expliquer les étapes."],[],[],[]],
    ["2. Fractions et nombres décimaux",["Représentation.","Comparaison.","Opérations étudiées.","Passage entre différentes représentations."],["Lire, représenter, comparer et calculer dans les situations étudiées."],[],[],["Utiliser des dessins, parts, droite graduée et exemples concrets."]],
    ["3. Proportionnalité",["Reconnaître une situation proportionnelle.","Utiliser un tableau.","Rechercher une valeur inconnue.","Résoudre des problèmes simples."],["Identifier une situation de proportionnalité et choisir une méthode de résolution."],[],[],[]],
    ["4. Problèmes",[],[],["Méthode : Je lis → je comprends → je cherche les données utiles → je choisis une méthode → je calcule → je vérifie → je rédige. Le professeur doit éviter de donner immédiatement l'opération."],[],[]],
    ["5. Géométrie",["Constructions.","Droites et segments.","Angles.","Figures.","Propriétés.","Symétrie et constructions selon les notions étudiées."],["Utiliser correctement les instruments et justifier une construction."],[],[],[]],
    ["6. Grandeurs et mesures",["Longueurs.","Masses.","Capacités.","Durées.","Conversions.","Problèmes de mesure."],[],[],[],[]]
  ],
  "Sciences et technologie": [
    ["1. Les êtres vivants",["Observer.","Décrire.","Comparer.","Classer.","Identifier les besoins des êtres vivants."],[],[],[],[]],
    ["2. Le corps humain et la santé",["Fonctions du corps.","Alimentation.","Hygiène.","Prévention.","Comportements favorables à la santé."],[],[],[],[]],
    ["3. L'environnement",["Milieux de vie.","Ressources.","Pollution.","Interactions entre êtres vivants et milieu.","Protection de l'environnement."],[],[],[],[]],
    ["4. Matière et transformations",["Propriétés.","États.","Transformations.","Observations et expériences."],[],[],[],[]],
    ["5. Objets techniques",["Fonctionnement.","Matériaux.","Énergie.","Utilisation.","Sécurité."],[],[],[],
      ["Méthode scientifique à faire pratiquer : Je me pose une question → je formule une hypothèse → j'observe/expérimente → je note → je conclus."]]
  ],
  "Éducation islamique": [
    ["1. Foi et valeurs",["Foi.","Sincérité.","Responsabilité.","Respect.","Entraide."],[],[],[],[]],
    ["2. Pratiques religieuses",["Purification.","Prière.","Comportements et règles étudiés."],[],[],[],[]],
    ["3. Vie du Prophète ﷺ",["Événements étudiés.","Comportements.","Enseignements."],[],[],[],[]],
    ["4. Coran et invocations",["Mémorisation.","Récitation.","Compréhension des enseignements essentiels."],[],[],["Le professeur vérifie à la fois la mémorisation et la compréhension."],[]]
  ],
  "Histoire": [
    ["1. Lire et construire une chronologie",["Situer une période.","Utiliser les dates.","Classer les événements.","Lire une frise."],[],[],[],[]],
    ["2. Les grandes périodes historiques",["Pour chaque période : à apprendre → événements principaux → personnages importants → repères chronologiques → ce qu'il faut retenir."],[],[],[],[]],
    ["3. L'histoire de l'Algérie",["Comprendre les principaux repères historiques étudiés et leur chronologie."],[],["Frise, carte, document historique, questions, petit récit chronologique."],[],[]]
  ],
  "Géographie": [
    ["1. Lire une carte",["Titre.","Légende.","Orientation.","Échelle.","Figurés."],[],[],[],[]],
    ["2. Territoires et populations",["Répartition de la population.","Espaces urbains et ruraux.","Activités humaines.","Lecture de cartes et documents."],[],[],[],[]],
    ["3. L'Algérie",["Territoires.","Relief.","Climat.","Population.","Activités économiques selon les thèmes étudiés."],
      ["Méthode : Localiser → observer → décrire → comparer → expliquer."],[],[],[]]
  ],
  "Éducation civique": [
    ["1. Droits et devoirs",["Ce qu'il a le droit de faire.","Ce qu'il doit faire.","Les conséquences d'un comportement."],[],[],[],[]],
    ["2. Vie collective",["Règles.","Dialogue.","Coopération.","Respect.","Résolution pacifique des désaccords."],[],[],[],[]],
    ["3. Citoyenneté",["Responsabilité.","Participation.","Respect des biens communs.","Protection de l'environnement."],[],
      ["Donner une situation réelle ou fictive et demander : « Que doit faire le citoyen ? Pourquoi ? »"],[],[]]
  ],
  "Éducation artistique": [
    ["1. Observer et représenter",["Formes.","Proportions.","Observation.","Représentation."],[],[],[],[]],
    ["2. Couleurs et techniques",["Mélanges.","Contrastes.","Composition.","Différentes techniques."],[],[],[],[]],
    ["3. Création",["L'élève réalise une production personnelle à partir d'une consigne."],[],[],["Le professeur vérifie autant la démarche que le résultat final."],[]]
  ],
  "Éducation physique": [
    ["1. Course",["Vitesse.","Endurance.","Gestion de l'effort."],[],[],[],[]],
    ["2. Sauts",["Impulsion.","Coordination.","Réception."],[],[],[],[]],
    ["3. Lancers",["Précision.","Puissance.","Coordination."],[],[],[],[]],
    ["4. Jeux collectifs",["Règles.","Déplacements.","Coopération.","Stratégie simple.","Respect des partenaires et adversaires."],[],[],[],[]]
  ]
},

"3AM": {
  "Arabe": [
    ["1. Comprendre et analyser un texte",
      ["Identifier le thème et le type de texte.","Repérer les idées essentielles.","Comprendre les relations entre les idées.","Interpréter les informations.","Comprendre le vocabulaire dans son contexte."],
      ["Expliquer le contenu du texte.","Retrouver une information.","Justifier une réponse.","Résumer une partie du texte.","Donner une interprétation simple."],
      ["Lecture silencieuse.","Lecture expressive.","Questions.","Recherche de mots-clés.","Classement des idées.","Résumé."],
      ["Je lui demande de répondre et de justifier sa réponse par le texte."],
      ["Je découpe le texte, j'explique le vocabulaire indispensable et je reconstruis progressivement le sens."]],
    ["2. Vocabulaire",["Synonymes et antonymes.","Familles de mots.","Dérivation.","Champs lexicaux.","Expressions.","Sens propre et figuré selon les notions étudiées."],["Déduire le sens d'un mot.","Choisir le mot approprié.","Enrichir une phrase.","Réutiliser le vocabulaire dans une production."],["Prendre 5 à 10 mots nouveaux du texte et demander aux élèves de les réutiliser dans leurs propres phrases."],[],[]],
    ["3. Grammaire",["Structure de la phrase.","Fonctions grammaticales étudiées.","Types et formes de phrases.","Relations entre les groupes de mots.","Accords.","Enrichissement et transformation des phrases."],["Analyser.","Transformer.","Corriger.","Produire des phrases correctement construites."],[],[],["Revenir à une phrase simple puis ajouter progressivement les éléments."]],
    ["4. Conjugaison",["Temps étudiés.","Formes verbales.","Emploi des temps.","Concordance dans les productions."],["Identifier un temps.","Conjuguer.","Choisir le temps adapté.","Modifier une phrase en changeant le temps."],[],["Ne pas se limiter à « conjugue le verbe ». Faire également utiliser le verbe dans une phrase."],[]],
    ["5. Orthographe",["Accords.","Règles étudiées.","Homophones.","Ponctuation.","Orthographe lexicale."],["Écrire.","Détecter une erreur.","Expliquer la correction.","Se relire."],["Donner volontairement un petit texte contenant des erreurs et demander à l'élève de les trouver et de les corriger."],[],[]],
    ["6. Production écrite",[],["Respecter une consigne.","Organiser plusieurs paragraphes.","Utiliser des connecteurs.","Développer une idée.","Relire et améliorer son texte."],["Méthode : Comprendre le sujet → chercher les idées → les classer → faire un plan → rédiger → relire → corriger."],[],["Ne pas lui donner directement le texte. Construire d'abord avec lui le plan et quelques idées."]]
  ],
  "Français": [
    ["1. Compréhension de l'oral",["Écouter attentivement.","Repérer les informations importantes.","Comprendre une situation.","Prendre des notes simples.","Reformuler."],[],[],["Questions, résumé oral, reformulation."],[]],
    ["2. Lecture et compréhension",["Identifier le type de texte.","Déterminer le thème.","Rechercher les informations.","Comprendre l'organisation du texte.","Interpréter certaines informations."],["Répondre.","Citer ou retrouver l'information utile.","Justifier.","Résumer."],[],[],[]],
    ["3. Vocabulaire",["Champ lexical.","Synonymes.","Antonymes.","Familles de mots.","Dérivation.","Sens propre/figuré.","Vocabulaire spécifique du texte."],["Comprendre comment les mots fonctionnent dans un texte, pas seulement les mémoriser isolément."],[],[],[]],
    ["4. Grammaire",["Phrase simple/complexe.","Groupes et fonctions.","Coordination/subordination selon les notions étudiées.","Types et formes.","Enrichissement de la phrase.","Accords."],["Analyser.","Transformer.","Combiner des phrases.","Produire des phrases plus précises."],[],[],[]],
    ["5. Conjugaison",["Temps et modes étudiés.","Valeur des temps.","Emploi des temps dans un récit ou une description.","Concordance selon les notions étudiées."],["Expliquer pourquoi un temps verbal est utilisé dans un passage."],[],[],[]],
    ["6. Orthographe",["Accords.","Homophones.","Ponctuation.","Orthographe grammaticale.","Orthographe lexicale."],[],[],["Nouvelle habitude à installer : « Je relis mon texte avant de le rendre. » Faire de la relecture une véritable étape du travail."],[]],
    ["7. Production écrite",["Avant : Qui écrit ? Pour qui ? Pourquoi ? Sur quel sujet ? Quel type de texte ?","Pendant : organiser les paragraphes, utiliser les connecteurs, développer les idées.","Après : relire, corriger, améliorer."],[],[],[],[]]
  ],
  "Anglais": [
    ["1. Personal information and identity",["Présentation.","Famille.","Goûts.","Description de soi et des autres."],[],[],[],[]],
    ["2. Daily life and routines",["Activités quotidiennes.","Horaires.","Habitudes.","Fréquence."],["Parler simplement de sa journée."],[],[],[]],
    ["3. School and future plans",["Matières.","Activités scolaires.","Projets.","Ambitions simples."],[],[],[],[]],
    ["4. Places and travel",["Lieux.","Déplacements.","Directions.","Situations simples de voyage."],[],[],[],[]],
    ["5. Health and lifestyle",["Parties du corps.","Habitudes.","Alimentation.","Comportements favorables à la santé."],[],[],[],[]],
    ["6. Environment",["Nature.","Pollution.","Protection de l'environnement.","Gestes quotidiens."],[],[],[],
      ["Méthode permanente : Listen → Understand → Speak → Read → Write."]]
  ],
  "Mathématiques": [
    ["1. Nombres et calcul",["Nombres et opérations étudiés.","Calcul numérique.","Priorités.","Stratégies de calcul."],["Calculer.","Vérifier un résultat.","Expliquer sa méthode."],[],[],[]],
    ["2. Fractions et nombres décimaux",["Représentation.","Comparaison.","Opérations étudiées.","Utilisation dans des problèmes."],["Passer d'une représentation à une autre et utiliser les fractions/décimaux dans une situation concrète."],[],[],[]],
    ["3. Proportionnalité",["Reconnaître une situation de proportionnalité.","Tableau.","Coefficient selon les notions étudiées.","Problèmes."],["Identifier la méthode adaptée et expliquer son raisonnement."],[],[],[]],
    ["4. Calcul littéral",["Utiliser des lettres pour représenter des nombres.","Expressions.","Calculs et transformations étudiés."],["Remplacer une lettre par une valeur, calculer une expression et effectuer les transformations étudiées."],[],[],["Commencer par des exemples numériques avant d'introduire les lettres."]],
    ["5. Équations et problèmes",[],["Comprendre pourquoi il écrit une équation, pas seulement appliquer une recette."],["Méthode : Comprendre le problème → choisir l'inconnue → traduire → résoudre → vérifier → répondre."],[],[]],
    ["6. Géométrie",["Constructions.","Angles.","Triangles et quadrilatères.","Propriétés.","Symétrie.","Figures et mesures selon les notions étudiées."],["Construire, mesurer, utiliser les propriétés et justifier."],[],[],[]],
    ["7. Grandeurs et mesures",["Longueurs.","Aires.","Périmètres.","Volumes selon les notions étudiées.","Conversions.","Problèmes."],[],[],[],[]]
  ],
  "Sciences et technologie": [
    ["1. Le vivant",["Observer.","Comparer.","Classer.","Expliquer les caractéristiques des êtres vivants."],[],[],[],[]],
    ["2. Corps humain et santé",["Fonctions étudiées.","Alimentation.","Hygiène.","Prévention.","Comportements responsables."],[],[],[],[]],
    ["3. Environnement",["Écosystèmes.","Relations entre êtres vivants.","Ressources.","Pollution.","Protection."],[],[],[],[]],
    ["4. Matière et transformations",["Propriétés.","Transformations.","Expériences.","Interprétation d'observations."],[],[],[],[]],
    ["5. Énergie et phénomènes",["Observer un phénomène, identifier ce qui se passe et expliquer avec les notions étudiées."],[],[],[],
      ["Méthode scientifique à faire pratiquer : Question → hypothèse → expérience/observation → résultats → conclusion."]]
  ],
  "Éducation islamique": [
    ["1. Foi et comportement",["Valeurs.","Responsabilité.","Sincérité.","Respect.","Comportement dans la société."],[],[],[],[]],
    ["2. Pratiques religieuses",["Règles et pratiques étudiées.","Purification.","Prière.","Autres notions prévues."],[],[],[],[]],
    ["3. Vie du Prophète ﷺ",["Événements étudiés.","Contexte.","Comportements.","Enseignements."],[],[],[],[]],
    ["4. Coran et invocations",["Récitation.","Mémorisation.","Compréhension.","Mise en pratique des enseignements."],[],[],["Ne pas vérifier uniquement la récitation. Demander aussi : « Qu'est-ce que ce passage nous apprend ? »"],[]]
  ],
  "Histoire": [
    ["1. Comprendre un document historique",["Identifier la nature du document, sa date, son auteur ou origine lorsqu'elle est connue, le sujet, les informations importantes."],["Observer → identifier → relever → expliquer."],[],[],[]],
    ["2. Chronologie",["Dates.","Périodes.","Siècles.","Succession des événements."],["Placer les événements sur une frise et expliquer leur ordre."],[],[],[]],
    ["3. Histoire de l'Algérie",["Pour chaque thème : 📌 Ce qui s'est passé · 📅 Quand ? · 📍 Où ? · 👤 Qui ? · ❓ Pourquoi ? · ➡️ Quelles conséquences ? — cette grille est particulièrement utile pour un professeur débutant."],[],[],[],[]]
  ],
  "Géographie": [
    ["1. Lire et analyser une carte",["Localiser → identifier → décrire → comparer → expliquer."],[],[],[],[]],
    ["2. Population et territoires",["Répartition de la population.","Espaces urbains/ruraux.","Migrations selon les thèmes étudiés.","Activités humaines."],[],
      ["Donner une carte ou un graphique et demander : 1) Que voyez-vous ? 2) Où ? 3) Quelle différence ? 4) Comment l'expliquer ?"],[],[]],
    ["3. Activités économiques",["Agriculture.","Industrie.","Services.","Ressources.","Échanges selon les thèmes du programme."],["Apprendre à lire les données, pas seulement les mémoriser."],[],[],[]]
  ],
  "Éducation civique": [
    ["1. Droits et responsabilités",["Un droit s'accompagne de responsabilités dans la vie collective."],[],[],[],[]],
    ["2. Citoyenneté",["Respect des règles.","Participation.","Responsabilité.","Respect des autres.","Biens communs."],[],[],[],[]],
    ["3. Environnement et société",["Ressources.","Pollution.","Comportements responsables.","Actions collectives."],[],
      ["Présenter une situation concrète puis demander : « Quel est le problème ? » « Quels sont les comportements possibles ? » « Quelle solution peut-on proposer ? »"],[],[]]
  ],
  "Éducation artistique": [
    ["1. Observation et représentation",["Proportions.","Formes.","Espace.","Détails."],[],[],[],[]],
    ["2. Techniques et composition",["Couleurs.","Contrastes.","Composition.","Techniques étudiées."],[],[],[],[]],
    ["3. Création personnelle",["L'élève doit être capable de transformer une consigne en production personnelle."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["1. Course",["Vitesse.","Endurance.","Gestion de l'effort."],[],[],[],[]],
    ["2. Sauts",["Coordination.","Impulsion.","Réception."],[],[],[],[]],
    ["3. Lancers",["Précision.","Puissance.","Coordination."],[],[],[],[]],
    ["4. Jeux collectifs",["Règles.","Coopération.","Stratégie.","Déplacement.","Communication."],[],[],[],[]]
  ]
},

"1AS": {
  "Arabe": [
    ["1. Comprendre et analyser un texte",
      ["Identifier le thème.","Déterminer le type et la nature du texte.","Repérer les idées essentielles.","Comprendre l'organisation du texte.","Relever les informations importantes.","Interpréter les éléments du texte."],
      ["Lire avec méthode.","Répondre en justifiant.","Expliquer une idée.","Reformuler.","Résumer l'essentiel."],
      ["Lecture.","Repérage des mots-clés.","Questions.","Classement des idées.","Résumé.","Analyse d'un passage."],
      ["Je demande à l'élève de justifier sa réponse par un élément précis du texte."],
      ["Je ne donne pas directement la réponse. Je lui fais retrouver progressivement les indices dans le texte."]],
    ["2. Vocabulaire",["Champ lexical.","Synonymie/antonymie.","Familles de mots.","Dérivation.","Expressions.","Sens propre et figuré.","Vocabulaire spécifique aux textes étudiés."],["Comprendre un mot selon son contexte.","Expliquer son choix.","Enrichir son vocabulaire.","Réutiliser les mots dans une production."],[],[],[]],
    ["3. Grammaire",["Organisation de la phrase.","Fonctions grammaticales.","Types et formes.","Relations entre les propositions.","Accords.","Transformations."],["Analyser une phrase.","Justifier son analyse.","Transformer une structure.","Produire des phrases correctement construites."],[],[],[]],
    ["4. Conjugaison",["Temps et modes étudiés.","Valeurs des temps.","Emploi des temps selon le type de texte."],["Reconnaître.","Conjuguer.","Choisir le temps approprié.","Expliquer son emploi."],[],[],[]],
    ["5. Production écrite",[],["Respecter la consigne.","Organiser son texte.","Développer une idée.","Utiliser des connecteurs.","Produire plusieurs paragraphes cohérents."],["Méthode : Comprendre le sujet → chercher les idées → sélectionner → organiser → rédiger → relire → corriger."],[],[]]
  ],
  "Français": [
    ["1. Compréhension et analyse de textes",["Identifier le type de texte.","Repérer la situation de communication.","Identifier l'organisation.","Relever les informations.","Comprendre l'intention de communication."],["Lire avec méthode.","Répondre en justifiant.","Reformuler.","Analyser l'organisation d'un texte."],[],[],[]],
    ["2. Texte narratif",["Situation.","Personnages.","Événements.","Chronologie.","Cadre.","Organisation du récit."],["Remettre les événements dans l'ordre.","Identifier les personnages.","Raconter un événement.","Produire un court récit organisé."],[],[],[]],
    ["3. Texte descriptif",["Objet/personne/lieu décrit.","Éléments descriptifs.","Organisation.","Vocabulaire précis.","Adjectifs et expansions."],["Repérer une description.","Organiser une description.","Décrire avec précision."],[],[],[]],
    ["4. Texte explicatif / informatif",["Sujet.","Informations.","Relations de cause et conséquence.","Explications.","Organisation logique."],["Extraire les informations.","Expliquer un phénomène.","Organiser une explication."],[],[],[]],
    ["5. Vocabulaire",["Champ lexical.","Familles de mots.","Synonymes.","Antonymes.","Formation des mots.","Vocabulaire spécialisé."],[],["Prendre le vocabulaire du texte étudié et demander à l'élève de le réutiliser dans une nouvelle situation."],[],[]],
    ["6. Grammaire",["Phrase simple et complexe.","Groupes et fonctions.","Propositions.","Coordination/subordination selon les notions étudiées.","Connecteurs.","Transformation des phrases."],["Analyser une phrase et expliquer pourquoi."],[],[],[]],
    ["7. Conjugaison",["Au-delà de « conjugue ce verbe », demander aussi « Pourquoi l'auteur utilise-t-il ce temps ici ? » — comprendre la valeur des temps dans le texte."],[],[],[],[]],
    ["8. Production écrite",["Avant : je comprends → je cherche → je sélectionne → j'organise.","Pendant : je rédige → je relie mes idées → je construis mes paragraphes.","Après : je relis → je corrige → j'améliore."],["Produire un texte cohérent, organisé et adapté à la consigne."],[],[],[]]
  ],
  "Anglais": [
    ["1. Introducing oneself and others",["Identité.","Famille.","Goûts.","Description.","Informations personnelles."],[],[],[],[]],
    ["2. School life",["Matières.","Activités.","Règles.","Vie scolaire.","Exprimer une opinion simple."],[],[],[],[]],
    ["3. Daily life",["Habitudes.","Activités.","Horaires.","Environnement quotidien."],[],[],[],[]],
    ["4. Health and lifestyle",["Alimentation.","Sport.","Habitudes.","Conseils.","Comportements favorables à la santé."],[],[],[],[]],
    ["5. Environment",["Environnement.","Pollution.","Protection.","Gestes responsables."],[],[],[],[]],
    ["6. Communication",[],["Comprendre → répondre → poser une question → expliquer → écrire un message court."],[],[],[]]
  ],
  "Mathématiques": [
    ["1. Nombres et calcul",["Ensembles de nombres étudiés.","Opérations.","Calcul numérique.","Propriétés.","Calcul réfléchi."],["Calculer.","Choisir une méthode.","Vérifier.","Expliquer son résultat."],[],[],[]],
    ["2. Calcul littéral",["Expressions littérales.","Réduction.","Développement/factorisation selon les notions étudiées.","Substitution."],["Manipuler une expression.","Calculer sa valeur.","Transformer une expression."],[],[],["Revenir à des exemples numériques avant de passer aux lettres."]],
    ["3. Équations",[],["Comprendre le sens de chaque étape."],["Méthode : Comprendre → choisir l'inconnue → traduire → résoudre → vérifier → conclure."],[],[]],
    ["4. Fonctions",["Notion de fonction.","Représentation.","Tableau de valeurs.","Graphique selon les notions étudiées."],["Lire une représentation.","Calculer une image.","Interpréter un résultat.","Passer du tableau au graphique selon les cas étudiés."],[],[],[]],
    ["5. Géométrie",["Figures.","Propriétés.","Constructions.","Mesures.","Configurations étudiées."],["Apprendre à justifier, pas seulement donner une réponse."],[],[],[]],
    ["6. Statistiques",["Recueillir des données.","Tableaux.","Représentations.","Moyenne et indicateurs étudiés."],["Lire un tableau.","Lire un graphique.","Calculer.","Interpréter le résultat."],[],[],[]]
  ],
  "Sciences": [
    ["1. Observer et expérimenter",[],[],[],[],["Méthode : Question → hypothèse → expérience → observation → résultats → interprétation → conclusion. L'élève doit apprendre à distinguer « ce que j'observe » de « ce que j'en déduis »."]],
    ["2. Le vivant",["Organisation du vivant.","Besoins.","Fonctions étudiées.","Relations entre organismes et environnement."],["Observer, exploiter des documents, interpréter et conclure."],[],[],[]],
    ["3. Corps humain et santé",["Fonctionnement des systèmes étudiés.","Alimentation.","Prévention.","Équilibre et santé."],[],[],[],[]],
    ["4. Matière et transformations",["Propriétés.","Transformations.","Phénomènes.","Expériences.","Interprétation."],[],[],[],[]],
    ["5. Énergie",["Formes d'énergie.","Transformations.","Utilisation.","Phénomènes étudiés."],[],[],[],[]]
  ],
  "Éducation islamique": [
    ["1. Foi et comportement",["Approfondir les notions de foi et leur influence sur le comportement."],[],[],[],[]],
    ["2. Pratiques religieuses",["Purification.","Prière.","Pratiques étudiées.","Règles et comportements."],[],[],[],[]],
    ["3. Coran et Hadith",["Mémorisation.","Compréhension.","Explication des enseignements.","Mise en pratique."],[],[],[],[]],
    ["4. Vie du Prophète ﷺ",["Ne pas seulement retenir les événements : comprendre les enseignements et valeurs qui en ressortent."],[],[],[],[]]
  ],
  "Histoire": [
    ["1. Lire un document historique",["Méthode : 1) Identifier le document 2) Le dater si possible 3) Identifier son auteur/origine 4) Identifier le sujet 5) Relever les informations importantes 6) Les expliquer avec ses connaissances."],[],[],[],[]],
    ["2. Chronologie",["Dates.","Siècles.","Périodes.","Succession des événements.","Relations chronologiques."],[],[],[],[]],
    ["3. Étudier un événement",["Toujours poser : 📅 Quand ? 📍 Où ? 👤 Qui ? ❓ Que s'est-il passé ? Pourquoi ? Quelles conséquences ? Cette grille peut devenir un outil permanent."],[],[],[],[]]
  ],
  "Géographie": [
    ["1. Lire une carte",["Localiser → identifier → décrire → comparer → expliquer."],[],[],[],[]],
    ["2. Territoires et populations",["Répartition.","Densités.","Espaces urbains/ruraux.","Mobilité selon les thèmes étudiés."],[],[],[],[]],
    ["3. Activités économiques",["Agriculture.","Industrie.","Services.","Ressources.","Échanges."],["Exploiter une carte, un tableau ou un graphique."],[],[],[]],
    ["4. Développement et environnement",["Ressources.","Besoins.","Environnement.","Développement.","Enjeux territoriaux selon les thèmes étudiés."],[],[],[],[]]
  ],
  "Éducation civique": [
    ["1. Citoyenneté",["Droits.","Devoirs.","Responsabilité.","Participation à la société."],[],[],[],[]],
    ["2. Institutions et vie collective",["Découvrir progressivement comment fonctionne la vie collective et les institutions étudiées au programme."],[],[],[],[]],
    ["3. Respect et responsabilité",["Respect des autres.","Règles.","Biens communs.","Environnement.","Comportement citoyen."],[],["Partir de situations concrètes plutôt que de faire mémoriser uniquement des définitions."],[],[]]
  ],
  "Éducation artistique": [
    ["1. Observation",["Analyser une œuvre ou une production."],[],[],[],[]],
    ["2. Techniques",["Approfondir les techniques et la composition."],[],[],[],[]],
    ["3. Création",["Concevoir une production personnelle en respectant une consigne.","L'élève doit progressivement être capable d'expliquer ses choix artistiques."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["1. Course",["Vitesse.","Endurance.","Gestion de l'effort."],[],[],[],[]],
    ["2. Sauts",["Technique.","Coordination.","Performance."],[],[],[],[]],
    ["3. Lancers",["Précision.","Puissance.","Coordination."],[],[],[],[]],
    ["4. Sports collectifs",["Règles.","Techniques.","Stratégie.","Coopération.","Communication."],[],[],[],[]]
  ]
},

"2AS": {
  "Arabe": [
    ["1. Comprendre et analyser un texte",
      ["Thème et problématique.","Type et structure du texte.","Idées principales et secondaires.","Relations entre les idées.","Vocabulaire et procédés étudiés.","Intention de l'auteur."],
      ["Comprendre globalement un texte.","Repérer les informations importantes.","Expliquer une idée.","Justifier une interprétation.","Reformuler ou résumer."],
      ["Lecture.","Repérage.","Questions.","Classement des idées.","Résumé.","Analyse d'un passage."],
      ["Je demande systématiquement : « Où trouves-tu cette réponse dans le texte ? »"],
      ["Je reprends le texte par étapes et je lui fais identifier les indices avant de lui donner l'interprétation."]],
    ["2. Vocabulaire",["Champs lexicaux.","Synonymes/antonymes.","Familles de mots.","Dérivation.","Expressions.","Sens propre et figuré.","Vocabulaire spécifique."],["Comprendre un mot dans son contexte et le réutiliser correctement."],[],[],[]],
    ["3. Grammaire",["Phrase simple et complexe.","Fonctions.","Propositions.","Relations entre propositions.","Transformations.","Accords.","Procédés grammaticaux étudiés."],["Analyser.","Transformer.","Corriger.","Produire des phrases complexes correctement construites."],[],[],[]],
    ["4. Conjugaison",["Temps et modes étudiés.","Valeur des temps.","Emploi dans différents types de textes."],["Non seulement conjuguer, mais expliquer pourquoi un temps est utilisé."],[],[],[]],
    ["5. Production écrite",[],["Produire un texte cohérent avec une introduction adaptée, des idées organisées, des arguments ou explications selon le sujet, des connecteurs, une conclusion lorsque nécessaire."],["Méthode : Comprendre le sujet → prendre position si nécessaire → chercher les idées → organiser → rédiger → relire → améliorer."],[],[]]
  ],
  "Français": [
    ["1. Compréhension et analyse de textes",["Situation de communication.","Type de texte.","Organisation.","Informations essentielles.","Point de vue.","Procédés utilisés.","Intention de communication."],["Analyser un texte.","Répondre en justifiant.","Reformuler.","Résumer.","Expliquer l'organisation du texte."],[],[],[]],
    ["2. Texte argumentatif",
      ["Thème.","Opinion/thèse.","Arguments.","Exemples.","Connecteurs logiques.","Organisation du raisonnement."],
      ["Identifier la thèse.","Retrouver les arguments.","Distinguer argument et exemple.","Construire son propre raisonnement.","Rédiger un paragraphe argumenté."],
      ["Donner une affirmation (« Les réseaux sociaux sont utiles aux élèves. ») puis demander : Quelle est ton opinion ? → Pourquoi ? → Donne un exemple. → Relie tes idées."],
      [],[]],
    ["3. Texte explicatif",["Phénomène.","Explication.","Cause.","Conséquence.","Organisation logique.","Connecteurs."],["Expliquer clairement un phénomène à quelqu'un qui ne le connaît pas."],[],[],[]],
    ["4. Vocabulaire",["Champ lexical.","Dérivation.","Synonymes.","Antonymes.","Niveaux de langue selon les notions étudiées.","Vocabulaire spécialisé."],["Objectif : enrichir la précision de l'expression."],[],[],[]],
    ["5. Grammaire",["Phrase complexe.","Propositions.","Coordination.","Subordination.","Relations logiques.","Transformations.","Concordance et accords selon les notions étudiées."],["Construire des phrases plus riches tout en restant correct."],[],[],[]],
    ["6. Conjugaison",["Relier la conjugaison au sens du texte, ex: « Pourquoi l'auteur utilise-t-il le présent ici et non un autre temps ? »"],["Comprendre l'utilisation des temps et non réciter uniquement des tableaux."],[],[],[]],
    ["7. Production écrite",
      ["Avant : je comprends la consigne.","Ensuite : je cherche mes idées.","Puis : je les organise.","Enfin : je rédige → je relis → je corrige."],
      [],[],
      ["Grille de vérification pour l'élève : Ai-je répondu au sujet ? Mes idées sont-elles organisées ? Ai-je utilisé des connecteurs ? Mes phrases sont-elles correctes ? Ai-je relu l'orthographe ?"],[]]
  ],
  "Anglais": [
    ["1. Communication",[],["Comprendre une conversation.","Répondre.","Poser des questions.","Exprimer une opinion.","Expliquer simplement une situation."],[],[],[]],
    ["2. School and education",["École.","Apprentissage.","Règles.","Projets.","Opinions sur l'éducation."],[],[],[],[]],
    ["3. Environment",["Pollution.","Climat.","Ressources.","Protection.","Solutions."],[],["Objectif : décrire un problème puis proposer des solutions simples."],[],[]],
    ["4. Health and lifestyle",["Alimentation.","Sport.","Habitudes.","Prévention.","Conseils."],[],[],[],[]],
    ["5. Technology and communication",["Technologies.","Communication.","Usages.","Avantages/inconvénients.","Sécurité et comportement responsable selon les thèmes étudiés."],[],[],[],[]],
    ["6. Writing",[],["Rédiger un message, une description, un paragraphe, un texte organisé sur un sujet étudié."],[],[],[]]
  ],
  "Mathématiques": [
    ["1. Calcul et nombres",["Ensembles de nombres étudiés.","Opérations.","Calcul numérique.","Propriétés.","Stratégies de calcul."],["Calculer mais surtout choisir et expliquer une méthode."],[],[],[]],
    ["2. Calcul littéral",["Expressions.","Développement.","Factorisation.","Identités ou techniques étudiées.","Équations."],["Transformer une expression et justifier les étapes."],[],[],["Revenir à des exemples numériques et montrer ce que représente chaque lettre."]],
    ["3. Fonctions",["Notion de fonction.","Image.","Antécédent.","Tableau.","Représentation graphique.","Propriétés étudiées."],["Lire un graphique.","Calculer une image.","Retrouver un antécédent.","Interpréter graphiquement."],[],[],[]],
    ["4. Proportionnalité et pourcentages",["Pourcentage.","Augmentation.","Diminution.","Proportion.","Échelle selon les notions étudiées."],[],[],["Toujours faire expliquer ce que représente le résultat."],[]],
    ["5. Statistiques",["Population.","Caractère.","Tableau.","Représentations.","Moyenne.","Indicateurs étudiés."],["Calculer et interpréter."],[],[],[]],
    ["6. Probabilités",["Expérience aléatoire.","Événements.","Probabilité dans les situations étudiées."],[],[],["Ne pas commencer par les formules : partir d'une situation concrète."],[]],
    ["7. Géométrie",["Propriétés.","Constructions.","Configurations.","Mesures.","Raisonnement géométrique."],["Apprendre à rédiger une justification."],[],[],[]]
  ],
  "Sciences": [
    ["1. Démarche scientifique",[],[],[],[],["Question → hypothèse → expérience/document → observation → résultats → interprétation → conclusion. Distinguer résultat (ce que je constate), interprétation (ce que cela signifie) et conclusion (ce que je peux affirmer)."]],
    ["2. Biologie",["Organisation du vivant.","Fonctions biologiques.","Relations entre organismes.","Environnement.","Santé selon les thèmes étudiés."],["Exploiter un document scientifique et construire une conclusion."],[],[],[]],
    ["3. Chimie",["Matière.","Transformations.","Réactions étudiées.","Observations.","Interprétation."],[],[],["Méthode : J'observe → je décris → j'interprète → je conclus."],[]],
    ["4. Physique",["Phénomènes physiques.","Grandeurs.","Mesures.","Relations étudiées.","Exploitation de données."],["Identifier les données, choisir la relation appropriée, calculer avec les unités et interpréter le résultat."],[],[],[]]
  ],
  "Éducation islamique": [
    ["1. Foi et comportement",["Valeurs.","Responsabilité.","Comportement individuel.","Comportement social."],[],[],[],[]],
    ["2. Coran et Hadith",["Lire → comprendre → expliquer → retenir l'enseignement → réfléchir à sa mise en pratique."],[],[],[],[]],
    ["3. Pratiques religieuses",["Notions et règles étudiées.","Compréhension.","Application."],[],[],[],[]],
    ["4. Vie du Prophète ﷺ",["Comprendre les enseignements, valeurs et comportements, pas seulement retenir des événements."],[],[],[],[]]
  ],
  "Histoire": [
    ["1. Analyse d'un document historique",["Grille systématique : 📄 Nature du document · 📅 Date · 👤 Auteur/origine · 📌 Sujet · 🔎 Informations importantes · 🧠 Interprétation · 📚 Mise en relation avec les connaissances."],[],[],[],[]],
    ["2. Chronologie",["Dates.","Siècles.","Périodes.","Succession.","Simultanéité.","Liens entre événements."],[],[],[],[]],
    ["3. Étudier un événement historique",["Toujours rechercher : Quand ? Où ? Qui ? Que s'est-il passé ? Pourquoi ? Quelles conséquences ?"],[],[],[],[]]
  ],
  "Géographie": [
    ["1. Analyse de cartes",["Passer de « je vois une carte » à « je sais l'exploiter »."],[],["Méthode : Identifier → localiser → décrire → comparer → expliquer."],[],[]],
    ["2. Population et territoires",["Répartition.","Densités.","Urbanisation.","Mobilités.","Territoires."],[],[],[],[]],
    ["3. Économie et développement",["Agriculture.","Industrie.","Services.","Ressources.","Échanges.","Développement selon les thèmes étudiés."],[],[],[],[]],
    ["4. Environnement",["Ressources naturelles.","Contraintes.","Risques.","Protection.","Développement durable selon les thèmes étudiés."],[],["Donner une carte ou un graphique sans explication et demander à l'élève de produire lui-même trois observations puis une explication."],[],[]]
  ],
  "Éducation civique": [
    ["1. Citoyenneté et responsabilité",["Droits.","Devoirs.","Responsabilité.","Participation."],[],[],[],[]],
    ["2. Vie collective",["Règles.","Dialogue.","Respect.","Coopération.","Résolution des conflits."],[],[],[],[]],
    ["3. Société et institutions",[],[],["Faire comprendre les notions à partir de situations concrètes, de documents et de débats encadrés, plutôt que par mémorisation seule."],[],[]]
  ],
  "Éducation artistique": [
    ["1. Analyse",["Observer et commenter une œuvre ou une production."],[],[],[],[]],
    ["2. Techniques",["Approfondir les techniques et les choix de composition."],[],[],[],[]],
    ["3. Création",["Réaliser une production personnelle et être capable d'expliquer ses choix."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["1. Course",["Vitesse.","Endurance.","Gestion de l'effort."],[],[],[],[]],
    ["2. Sauts",["Technique.","Coordination.","Performance."],[],[],[],[]],
    ["3. Lancers",["Précision.","Puissance.","Technique."],[],[],[],[]],
    ["4. Sports collectifs",["Règles.","Technique.","Stratégie.","Coopération.","Communication."],[],[],[],[]]
  ]
},

"3AS": {
  "Arabe": [
    ["1. Analyse approfondie d'un texte",
      ["Identifier le thème.","Comprendre la problématique.","Déterminer la structure.","Distinguer idées principales et secondaires.","Analyser les procédés utilisés.","Comprendre le point de vue.","Interpréter les informations."],
      ["Analyser un texte de manière autonome.","Justifier ses réponses.","Expliquer un procédé.","Relier plusieurs informations.","Résumer l'essentiel."],
      ["Analyse guidée puis autonome.","Questions de compréhension.","Relevé d'indices.","Synthèse.","Résumé.","Comparaison de passages."],
      ["Je demande non seulement la réponse, mais aussi : « Quel élément du texte permet de le démontrer ? »"],
      ["Je reviens aux indices du texte et je reconstruis le raisonnement étape par étape."]],
    ["2. Vocabulaire et expression",["Précision lexicale.","Champs lexicaux.","Dérivation.","Synonymes/antonymes.","Expressions.","Vocabulaire spécialisé."],["Choisir le mot juste et l'utiliser dans une formulation adaptée."],[],[],[]],
    ["3. Grammaire",["Structures complexes.","Propositions.","Relations logiques.","Fonctions.","Transformations.","Accords.","Procédés grammaticaux étudiés."],["Analyser une structure et expliquer son fonctionnement."],[],[],[]],
    ["4. Conjugaison",["Temps et modes étudiés.","Formation.","Emploi.","Valeur dans le texte."],["Ne plus seulement demander « Quel est le temps ? », mais aussi « Quel effet ou quelle fonction a-t-il ici ? »"],[],[],[]],
    ["5. Production écrite",
      [],
      ["Construire une production autonome et structurée."],
      ["Méthode : Comprendre le sujet → définir l'objectif → chercher les idées → sélectionner → organiser → rédiger → relire → corriger."],
      ["Grille d'auto-vérification : Ai-je répondu au sujet ? Mes idées sont-elles organisées ? Ai-je justifié mes affirmations ? Les paragraphes sont-ils liés ? Ai-je utilisé un vocabulaire précis ? Ai-je relu mon texte ?"],
      []]
  ],
  "Français": [
    ["1. Comprendre un texte",["Situation de communication.","Thème.","Problématique.","Organisation.","Point de vue.","Informations explicites et implicites.","Procédés utilisés."],["Comprendre seul.","Relever les indices.","Interpréter.","Justifier."],[],[],[]],
    ["2. Texte argumentatif",
      ["Thème.","Thèse.","Arguments.","Exemples.","Contre-arguments selon les situations.","Connecteurs logiques.","Organisation du raisonnement.","Conclusion."],
      ["Identifier dans un texte : THÈSE → ARGUMENT → EXEMPLE → CONCLUSION. Puis être capable de construire son propre raisonnement."],
      ["Exercice : « Faut-il limiter l'utilisation du téléphone portable à l'école ? » L'élève doit : 1) comprendre le problème ; 2) choisir une position ; 3) trouver des arguments ; 4) chercher des exemples ; 5) organiser ses idées ; 6) rédiger."],
      [],
      ["Ne pas lui demander directement de rédiger. Faire : Sujet → opinion → argument 1 → exemple → argument 2 → exemple → conclusion."]],
    ["3. Texte explicatif",["Expliquer un phénomène.","Présenter des informations.","Établir les causes.","Présenter les conséquences.","Organiser logiquement les informations."],["Expliquer clairement un phénomène sans simplement recopier le document."],[],[],[]],
    ["4. Synthèse",[],["Lire plusieurs informations → sélectionner l'essentiel → éliminer les répétitions → organiser → reformuler. Ne pas simplement recopier les documents."],[],[],[]],
    ["5. Vocabulaire",["Précision lexicale.","Champs lexicaux.","Relations entre les mots.","Dérivation.","Expressions.","Vocabulaire spécialisé."],["Objectif : avoir une expression suffisamment précise pour défendre une idée ou expliquer un phénomène."],[],[],[]],
    ["6. Grammaire",["Phrase complexe.","Propositions.","Relations logiques.","Subordination.","Transformations.","Connecteurs.","Accords.","Structures étudiées."],["Analyser et réutiliser les structures dans sa propre production."],[],[],[]],
    ["7. Production écrite",[],[],["Méthode : ① Je lis attentivement le sujet ② Je repère les mots importants ③ Je comprends exactement ce qu'on me demande ④ Je cherche mes idées ⑤ Je les classe ⑥ Je construis mon plan ⑦ Je rédige ⑧ Je relis ⑨ Je corrige ⑩ J'améliore mon expression."],[],[]]
  ],
  "Anglais": [
    ["1. Communication",["Comprendre un message.","Répondre.","Poser des questions.","Donner son opinion.","Justifier simplement."],[],[],[],[]],
    ["2. Society",["Vie sociale.","Relations entre les personnes.","Problèmes de société selon les thèmes étudiés."],[],[],[],[]],
    ["3. Environment",["Pollution.","Ressources.","Protection.","Changements environnementaux.","Solutions."],[],[],[],[]],
    ["4. Technology",["Technologies.","Communication.","Usages.","Avantages/inconvénients.","Impacts selon les thèmes étudiés."],[],[],[],[]],
    ["5. Health",["Habitudes.","Alimentation.","Prévention.","Conseils.","Mode de vie."],[],[],[],[]],
    ["6. Writing",[],["Produire un texte organisé : Introduction → idées → exemples → conclusion, selon le type de tâche demandée."],[],[],[]]
  ],
  "Mathématiques": [
    ["1. Nombres et calcul",[],["Maîtriser les calculs nécessaires aux notions étudiées et savoir vérifier la cohérence d'un résultat."],[],[],[]],
    ["2. Fonctions",["Fonctions étudiées.","Représentations.","Variations.","Tableaux.","Graphiques.","Interprétation."],["Passer d'une représentation à une autre et interpréter les résultats."],[],[],[]],
    ["3. Équations et inéquations",[],["Apprendre à rédiger les étapes, pas seulement écrire le résultat."],["Méthode : Identifier → transformer → résoudre → vérifier → conclure."],[],[]],
    ["4. Suites ou notions algébriques étudiées",["Identifier une relation.","Calculer.","Démontrer.","Interpréter.","Utiliser une propriété."],[],[],[],[]],
    ["5. Probabilités et statistiques",[],["Exploiter des données.","Calculer les indicateurs étudiés.","Interpréter.","Résoudre une situation probabiliste."],[],[],[]],
    ["6. Géométrie",[],["Être capable de justifier une réponse avec une propriété mathématique appropriée."],["Développer : construction → propriété → raisonnement → démonstration → conclusion."],[],[]],
    ["7. Résolution de problèmes",[],[],[],["Faire prendre cette habitude : « Je ne cherche pas immédiatement quelle formule utiliser. Je cherche d'abord ce que le problème me demande. »"],[]]
  ],
  "Sciences": [
    ["1. Exploiter un document scientifique",[],["Observer → relever → comparer → interpréter → conclure."],[],[],[]],
    ["2. Expérimentation",[],[],[],[],["Méthode : Problème → hypothèse → protocole → résultats → interprétation → conclusion. Distinguer résultat (ce que l'expérience montre), interprétation (ce que le résultat signifie) et conclusion (réponse au problème initial)."]],
    ["3. Biologie",["Fonctionnement du vivant.","Mécanismes biologiques.","Santé.","Environnement.","Exploitation de documents scientifiques selon les thèmes étudiés."],[],[],[],[]],
    ["4. Physique",[],["Identifier les données → choisir la relation → calculer → vérifier l'unité → interpréter."],[],[],[]],
    ["5. Chimie",[],["Identifier les espèces ou phénomènes étudiés.","Exploiter les données.","Effectuer les calculs nécessaires.","Interpréter les résultats.","Rédiger une conclusion."],[],[],[]]
  ],
  "Éducation islamique": [
    ["1. Foi et comportement",[],["Comprendre les notions étudiées et en dégager les enseignements."],[],[],[]],
    ["2. Coran et Hadith",[],[],["Méthode : Lire → comprendre → expliquer → dégager l'enseignement → réfléchir à son application."],[],[]],
    ["3. Pratiques religieuses",["Notions.","Règles.","Compréhension.","Application."],[],[],[],[]],
    ["4. Vie du Prophète ﷺ",[],["Connaître les éléments étudiés et être capable d'en dégager les enseignements et valeurs."],[],[],[]]
  ],
  "Histoire": [
    ["1. Analyse historique",["Grille approfondie : 📄 Nature du document · 📅 Date · 👤 Auteur/origine · 📍 Contexte · 📌 Sujet · 🔎 Informations importantes · 🧠 Interprétation · 📚 Mise en relation avec les connaissances."],[],[],[],[]],
    ["2. Construire une chronologie",[],["Situer les événements.","Les ordonner.","Identifier les périodes.","Établir des relations entre eux."],[],[],[]],
    ["3. Expliquer un événement",[],[],["Toujours rechercher : Causes → événement → conséquences, et lorsque pertinent : Contexte → acteurs → déroulement → conséquences."],[],[]],
    ["4. Composition historique",[],[],["Apprendre progressivement : Introduction → développement organisé → conclusion. Apprendre à l'élève à répondre au sujet posé, et non à réciter tout ce qu'il connaît."],[],[]]
  ],
  "Géographie": [
    ["1. Analyse de documents",["Exploiter carte, graphique, tableau, texte, statistiques."],[],["Méthode : Identifier → relever → comparer → interpréter → expliquer."],[],[]],
    ["2. Territoires et population",["Répartition.","Dynamiques démographiques.","Urbanisation.","Mobilités.","Organisation des territoires."],[],[],[],[]],
    ["3. Économie",["Agriculture.","Industrie.","Services.","Échanges.","Ressources.","Développement."],[],[],[],[]],
    ["4. Environnement et développement",["Ressources.","Risques.","Contraintes.","Protection.","Développement durable selon les thèmes étudiés."],[],[],[],[]]
  ],
  "Éducation civique": [
    ["1. Citoyenneté",["Droits.","Devoirs.","Responsabilité.","Participation à la vie collective."],[],[],[],[]],
    ["2. Société",["Respect.","Dialogue.","Coopération.","Responsabilité individuelle et collective."],[],[],[],[]],
    ["3. Environnement et responsabilité",[],["Identifier un problème, expliquer ses conséquences et proposer des actions adaptées."],[],[],[]]
  ],
  "Éducation artistique": [
    ["1. Analyse d'une œuvre",["L'élève observe, décrit et interprète."],[],[],[],[]],
    ["2. Techniques",["Il maîtrise progressivement les techniques travaillées."],[],[],[],[]],
    ["3. Création",["Il conçoit une production personnelle et justifie ses choix."],[],[],[],[]]
  ],
  "Éducation physique": [
    ["1. Course",["Vitesse.","Endurance.","Gestion de l'effort."],[],[],[],[]],
    ["2. Sauts",["Technique.","Coordination.","Performance."],[],[],[],[]],
    ["3. Lancers",["Précision.","Puissance.","Technique."],[],[],[],[]],
    ["4. Sports collectifs",["Règles.","Technique.","Stratégie.","Coopération.","Autonomie."],[],[],[],[]]
  ]
}
},

gererClasse: {
  intro: "Avant même d'ouvrir un manuel, un professeur débutant se pose des questions très concrètes sur son métier. Ce chapitre y répond.",
  avantRentree: ["Comprendre son rôle","Préparer son année","Découvrir son programme","Préparer ses premiers cours"],
  premierJour: ["Entrer dans la classe","Se présenter","Faire connaissance avec les élèves","Installer les règles","Organiser la classe"],
  premiereSemaine: ["Faire connaissance avec le niveau des élèves","Observer les difficultés","Installer les habitudes de travail","Organiser les cahiers","Mettre en place les règles"],
  pendantAnnee: ["Faire participer les élèves","Gérer les bavardages","Gérer les perturbations","Aider un élève en difficulté","Faire travailler un groupe","Corriger","Évaluer","Faire de la remédiation","Communiquer avec les parents"],
  typeProfesseur: {
    titre: "Quel professeur dois-je être ?",
    texte: "Ni sévère à l'excès (les élèves obéissent par peur, pas par respect — ça s'effondre dès que vous avez le dos tourné), ni trop gentil (les élèves testent les limites, le chaos s'installe). La règle : ferme sur les règles, chaleureux dans la relation. Les règles ne changent jamais, quelle que soit votre humeur du jour — les élèves ont besoin de prévisibilité. Vous pouvez rire, être humain, vous intéresser à eux — les élèves travaillent pour un prof qu'ils aiment, pas pour un prof qu'ils craignent. Une consigne ferme peut se dire avec un sourire : ce n'est pas contradictoire.",
    principe: "L'élève doit toujours savoir à quoi s'attendre de vous — mêmes règles, même ton, chaque jour. C'est ça qui rassure et qui structure, bien plus que la sévérité."
  },
  difficultes: [
    { titre:"Bavardages", eviter:"Crier, menacer dans le vide", faire:"Silence du prof + regard + attendre ; nommer calmement l'élève ; rapprocher physiquement sans dramatiser" },
    { titre:"Baisse de motivation", eviter:"Culpabiliser (« vous ne faites rien »)", faire:"Varier l'activité, donner un objectif atteignable à court terme, valoriser le moindre progrès publiquement" },
    { titre:"Chute du travail", eviter:"Punir collectivement", faire:"Identifier si c'est 1 élève ou la classe entière — individuel = entretien court en privé ; collectif = revoir le rythme/la difficulté" },
    { titre:"Absences répétées", eviter:"Ignorer ou sanctionner sans comprendre", faire:"Contacter la famille tôt, sans accusation — comprendre la cause avant de sanctionner" },
    { titre:"Élève perturbateur", eviter:"L'exclure immédiatement, l'humilier devant la classe", faire:"Avertissement discret et individuel d'abord ; conséquence claire et connue à l'avance si ça continue ; jamais d'humiliation publique" }
  ]
}
};
