"""Notice d'utilisation : source unique pour la page « Aide » et pour l'assistant (réponses locales puis IA)."""
import re
import unicodedata

HELP = [
    {"id": "start", "title": "Démarrer en 5 minutes", "icon": "🚀", "items": [
        {"q": "Comment créer mon premier cours ?",
         "a": "1. Cliquez sur « Créer une séquence » (page d'accueil) ou sur « Séquences » dans le menu de gauche, puis « Nouvelle séquence ».\n"
              "2. Étape « Sujet » : écrivez le sujet (ex. « La formation des nuages »), choisissez le niveau, la langue et le nombre de leçons.\n"
              "3. Étape « Réglages » : choisissez un thème et ce que vous voulez inclure (illustrations, objectifs, vocabulaire, quiz, exercices…).\n"
              "4. Étape « Plan » : relisez les titres des leçons, modifiez-les si besoin, puis lancez la génération.\n"
              "5. Quand les leçons sont prêtes, cliquez sur « Voir la séquence » : vous pouvez enseigner, modifier ou télécharger."},
        {"q": "Dois-je créer un compte ?",
         "a": "Non pour essayer : vous pouvez créer des séquences sans compte. Un compte (e-mail et mot de passe) sert à retrouver vos séquences sur un autre ordinateur et à garder votre historique. "
              "Cliquez sur « Inscription gratuite » en haut à droite."},
        {"q": "Combien de temps dure la génération ?",
         "a": "Compter une à deux minutes par leçon, davantage si vous demandez beaucoup d'exercices ou d'illustrations. Les leçons sont créées trois par trois, et chaque leçon a sa barre de progression avec le temps écoulé et une estimation du temps restant. "
              "Pour aller plus vite : décochez « Illustrations » à l'étape « Réglages », choisissez moins d'exercices par leçon, ou moins de diapositives. Gardez l'onglet ouvert pendant la génération."},
    ]},
    {"id": "docs", "title": "Quels documents puis-je créer ?", "icon": "📄", "items": [
        {"q": "Quelle différence entre séquence, fiche d'activités et cahier d'activités ?",
         "a": "• Séquence : le cours à projeter en classe, en diapositives (une leçon par séance).\n"
              "• Fiche d'activités : une page d'exercices à imprimer (association, texte à trous, mots mêlés, test…).\n"
              "• Cahier d'activités : un document de plusieurs sections d'exercices pour les élèves, avec une page « Réponses » pour vous.\n"
              "• Fiche pédagogique Word : l'export « Word » d'une séquence, un document de préparation pour l'enseignant avec le déroulement et les corrigés."},
        {"q": "Comment créer un cahier ou une fiche à partir d'une séquence ?",
         "a": "Ouvrez votre séquence : dans la colonne de droite, carte « Activités », cliquez sur « Fiche d'activités », « Comptine » ou « Cahier d'activités ». Le sujet, le niveau et vos choix sont repris automatiquement."},
        {"q": "Qu'est-ce qu'une comptine, un tableau de syllabes, une écriture de lettres ?",
         "a": "Ce sont des modèles de fiches pour les petits niveaux (1AP, 2AP, préscolaire) : une comptine rimée avec jeux, un tableau de syllabes à lire, des modèles de lettres à repasser. Ils sont dans « Fiches d'activités »."},
    ]},
    {"id": "text", "title": "Utiliser mon propre texte ou document", "icon": "📎", "items": [
        {"q": "Puis-je travailler sur un texte que j'ai choisi ?",
         "a": "Oui. À l'étape « Sujet », la carte « Texte de départ » permet de coller votre texte ou d'importer un PDF, un Word (.docx) ou un fichier texte. Le sujet peut rester vide : il est déduit du titre du texte."},
        {"q": "Quelle différence entre les trois choix du texte de départ ?",
         "a": "• « C'est un texte à lire : l'utiliser tel quel » : votre texte est repris mot pour mot comme texte support.\n"
              "• « S'inspirer de ce texte : créer un texte inédit » : l'IA écrit un texte original sur le même sujet, avec les mêmes informations, et cite votre texte comme source d'inspiration.\n"
              "• « C'est un cours ou des notes : rédiger un texte support » : l'IA écrit un vrai texte à lire à partir de votre document (utile si votre PDF est un plan de cours et non un texte)."},
        {"q": "Mon PDF ne s'importe pas.",
         "a": "Un PDF scanné (une photo de page) n'est pas lisible : copiez-collez le texte à la place. Un PDF protégé par mot de passe est refusé. La taille maximale est de 8 Mo, et le texte est limité à 20 000 caractères."},
    ]},
    {"id": "ex", "title": "Exercices, niveaux et productions", "icon": "✏️", "items": [
        {"q": "Comment obtenir des exercices avec corrigés ?",
         "a": "À l'étape « Réglages », le bloc « Activités et exercices » est coché par défaut : choisissez la difficulté, le nombre d'exercices par leçon et « Détaillé » pour des corrigés complets. "
              "Les corrigés sont dans l'onglet « Réponse » de chaque diapositive d'exercice, et sous chaque exercice dans le Word « Version enseignant »."},
        {"q": "Comment proposer trois niveaux de difficulté à ma classe ?",
         "a": "Dans « Activités et exercices », choisissez « Les 3 niveaux (différenciation) ». Les exercices sont rangés en facile (vert), intermédiaire (orange) et difficile (rouge), pour faire travailler des groupes différents."},
        {"q": "Comment ajouter une production orale ou écrite ?",
         "a": "Dans le même bloc, cochez « Production orale », « Production écrite », « Débat », « Projet », etc., ou écrivez la vôtre dans « Autre ». Chaque production a une consigne, des critères de réussite et, en version enseignant, une grille de points."},
    ]},
    {"id": "edit", "title": "Modifier, présenter, télécharger", "icon": "⬇️", "items": [
        {"q": "Comment modifier une leçon ?",
         "a": "Sur la page de la séquence, cliquez sur « ✏ Modifier » à côté de la leçon. Cliquez sur un texte pour le changer, utilisez « + Diapositive » pour en ajouter, et la zone « Demander à Claude » pour faire reformuler ou compléter une diapositive."},
        {"q": "Comment présenter en classe ?",
         "a": "Cliquez sur « ▶ Enseigner » : les diapositives s'affichent en plein écran. Les flèches du clavier changent de diapositive, et la touche espace affiche la réponse d'un exercice."},
        {"q": "Comment télécharger en PowerPoint, PDF ou Word ?",
         "a": "En haut de la page de la séquence (ou dans l'éditeur d'une leçon) : « ⬇ PowerPoint », « ⬇ PDF » (une fenêtre d'impression : choisissez « Enregistrer au format PDF ») et « ⬇ Word ». "
              "Le Word propose deux versions : « enseignant » (en-tête à compléter, déroulement, corrigés sous chaque exercice) et « élève » (sans corrigés)."},
        {"q": "Comment changer la taille du texte ou l'interligne d'une fiche ?",
         "a": "Dans l'éditeur d'une fiche ou d'un cahier, la barre du haut a « Texte A− A+ » et « Interligne − + ». Les petits niveaux (jusqu'à la 3AP) ont déjà une grande écriture aérée."},
    ]},
    {"id": "sources", "title": "Sources et fiabilité", "icon": "🔎", "items": [
        {"q": "Le contenu généré est-il fiable ?",
         "a": "Le contenu est écrit par une IA à partir de connaissances générales : il n'a pas consulté d'internet. Relisez toujours les corrigés, les dates, les chiffres et les citations avant de les utiliser. "
              "Pour une base solide, donnez votre propre texte ou document dans « Texte de départ »."},
        {"q": "Comment citer une source ?",
         "a": "À l'étape « Réglages », champ « Sources de référence » : un lien ou une référence par ligne. Elles apparaissent sur une diapositive « Sources » (liens cliquables) et dans le Word. "
              "Pour une séquence déjà créée : carte « 📚 Sources » sur la page de la séquence. Sans source fournie, la diapositive indique la provenance (contenu IA) et propose des liens de recherche Wikipédia et Google Scholar pour vérifier."},
        {"q": "Pourquoi l'IA ne dit-elle pas d'où vient son cours ?",
         "a": "Une IA ne sait pas retrouver l'origine exacte de chaque information : si on le lui demandait, elle inventerait des références. L'application indique donc honnêtement qu'il s'agit d'un contenu généré, et vous laisse citer les sources que vous avez choisies."},
    ]},
    {"id": "lang", "title": "Arabe et niveaux primaires", "icon": "🌍", "items": [
        {"q": "Comment créer un cours en arabe ?",
         "a": "À l'étape « Sujet », choisissez la langue « arabe ». Tout s'affiche de droite à gauche (diapositives, fiches, Word). Pour les niveaux du préscolaire à la 3AP, le texte arabe est entièrement vocalisé et l'écriture est plus grande."},
        {"q": "Quels niveaux sont proposés ?",
         "a": "Préscolaire, 1AP à 5AP (primaire), 1AM à 4AM (moyen), 1AS à 3AS (secondaire), études supérieures et adultes."},
    ]},
    {"id": "account", "title": "Compte, offres et limites", "icon": "👤", "items": [
        {"q": "Combien de cours puis-je créer gratuitement ?",
         "a": "L'offre gratuite permet quelques ressources par semaine (le compteur est dans le menu : « Gratuit · 0/5 cette semaine »). Chaque leçon générée, chaque cahier et chaque fiche comptent pour une ressource. "
              "Les offres Pro et Max augmentent les limites : voir la page « Tarifs »."},
        {"q": "J'ai atteint ma limite, que faire ?",
         "a": "Le quota se réinitialise automatiquement : un message indique la date. Vous pouvez aussi passer à une offre supérieure dans « Tarifs »."},
    ]},
    {"id": "trouble", "title": "Un problème ?", "icon": "🛠️", "items": [
        {"q": "Je ne vois pas les nouveautés ou un bouton manque.",
         "a": "Votre page est probablement restée sur l'ancienne version. Cliquez sur « Recharger » dans la bulle noire en bas de l'écran, ou faites Ctrl+F5 (Cmd+Maj+R sur Mac)."},
        {"q": "Mes séquences ou mon compte ont disparu.",
         "a": "Vos séquences sont aussi gardées dans votre navigateur : rouvrez le site avec le même navigateur, sans vider les données du site ni utiliser la navigation privée, puis reconnectez-vous. "
              "Il peut arriver que le serveur soit remis à zéro lors d'une mise à jour : cela peut effacer les comptes. Contactez-nous via « Contact » si besoin."},
        {"q": "La génération a échoué ou affiche « Échec ».",
         "a": "Cliquez sur « Réessayer » à côté de la leçon. Si cela persiste : vérifiez votre connexion, réduisez le nombre d'exercices ou d'illustrations, puis recommencez."},
        {"q": "Le texte arabe s'affiche à l'envers.",
         "a": "Choisissez la langue « arabe » à la création. Si le titre contient de l'arabe, l'affichage s'inverse aussi tout seul. Rechargez la page avec Ctrl+F5."},
    ]},
]

_STOP = set("le la les un une des de du d l et ou a à au aux en est ce ces cette que qui quoi quel quelle quels quelles pour par sur dans avec sans mon ma mes ton ta tes son sa ses je tu il elle on nous vous ils elles y ne pas plus comment puis peut peux veux dois faire fait faut utiliser l'application l'appli sequence sequences".split())


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", s)


def words(s):
    return {w for w in norm(s).split() if len(w) > 2 and w not in _STOP}


ITEMS = [(sec["title"], it["q"], it["a"], words(sec["title"] + " " + it["q"] + " " + it["a"]), words(it["q"])) for sec in HELP for it in sec["items"]]


def best_answer(question, threshold=0.5):
    """Réponse locale (gratuite) si la question ressemble nettement à une entrée de la notice, sinon None."""
    qw = words(question)
    if not qw:
        return None
    best, score = None, 0.0
    for title, q, a, allw, qwords in ITEMS:
        common = qw & allw
        qcommon = qw & qwords
        sc = len(common) / len(qw) + 0.6 * (len(qcommon) / max(1, len(qwords)))
        if sc > score:
            best, score = (q, a), sc
    return best if best and score >= threshold + 0.45 else None


def knowledge_text():
    out = []
    for sec in HELP:
        out.append("## " + sec["title"])
        for it in sec["items"]:
            out.append("Q : " + it["q"] + "\nR : " + it["a"])
    return "\n".join(out)
