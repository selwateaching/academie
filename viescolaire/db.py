import os
import sqlite3
from datetime import date, timedelta

from werkzeug.security import generate_password_hash

from .config import CFG

DATA_DIR = os.environ.get("VSP_DATA") or CFG["data_dir"] or os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DATA_DIR, "viescolaire.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS etablissements (
    id INTEGER PRIMARY KEY, nom TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, nom TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    pwd_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','direction','cpe','enseignant')),
    totp_secret TEXT, actif INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS user_etabs (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    etab_id INTEGER NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, etab_id)
);
CREATE TABLE IF NOT EXISTS professeurs (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, user_id INTEGER,
    nom TEXT NOT NULL, prenom TEXT NOT NULL DEFAULT '', matiere TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '', telephone TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, nom TEXT NOT NULL, niveau TEXT NOT NULL DEFAULT '',
    prof_principal_id INTEGER REFERENCES professeurs(id) ON DELETE SET NULL,
    UNIQUE (etab_id, nom)
);
CREATE TABLE IF NOT EXISTS creneaux (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL,
    prof_id INTEGER NOT NULL REFERENCES professeurs(id) ON DELETE CASCADE,
    classe TEXT NOT NULL, matiere TEXT NOT NULL DEFAULT '', jour INTEGER NOT NULL,
    debut TEXT NOT NULL, fin TEXT NOT NULL, salle TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS absences (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL,
    prof_id INTEGER NOT NULL REFERENCES professeurs(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'absence', date_debut TEXT NOT NULL, date_fin TEXT NOT NULL,
    motif TEXT NOT NULL DEFAULT '', statut TEXT NOT NULL DEFAULT 'declaree'
);
CREATE TABLE IF NOT EXISTS remplacements (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL,
    absence_id INTEGER REFERENCES absences(id) ON DELETE CASCADE,
    creneau_id INTEGER NOT NULL REFERENCES creneaux(id) ON DELETE CASCADE,
    date TEXT NOT NULL, remplacant_id INTEGER REFERENCES professeurs(id) ON DELETE SET NULL,
    statut TEXT NOT NULL DEFAULT 'a_pourvoir'
);
CREATE TABLE IF NOT EXISTS perturbations (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, date TEXT NOT NULL,
    creneau_id INTEGER REFERENCES creneaux(id) ON DELETE CASCADE,
    classe TEXT NOT NULL DEFAULT '', type TEXT NOT NULL, detail TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, date TEXT NOT NULL, classe TEXT NOT NULL DEFAULT '',
    eleve TEXT NOT NULL DEFAULT '', description TEXT NOT NULL, suite TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT 'ouvert'
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, sender_id INTEGER NOT NULL REFERENCES users(id),
    sujet TEXT NOT NULL, corps TEXT NOT NULL, cible_type TEXT NOT NULL, cible TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS message_dest (
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lu_at TEXT, confirme_at TEXT, PRIMARY KEY (message_id, user_id)
);
CREATE TABLE IF NOT EXISTS reunions (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, titre TEXT NOT NULL, date TEXT NOT NULL,
    heure TEXT NOT NULL DEFAULT '', lieu TEXT NOT NULL DEFAULT '', ordre_du_jour TEXT NOT NULL DEFAULT '',
    organisateur_id INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS reunion_convoques (
    reunion_id INTEGER NOT NULL REFERENCES reunions(id) ON DELETE CASCADE,
    prof_id INTEGER NOT NULL REFERENCES professeurs(id) ON DELETE CASCADE,
    reponse TEXT NOT NULL DEFAULT '', PRIMARY KEY (reunion_id, prof_id)
);
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, titre TEXT NOT NULL, filename TEXT NOT NULL,
    stored TEXT NOT NULL, uploaded_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS taches (
    id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, titre TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    echeance TEXT, priorite TEXT NOT NULL DEFAULT 'normale', statut TEXT NOT NULL DEFAULT 'a_faire',
    assigne_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY, etab_id INTEGER, user_id INTEGER, user_nom TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creneaux_prof ON creneaux(prof_id, jour);
CREATE INDEX IF NOT EXISTS idx_remp_date ON remplacements(etab_id, date);
CREATE INDEX IF NOT EXISTS idx_abs_dates ON absences(etab_id, date_debut, date_fin);
"""


def connect():
    os.makedirs(DATA_DIR, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


# Migrations : on n'édite jamais une migration déjà livrée, on en AJOUTE une (numéro suivant).
# Chaque migration est un script SQL ; elle est appliquée une seule fois par base.
MIGRATIONS = [
    (1, SCHEMA),
    (2, "ALTER TABLE users ADD COLUMN must_change INTEGER NOT NULL DEFAULT 0;"),  # mot de passe temporaire à changer
    (3, """
        ALTER TABLE professeurs ADD COLUMN max_heures_jour INTEGER NOT NULL DEFAULT 6;
        CREATE TABLE IF NOT EXISTS besoins (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, classe TEXT NOT NULL, matiere TEXT NOT NULL,
            prof_id INTEGER NOT NULL REFERENCES professeurs(id) ON DELETE CASCADE,
            heures INTEGER NOT NULL, bloc INTEGER NOT NULL DEFAULT 1, salle TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS voeux (
            prof_id INTEGER NOT NULL REFERENCES professeurs(id) ON DELETE CASCADE,
            jour INTEGER NOT NULL, demi TEXT NOT NULL, niveau TEXT NOT NULL,
            PRIMARY KEY (prof_id, jour, demi)
        );
        CREATE TABLE IF NOT EXISTS propositions (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, created_at TEXT NOT NULL, auteur TEXT NOT NULL DEFAULT '',
            options TEXT NOT NULL, resultat TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'brouillon'
        );
    """),  # générateur d'emploi du temps : besoins, vœux, propositions
    (4, """
        CREATE TABLE IF NOT EXISTS reglages_planning (
            etab_id INTEGER PRIMARY KEY REFERENCES etablissements(id) ON DELETE CASCADE,
            classe_fermee TEXT NOT NULL DEFAULT '[]',      -- demi-journées sans cours pour les classes, ex. ["2:apres_midi"]
            max_classe_jour INTEGER NOT NULL DEFAULT 7,
            grille TEXT NOT NULL DEFAULT ''                -- une plage par ligne "HH:MM-HH:MM" ; vide = grille par défaut
        );
    """),  # réglages du générateur propres à chaque établissement
    (5, """
        CREATE TABLE IF NOT EXISTS eleves (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, nom TEXT NOT NULL, prenom TEXT NOT NULL DEFAULT '',
            classe TEXT NOT NULL DEFAULT '', responsable TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(etab_id, classe);
        CREATE TABLE IF NOT EXISTS modeles_documents (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, code TEXT NOT NULL DEFAULT '', titre TEXT NOT NULL, corps TEXT NOT NULL,
            ouvert_enseignants INTEGER NOT NULL DEFAULT 0,   -- 1 : les enseignants peuvent rédiger ce document
            avec_incident INTEGER NOT NULL DEFAULT 0         -- 1 : propose d'enregistrer aussi un incident
        );
        CREATE TABLE IF NOT EXISTS types_incident (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, libelle TEXT NOT NULL, texte TEXT NOT NULL DEFAULT '',
            gravite TEXT NOT NULL DEFAULT 'mineur'
        );
        CREATE TABLE IF NOT EXISTS documents_generes (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, modele_id INTEGER, type TEXT NOT NULL DEFAULT '', titre TEXT NOT NULL,
            eleve_id INTEGER REFERENCES eleves(id) ON DELETE SET NULL, eleve_nom TEXT NOT NULL DEFAULT '', prof_id INTEGER,
            contenu TEXT NOT NULL, auteur_id INTEGER, auteur TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, incident_id INTEGER
        );
        ALTER TABLE incidents ADD COLUMN eleve_id INTEGER;
    """),  # élèves, modèles de documents, types d'incident, documents rédigés
    (6, """
        CREATE TABLE IF NOT EXISTS reunion_eleves (
            reunion_id INTEGER NOT NULL REFERENCES reunions(id) ON DELETE CASCADE,
            eleve_id INTEGER NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
            PRIMARY KEY (reunion_id, eleve_id)
        );
    """),  # élèves convoqués à une réunion
    (7, """
        CREATE TABLE IF NOT EXISTS niveaux (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, nom TEXT NOT NULL, ordre INTEGER NOT NULL DEFAULT 0,
            UNIQUE (etab_id, nom)
        );
        INSERT OR IGNORE INTO niveaux(etab_id, nom, ordre) SELECT DISTINCT etab_id, niveau, 0 FROM classes WHERE niveau <> '';
    """),  # niveaux de classe gérés (6e, 2nde, Terminale…) ; reprise des niveaux déjà saisis
    (8, """
        PRAGMA foreign_keys = OFF;   -- reconstruction de la table users (nouveau rôle) sans effacer les données liées
        BEGIN;
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY, nom TEXT NOT NULL, email TEXT NOT NULL UNIQUE, pwd_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin','direction','cpe','enseignant','infirmier')),
            totp_secret TEXT, actif INTEGER NOT NULL DEFAULT 1, must_change INTEGER NOT NULL DEFAULT 0
        );
        INSERT INTO users_new(id,nom,email,pwd_hash,role,totp_secret,actif,must_change)
            SELECT id,nom,email,pwd_hash,role,totp_secret,actif,must_change FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        ALTER TABLE eleves ADD COLUMN date_naissance TEXT NOT NULL DEFAULT '';   -- AAAA-MM-JJ, statistiques uniquement
        ALTER TABLE eleves ADD COLUMN sexe TEXT NOT NULL DEFAULT '';             -- 'F', 'M' ou vide
        CREATE TABLE IF NOT EXISTS soins (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL,
            eleve_id INTEGER NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
            intitule TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', heure TEXT NOT NULL, duree INTEGER NOT NULL DEFAULT 15,
            date_debut TEXT NOT NULL, date_fin TEXT NOT NULL DEFAULT '',
            jours TEXT NOT NULL DEFAULT '',          -- '' = soin ponctuel (date_debut) ; sinon "0,2,4" = lundi, mercredi, vendredi
            actif INTEGER NOT NULL DEFAULT 1, cree_par TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS soins_realises (
            soin_id INTEGER NOT NULL REFERENCES soins(id) ON DELETE CASCADE, date TEXT NOT NULL,
            statut TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', par_nom TEXT NOT NULL DEFAULT '', at TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (soin_id, date)
        );
        CREATE TABLE IF NOT EXISTS passages (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, eleve_id INTEGER REFERENCES eleves(id) ON DELETE SET NULL,
            eleve_nom TEXT NOT NULL DEFAULT '', classe TEXT NOT NULL DEFAULT '', date TEXT NOT NULL, heure TEXT NOT NULL DEFAULT '',
            motif TEXT NOT NULL, soins TEXT NOT NULL DEFAULT '', decision TEXT NOT NULL DEFAULT '',
            parents_prevenus INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', par_nom TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS fiches_sante (
            eleve_id INTEGER PRIMARY KEY REFERENCES eleves(id) ON DELETE CASCADE, pai INTEGER NOT NULL DEFAULT 0,
            allergies TEXT NOT NULL DEFAULT '', traitements TEXT NOT NULL DEFAULT '', contact_urgence TEXT NOT NULL DEFAULT '',
            observations TEXT NOT NULL DEFAULT '', maj_at TEXT NOT NULL DEFAULT ''
        );
        COMMIT;
        PRAGMA foreign_keys = ON;
    """),  # date de naissance et sexe des élèves (pyramide des âges), rôle infirmier, infirmerie (soins, passages, fiches santé)
    (9, """
        CREATE TABLE IF NOT EXISTS soins_prevenus (
            soin_id INTEGER NOT NULL REFERENCES soins(id) ON DELETE CASCADE, date TEXT NOT NULL, at TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (soin_id, date)
        );
    """),  # professeurs prévenus qu'un élève quitte le cours pour un soin
    (10, """
        CREATE TABLE IF NOT EXISTS postes (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, nom TEXT NOT NULL, couleur TEXT NOT NULL DEFAULT '#D4D4D8',
            description TEXT NOT NULL DEFAULT '', ordre INTEGER NOT NULL DEFAULT 0, actif INTEGER NOT NULL DEFAULT 1,
            UNIQUE (etab_id, nom)
        );
        CREATE TABLE IF NOT EXISTS personnel (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, user_id INTEGER, nom TEXT NOT NULL, prenom TEXT NOT NULL DEFAULT '',
            categorie TEXT NOT NULL DEFAULT 'Assistant pédagogique', fonction TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
            telephone TEXT NOT NULL DEFAULT '', contrat_min INTEGER NOT NULL DEFAULT 0, max_jour_min INTEGER NOT NULL DEFAULT 480,
            planifie INTEGER NOT NULL DEFAULT 1, actif INTEGER NOT NULL DEFAULT 1, notes TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS personnel_postes (   -- rôles que l'agent peut tenir
            personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
            poste_id INTEGER NOT NULL REFERENCES postes(id) ON DELETE CASCADE, PRIMARY KEY (personnel_id, poste_id)
        );
        CREATE TABLE IF NOT EXISTS personnel_dispos (   -- indisponibilités impératives ('non') ou souhaits d'évitement ('souhait')
            id INTEGER PRIMARY KEY, personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
            jour INTEGER NOT NULL, debut TEXT NOT NULL, fin TEXT NOT NULL, niveau TEXT NOT NULL DEFAULT 'non', motif TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS besoins_postes (     -- combien d'agents sur quel poste, quel jour, à quelle heure
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, poste_id INTEGER NOT NULL REFERENCES postes(id) ON DELETE CASCADE,
            jour INTEGER NOT NULL, debut TEXT NOT NULL, fin TEXT NOT NULL, effectif INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS affectations (       -- planning hebdomadaire du personnel
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
            poste_id INTEGER NOT NULL REFERENCES postes(id) ON DELETE CASCADE, jour INTEGER NOT NULL,
            debut TEXT NOT NULL, fin TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'manuel'
        );
        CREATE INDEX IF NOT EXISTS idx_affectations ON affectations(etab_id, jour, personnel_id);
        CREATE TABLE IF NOT EXISTS planning_personnel_sauvegardes (   -- pour annuler une génération
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, created_at TEXT NOT NULL, auteur TEXT NOT NULL DEFAULT '',
            motif TEXT NOT NULL DEFAULT '', contenu TEXT NOT NULL
        );
    """),  # gestion du personnel : postes, assistants, indisponibilités, besoins, planning, sauvegardes
    (11, "ALTER TABLE professeurs ADD COLUMN service_min INTEGER NOT NULL DEFAULT 0;"),  # service hebdomadaire dû (0 = non renseigné)
    (12, """
        CREATE TABLE IF NOT EXISTS photos (   -- trombinoscope : une photo par personne (kind = eleve | prof | perso)
            kind TEXT NOT NULL, ref_id INTEGER NOT NULL, etab_id INTEGER NOT NULL, mime TEXT NOT NULL, data BLOB NOT NULL,
            at TEXT NOT NULL DEFAULT '', PRIMARY KEY (kind, ref_id)
        );
    """),
    (13, """
        CREATE TABLE IF NOT EXISTS entete_documents (   -- en-tête et pied de page communs à tous les documents de l'établissement
            etab_id INTEGER PRIMARY KEY REFERENCES etablissements(id) ON DELETE CASCADE,
            ligne_haut TEXT NOT NULL DEFAULT '', nom_affiche TEXT NOT NULL DEFAULT '', adresse TEXT NOT NULL DEFAULT '',
            telephone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', site TEXT NOT NULL DEFAULT '',
            pied TEXT NOT NULL DEFAULT '', ville TEXT NOT NULL DEFAULT '', logo_mime TEXT NOT NULL DEFAULT '', logo BLOB
        );
        CREATE TABLE IF NOT EXISTS signataires (        -- personnes qui signent les documents (cochées par défaut ou à la demande)
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
            nom TEXT NOT NULL, fonction TEXT NOT NULL DEFAULT '', ordre INTEGER NOT NULL DEFAULT 0,
            par_defaut INTEGER NOT NULL DEFAULT 1, actif INTEGER NOT NULL DEFAULT 1
        );
        ALTER TABLE documents_generes ADD COLUMN signataires TEXT NOT NULL DEFAULT '[]';   -- copie figée [[nom, fonction], ...]
    """),
    (14, """
        CREATE TABLE IF NOT EXISTS volumes_horaires (   -- dotation horaire hebdomadaire d'une matière pour un niveau (6e, 2nde…)
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
            niveau TEXT NOT NULL, matiere TEXT NOT NULL, heures INTEGER NOT NULL, bloc INTEGER NOT NULL DEFAULT 1,
            UNIQUE (etab_id, niveau, matiere)
        );
        ALTER TABLE besoins ADD COLUMN source TEXT NOT NULL DEFAULT 'manuel';   -- 'volumes' : besoin produit par les volumes horaires
    """),
]


POSTES_DEFAUT = [("Service", "#4ADE80", "Vie scolaire : accueil, billets, téléphone"), ("Étude", "#FDE047", "Surveillance de la salle d'étude / permanence"),
                 ("Foyer", "#67E8F9", "Foyer des élèves"), ("Cour", "#FB923C", "Surveillance de la cour et des récréations"),
                 ("Portail", "#A5B4FC", "Entrées et sorties"), ("Self", "#F0ABFC", "Restaurant scolaire"),
                 ("Bureau", "#FCA5A5", "Travail administratif"), ("Renfort", "#D4D4D8", "Remplacement et appui")]


def installer_postes(con, etab_id):
    """Postes proposés par défaut (modifiables) dans un établissement qui n'en a pas encore."""
    if not con.execute("SELECT 1 FROM postes WHERE etab_id=?", (etab_id,)).fetchone():
        for ordre, (nom, couleur, description) in enumerate(POSTES_DEFAUT, 1):
            con.execute("INSERT INTO postes(etab_id,nom,couleur,description,ordre) VALUES (?,?,?,?,?)", (etab_id, nom, couleur, description, ordre))
    con.commit()


def init_db(extra_sql=()):
    con = connect()
    con.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at TEXT)")
    deja = {r[0] for r in con.execute("SELECT version FROM schema_version")}
    for version, sql in MIGRATIONS:
        if version not in deja:
            con.executescript(sql)
            con.execute("INSERT INTO schema_version VALUES (?, datetime('now'))", (version,))
            con.commit()
    from .modeles_defaut import installer
    for (eid,) in con.execute("SELECT id FROM etablissements").fetchall():  # modèles et postes par défaut pour chaque établissement
        installer(con, eid)
        installer_postes(con, eid)
    for sql in extra_sql:  # tables des extensions (idempotentes)
        con.executescript(sql)
    con.commit()
    con.close()


def create_admin(email, password, nom, etab_nom):
    con = connect()
    etab = con.execute("SELECT id FROM etablissements WHERE nom=?", (etab_nom,)).fetchone()
    etab_id = etab["id"] if etab else con.execute("INSERT INTO etablissements(nom) VALUES (?)", (etab_nom,)).lastrowid
    uid = con.execute(
        "INSERT INTO users(nom,email,pwd_hash,role) VALUES (?,?,?,'admin')",
        (nom, email.lower(), generate_password_hash(password)),
    ).lastrowid
    con.execute("INSERT INTO user_etabs VALUES (?,?)", (uid, etab_id))
    con.commit()
    from .modeles_defaut import installer
    installer(con, etab_id)
    con.close()


def seed_demo(password="demo1234"):
    """Jeu de données fictives (personnes imaginaires) pour démontrer l'application."""
    from datetime import datetime

    con = connect()
    h = generate_password_hash(password)
    now = datetime.now()
    today = date.today()
    d = lambda n: (today + timedelta(days=n)).isoformat()
    ts = lambda minutes_ago: (now - timedelta(minutes=minutes_ago)).isoformat(timespec="minutes")
    e1 = con.execute("INSERT INTO etablissements(nom) VALUES ('Collège Victor Hugo')").lastrowid
    e2 = con.execute("INSERT INTO etablissements(nom) VALUES ('Lycée Jean Moulin')").lastrowid

    def user(nom, email, role, etabs):
        uid = con.execute("INSERT INTO users(nom,email,pwd_hash,role) VALUES (?,?,?,?)", (nom, email, h, role)).lastrowid
        for e in etabs:
            con.execute("INSERT INTO user_etabs VALUES (?,?)", (uid, e))
        return uid

    cpe = user("Camille Durand (CPE)", "cpe@demo.fr", "cpe", [e1, e2])
    direction = user("Dominique Leroy (Direction)", "direction@demo.fr", "direction", [e1])
    user("Alex Morel (Administrateur)", "admin@demo.fr", "admin", [e1, e2])

    profs = [
        ("Martin", "Alice", "Mathématiques"), ("Bernard", "Hugo", "Français"),
        ("Petit", "Léa", "Histoire-Géographie"), ("Robert", "Paul", "Anglais"),
        ("Richard", "Emma", "SVT"), ("Moreau", "Louis", "Physique-Chimie"),
        ("Simon", "Chloé", "EPS"), ("Laurent", "Noah", "Mathématiques"),
        ("Fournier", "Inès", "Arts plastiques"), ("Girard", "Théo", "Technologie"),
        ("Besson", "Claire", "Français"), ("Lemaire", "Sophie", "Histoire-Géographie"),
        ("Carpentier", "Julien", "Anglais"), ("Navarro", "Lucia", "Espagnol"),
        ("Dupuis", "Antoine", "Musique"), ("Morin", "Karim", "EPS"),
    ]
    ids, uids = [], []
    for i, (nom, prenom, mat) in enumerate(profs, 1):
        email = f"prof{i}@demo.fr"
        uid = user(f"{prenom} {nom}", email, "enseignant", [e1])
        pid = con.execute(
            "INSERT INTO professeurs(etab_id,user_id,nom,prenom,matiere,email,telephone,notes) VALUES (?,?,?,?,?,?,?,?)",
            (e1, uid, nom, prenom, mat, email, f"06 12 34 56 {i:02d}",
             "Référent sorties pédagogiques." if i == 3 else ""),
        ).lastrowid
        ids.append(pid)
        uids.append(uid)
    uid_de = dict(zip(ids, uids))

    classes = ["6A", "6B", "5A", "5B", "4A", "4B", "3A", "3B"]
    for ordre, nv in enumerate(["6e", "5e", "4e", "3e"], 1):
        con.execute("INSERT INTO niveaux(etab_id,nom,ordre) VALUES (?,?,?)", (e1, nv, ordre))
    for i, c in enumerate(classes):   # professeur principal = professeur de Français de la classe
        con.execute("INSERT INTO classes(etab_id,nom,niveau,prof_principal_id) VALUES (?,?,?,?)", (e1, c, c[0] + "e", ids[1 if i < 4 else 10]))

    # Besoins horaires (24 h par classe) : matière -> (heures par classe, séances de 2 h ?, salle spécialisée)
    matieres = {"Mathématiques": (4, 1, ""), "Français": (4, 1, ""), "Histoire-Géographie": (3, 1, ""), "Anglais": (3, 1, ""),
                "Espagnol": (2, 1, ""), "SVT": (1, 1, "Labo SVT"), "Physique-Chimie": (1, 1, "Labo PC"), "Technologie": (1, 1, "Salle techno"),
                "Arts plastiques": (1, 1, "Salle arts"), "Musique": (1, 1, "Salle musique"), "EPS": (3, 2, "Gymnase")}
    affectation = {"Mathématiques": [(0, classes[:4]), (7, classes[4:])], "Français": [(1, classes[:4]), (10, classes[4:])],
                   "Histoire-Géographie": [(2, classes[:4]), (11, classes[4:])], "Anglais": [(3, classes[:4]), (12, classes[4:])],
                   "Espagnol": [(13, classes)], "SVT": [(4, classes)], "Physique-Chimie": [(5, classes)], "Technologie": [(9, classes)],
                   "Arts plastiques": [(8, classes)], "Musique": [(14, classes)], "EPS": [(6, classes[:4]), (15, classes[4:])]}
    besoins_gen = []
    for matiere, (heures, bloc, salle) in matieres.items():
        for idx_prof, cls in affectation[matiere]:
            for c in cls:
                bid = con.execute("INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc,salle) VALUES (?,?,?,?,?,?,?)",
                                  (e1, c, matiere, ids[idx_prof], heures, bloc, salle)).lastrowid
                besoins_gen.append({"id": bid, "classe": c, "matiere": matiere, "prof_id": ids[idx_prof], "heures": heures, "bloc": bloc, "salle": salle})

    # Vœux des professeurs (ex. mercredi après-midi impératif pour certains)
    voeux_demo = [(ids[0], 2, "apres_midi", "non"), (ids[1], 0, "matin", "souhait"), (ids[2], 4, "apres_midi", "souhait"),
                  (ids[3], 3, "matin", "non"), (ids[6], 1, "matin", "souhait"), (ids[7], 2, "apres_midi", "non")]
    for pid, jour, demi, niveau in voeux_demo:
        con.execute("INSERT INTO voeux VALUES (?,?,?,?)", (pid, jour, demi, niveau))

    # Emploi du temps complet généré par le moteur de planification (collège : mercredi après-midi sans cours, réglage de l'établissement)
    from . import planning
    grille = planning.construire_grille()
    horaires = [(c["debut"], c["fin"]) for c in grille]
    profs_gen = {pid: {"nom": f"{profs[k][1]} {profs[k][0]}", "max_jour": 6, "voeux": {}} for k, pid in enumerate(ids)}
    for pid, jour, demi, niveau in voeux_demo:
        profs_gen[pid]["voeux"][(jour, demi)] = niveau
    con.execute("INSERT INTO reglages_planning(etab_id,classe_fermee,max_classe_jour,grille) VALUES (?,?,?,?)", (e1, '["2:apres_midi"]', 7, ""))
    res1 = planning.generer(grille, besoins_gen, profs_gen, {"classe_fermee": {(2, "apres_midi")}, "max_classe_jour": 7}, essais=40, temps_max=5, graine=2026)
    salle_classe = {c: f"B{10 + k}" for k, c in enumerate(classes)}
    for x in res1["placements"]:
        con.execute("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                    (e1, x["prof_id"], x["classe"], x["matiere"], x["jour"], grille[x["debut_idx"]]["debut"],
                     grille[x["debut_idx"] + x["longueur"] - 1]["fin"], x["salle"] or salle_classe[x["classe"]]))

    def absence(prof, typ, a, b, motif, statut="validee"):
        return con.execute("INSERT INTO absences(etab_id,prof_id,type,date_debut,date_fin,motif,statut) VALUES (?,?,?,?,?,?,?)",
                           (e1, prof, typ, a, b, motif, statut)).lastrowid

    abs_ids = [
        absence(ids[0], "absence", d(0), d(1), "Maladie"),
        absence(ids[3], "indisponibilite", d(3), d(3), "Sortie scolaire"),
        absence(ids[6], "absence", d(5), d(7), "Formation", "declaree"),
        absence(ids[4], "absence", d(-9), d(-8), "Maladie"),
        absence(ids[1], "absence", d(-3), d(-3), "Rendez-vous médical"),
        absence(ids[10], "absence", d(-2), d(4), "Maladie"),
    ]
    # Remplacements : un par cours des professeurs absents, pourvus avec un professeur réellement libre
    def libre(prof_absent, jour, debut, fin, depart):
        iso = jour.isoformat()
        for k in range(len(ids)):
            pid = ids[(depart + k) % len(ids)]
            if pid == prof_absent:
                continue
            if con.execute("SELECT 1 FROM absences WHERE prof_id=? AND date_debut<=? AND date_fin>=?", (pid, iso, iso)).fetchone():
                continue
            if con.execute("SELECT 1 FROM creneaux WHERE prof_id=? AND jour=? AND debut<? AND fin>?", (pid, jour.weekday(), fin, debut)).fetchone():
                continue
            if con.execute("SELECT 1 FROM remplacements r JOIN creneaux c ON c.id=r.creneau_id WHERE r.remplacant_id=? AND r.date=? "
                           "AND r.statut IN ('assigne','effectue') AND c.debut<? AND c.fin>?", (pid, iso, fin, debut)).fetchone():
                continue
            return pid
        return None

    a_notifier = []
    for aid in abs_ids:
        a = con.execute("SELECT * FROM absences WHERE id=?", (aid,)).fetchone()
        if a["type"] != "absence":
            continue
        jour = date.fromisoformat(a["date_debut"])
        while jour <= date.fromisoformat(a["date_fin"]):
            if jour.weekday() < 5:
                for n, c in enumerate(con.execute("SELECT * FROM creneaux WHERE prof_id=? AND jour=? ORDER BY debut", (a["prof_id"], jour.weekday())).fetchall()):
                    remp = libre(a["prof_id"], jour, c["debut"], c["fin"], c["id"])
                    if jour < today:
                        statut = "effectue" if remp else "annule"
                    elif a["statut"] == "declaree" or n % 3 == 1:
                        statut, remp = "a_pourvoir", None            # reste à pourvoir (absence encore à valider, ou en cours de recherche)
                    elif jour == today and n % 4 == 3:
                        statut, remp = "annule", None                # cours annulé
                    else:
                        statut = "assigne" if remp else "a_pourvoir"
                    cur = con.execute("INSERT INTO remplacements(etab_id,absence_id,creneau_id,date,remplacant_id,statut) VALUES (?,?,?,?,?,?)",
                                      (e1, aid, c["id"], jour.isoformat(), remp, statut))
                    if statut == "assigne":
                        a_notifier.append((remp, c, jour, a["prof_id"]))
            jour += timedelta(days=1)

    cr = con.execute("SELECT id, classe FROM creneaux WHERE etab_id=? AND jour=? ORDER BY debut", (e1, (today + timedelta(days=1)).weekday() % 5)).fetchall()
    if cr:
        con.execute("INSERT INTO perturbations(etab_id,date,creneau_id,classe,type,detail) VALUES (?,?,?,?,?,?)",
                    (e1, d(1), cr[0]["id"], cr[0]["classe"], "salle_indisponible", "Salle fermée : dégât des eaux"))
    if len(cr) > 3:
        con.execute("INSERT INTO perturbations(etab_id,date,creneau_id,classe,type,detail) VALUES (?,?,?,?,?,?)",
                    (e1, d(1), cr[3]["id"], cr[3]["classe"], "deplace", "Déplacé en salle B15"))

    for dt, classe, eleve, desc, suite, statut in [
        (d(0), "5A", "Élève A.", "Retards répétés en première heure (3 cette semaine).", "Entretien avec la famille prévu jeudi.", "ouvert"),
        (d(-2), "4B", "Élève B.", "Altercation dans la cour à la récréation.", "Médiation réalisée, information des familles.", "clos"),
        (d(-1), "6A", "Élèves C. et D.", "Matériel dégradé en salle B12.", "En attente de l'avis du principal.", "ouvert"),
    ]:
        con.execute("INSERT INTO incidents(etab_id,date,classe,eleve,description,suite,statut) VALUES (?,?,?,?,?,?,?)",
                    (e1, dt, classe, eleve, desc, suite, statut))

    # Messagerie : envois du CPE avec lectures et confirmations variées
    def message(sender, sujet, corps, typ, cible, dest, minutes, lus=0, confirmes=0):
        mid = con.execute("INSERT INTO messages(etab_id,sender_id,sujet,corps,cible_type,cible,created_at) VALUES (?,?,?,?,?,?,?)",
                          (e1, sender, sujet, corps, typ, cible, ts(minutes))).lastrowid
        for k, u in enumerate(dest):
            con.execute("INSERT INTO message_dest(message_id,user_id,lu_at,confirme_at) VALUES (?,?,?,?)",
                        (mid, u, ts(minutes - 30) if k < lus else None, ts(minutes - 45) if k < confirmes else None))

    message(cpe, "Rappel : remontée des absences avant 9 h",
            "Bonjour à tous,\nmerci de signaler toute absence d'élève dans le logiciel avant 9 h.\nCordialement,\nLa vie scolaire", "tous", "", uids, 3000, 7, 5)
    message(cpe, "Conseil de classe 3A : bulletins à saisir",
            "Les appréciations sont à saisir pour vendredi.", "classe", "3A", uids[:6], 1500, 3, 1)
    message(cpe, "Remplacement du jour", "Pouvez-vous prendre le cours de 6B de 9 h à 10 h ? Merci.", "individuel", str(uids[7]), [uids[7]], 90, 0, 0)
    message(uids[2], "Sortie au musée jeudi", "Je serai absente jeudi après-midi pour la sortie avec les 5A.", "individuel", str(cpe), [cpe], 600, 0, 0)

    # Messages automatiques liés aux absences et remplacements (communication entre les deux modules)
    jours_fr = ["lun.", "mar.", "mer.", "jeu.", "ven."]
    for remp, c, jour, absent in a_notifier[:6]:
        nom_absent = next(f"{profs[k][1]} {profs[k][0]}" for k, pid in enumerate(ids) if pid == absent)
        mid = con.execute("INSERT INTO messages(etab_id,sender_id,sujet,corps,cible_type,cible,created_at) VALUES (?,?,?,?,?,?,?)",
                          (e1, cpe, f"Remplacement : {c['classe']} {jours_fr[jour.weekday()]} {jour.strftime('%d/%m')} à {c['debut']}",
                           f"Vous êtes désigné(e) pour remplacer {nom_absent}.\n\nCours : {c['classe']} ({c['matiere']})\nDate : {jour.strftime('%d/%m/%Y')}, {c['debut']}–{c['fin']}\n"
                           f"Salle : {c['salle']}\n\nMessage automatique de la vie scolaire.", "auto", "", ts(40))).lastrowid
        con.execute("INSERT INTO message_dest(message_id,user_id) VALUES (?,?)", (mid, uid_de[remp]))
    mid = con.execute("INSERT INTO messages(etab_id,sender_id,sujet,corps,cible_type,cible,created_at) VALUES (?,?,?,?,?,?,?)",
                      (e1, uids[6], "Absence déclarée : Chloé Simon", f"Chloé Simon déclare une absence du {date.fromisoformat(d(5)).strftime('%d/%m/%Y')} au {date.fromisoformat(d(7)).strftime('%d/%m/%Y')} (Formation).\n"
                       "Les remplacements à prévoir sont listés dans l'onglet Remplacements.", "auto", "", ts(180))).lastrowid
    for u in (cpe, direction):
        con.execute("INSERT INTO message_dest(message_id,user_id) VALUES (?,?)", (mid, u))

    # Réunions et convocations
    r1 = con.execute("INSERT INTO reunions(etab_id,titre,date,heure,lieu,ordre_du_jour,organisateur_id) VALUES (?,?,?,?,?,?,?)",
                     (e1, "Conseil de classe 3A", d(2), "17:00", "Salle des professeurs", "1. Bilan du trimestre\n2. Orientation\n3. Cas particuliers", cpe)).lastrowid
    r2 = con.execute("INSERT INTO reunions(etab_id,titre,date,heure,lieu,ordre_du_jour,organisateur_id) VALUES (?,?,?,?,?,?,?)",
                     (e1, "Réunion équipe 6A", d(6), "12:30", "Salle B10", "Harmonisation des évaluations.", cpe)).lastrowid
    for k, pid in enumerate(ids[:6]):
        con.execute("INSERT INTO reunion_convoques(reunion_id,prof_id,reponse) VALUES (?,?,?)", (r1, pid, ["oui", "oui", "non", "", "oui", ""][k]))
    for k, pid in enumerate(ids[2:6]):
        con.execute("INSERT INTO reunion_convoques(reunion_id,prof_id,reponse) VALUES (?,?,?)", (r2, pid, ["oui", "", "", "oui"][k]))

    for titre, desc, ech, prio, statut in [
        ("Relancer les familles des élèves absents", "Liste fournie par le secrétariat.", d(-1), "haute", "a_faire"),
        ("Préparer le conseil de classe 3A", "Statistiques d'absences et incidents.", d(1), "haute", "a_faire"),
        ("Mettre à jour l'emploi du temps de 4B", "Changement de salle depuis lundi.", d(4), "normale", "a_faire"),
        ("Commander les fournitures vie scolaire", "", d(10), "basse", "a_faire"),
        ("Envoyer le bilan des retards au principal", "", d(-4), "normale", "faite"),
    ]:
        con.execute("INSERT INTO taches(etab_id,titre,description,echeance,priorite,statut,assigne_id) VALUES (?,?,?,?,?,?,?)",
                    (e1, titre, desc, ech, prio, statut, cpe))

    os.makedirs(os.path.join(DATA_DIR, "uploads"), exist_ok=True)
    for titre, nom, contenu in [
        ("Règlement intérieur (extrait)", "reglement_interieur.txt", "Extrait fictif du règlement intérieur - document de démonstration."),
        ("Procédure d'absence d'un professeur", "procedure_absence.txt", "1. Signaler l'absence avant 8 h.\n2. La vie scolaire organise le remplacement.\n(Document de démonstration.)"),
    ]:
        stored = f"demo_{nom}"
        with open(os.path.join(DATA_DIR, "uploads", stored), "w", encoding="utf-8") as f:
            f.write(contenu)
        con.execute("INSERT INTO documents(etab_id,titre,filename,stored,uploaded_by,created_at) VALUES (?,?,?,?,?,?)",
                    (e1, titre, nom, stored, cpe, ts(5000)))

    for k, (action, detail) in enumerate([("connexion", "cpe@demo.fr"), ("absence enregistrée", "Martin 2 jours (absence)"),
                                          ("remplacement assigné", "6B 9h-10h → Laurent"), ("réunion créée", "Conseil de classe 3A"),
                                          ("message envoyé", "tous (10 destinataires)")]):
        con.execute("INSERT INTO audit(etab_id,user_id,user_nom,action,detail,created_at) VALUES (?,?,?,?,?,?)",
                    (e1, cpe, "Camille Durand (CPE)", action, detail, ts(300 - k * 40)))

    # Élèves fictifs (effectifs variables par classe) : sexe cohérent avec le prénom, âges selon le niveau
    import random
    rng = random.Random(2026)
    filles = ["Léa", "Emma", "Chloé", "Inès", "Jade", "Manon", "Camille", "Zoé", "Sarah", "Lina", "Eva", "Clara", "Louise", "Alice", "Rose", "Anna", "Mila", "Nina"]
    garcons = ["Lucas", "Nathan", "Hugo", "Louis", "Gabriel", "Raphaël", "Tom", "Arthur", "Jules", "Adam", "Noé", "Mathis", "Paul", "Enzo", "Léo", "Maël", "Ethan", "Sacha"]
    noms = ["Dubois", "Lambert", "Fontaine", "Rousseau", "Vincent", "Muller", "Lefèvre", "Faure", "André", "Mercier", "Blanc", "Guérin", "Boyer", "Garnier",
            "Chevalier", "François", "Perrin", "Morel", "Clément", "Gauthier", "Roche", "Noël", "Meyer", "Lopez", "Colin", "Aubert", "Renard", "Marchand"]
    age_niveau = {"6": 11, "5": 12, "4": 13, "3": 14}
    deja, k = set(), 0
    for c, effectif, part_filles in zip(classes, [24, 26, 23, 25, 22, 24, 26, 23], [0.58, 0.46, 0.52, 0.44, 0.55, 0.5, 0.42, 0.56]):
        for _ in range(effectif):
            fille = rng.random() < part_filles
            while True:
                pr, nm = rng.choice(filles if fille else garcons), rng.choice(noms)
                if (pr, nm) not in deja:
                    deja.add((pr, nm))
                    break
            age = age_niveau[c[0]] + (1 if rng.random() < 0.12 else 0) - (1 if rng.random() < 0.03 else 0)   # quelques redoublants / élèves en avance
            naissance = today - timedelta(days=int(age * 365.25) + rng.randint(0, 364))
            con.execute("INSERT INTO eleves(etab_id,nom,prenom,classe,responsable,contact,date_naissance,sexe) VALUES (?,?,?,?,?,?,?,?)",
                        (e1, nm, pr, c, f"Famille {nm}", f"famille.{nm.lower().replace('è', 'e').replace('é', 'e')}{k}@exemple.fr",
                         naissance.isoformat(), "F" if fille else "M"))
            k += 1

    for (eid,) in con.execute("SELECT id FROM eleves WHERE etab_id=? AND classe='3A' ORDER BY id LIMIT 2", (e1,)).fetchall():
        con.execute("INSERT INTO reunion_eleves VALUES (?,?)", (r1, eid))   # délégués convoqués au conseil de classe

    # Second établissement (lycée) : même fonctionnement, données propres (niveaux, classes, équipe, emplois du temps, élèves)
    profs2 = [("Garcia", "Léo", "Philosophie"), ("Roux", "Manon", "Lettres"), ("Blanc", "Adam", "Mathématiques"), ("Henry", "Julie", "Histoire-Géographie"),
              ("Perez", "Karim", "Anglais"), ("Marchand", "Élise", "SVT"), ("Noël", "Victor", "Physique-Chimie"), ("Aubert", "Sonia", "Sciences économiques")]
    ids2 = [con.execute("INSERT INTO professeurs(etab_id,nom,prenom,matiere,email) VALUES (?,?,?,?,?)",
                        (e2, nom, prenom, mat, f"{prenom.lower().replace('é', 'e')}@demo.fr")).lastrowid for nom, prenom, mat in profs2]
    classes2 = [("2nde1", "2nde"), ("1ère S", "1ère"), ("Term ES", "Terminale")]
    for ordre, (c, nv) in enumerate(classes2, 1):
        con.execute("INSERT INTO niveaux(etab_id,nom,ordre) VALUES (?,?,?)", (e2, nv, ordre))
        con.execute("INSERT INTO classes(etab_id,nom,niveau,prof_principal_id) VALUES (?,?,?,?)", (e2, c, nv, ids2[0 if nv == "Terminale" else 1]))
    # Besoins et emploi du temps du lycée (générés par le moteur, aucun réglage particulier : rien n'est supposé)
    besoins2 = [("2nde1", "Lettres", 4, 1), ("2nde1", "Mathématiques", 4, 2), ("2nde1", "Histoire-Géographie", 3, 3), ("2nde1", "Anglais", 3, 4),
                ("2nde1", "SVT", 2, 5), ("2nde1", "Physique-Chimie", 3, 6), ("2nde1", "Sciences économiques", 2, 7),
                ("1ère S", "Lettres", 4, 1), ("1ère S", "Mathématiques", 5, 2), ("1ère S", "Histoire-Géographie", 3, 3), ("1ère S", "Anglais", 3, 4),
                ("1ère S", "SVT", 3, 5), ("1ère S", "Physique-Chimie", 4, 6),
                ("Term ES", "Philosophie", 4, 0), ("Term ES", "Mathématiques", 4, 2), ("Term ES", "Histoire-Géographie", 3, 3), ("Term ES", "Anglais", 3, 4),
                ("Term ES", "Sciences économiques", 5, 7)]
    besoins2_gen = []
    for c, matiere, heures, idx in besoins2:
        bid = con.execute("INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc,salle) VALUES (?,?,?,?,?,?,?)",
                          (e2, c, matiere, ids2[idx], heures, 1, "")).lastrowid
        besoins2_gen.append({"id": bid, "classe": c, "matiere": matiere, "prof_id": ids2[idx], "heures": heures, "bloc": 1, "salle": ""})
    profs2_gen = {pid: {"nom": f"{profs2[k][1]} {profs2[k][0]}", "max_jour": 6, "voeux": {}} for k, pid in enumerate(ids2)}
    res2 = planning.generer(grille, besoins2_gen, profs2_gen, {"classe_fermee": set(), "max_classe_jour": 8}, essais=30, temps_max=3, graine=7)
    for x in res2["placements"]:
        con.execute("INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                    (e2, x["prof_id"], x["classe"], x["matiere"], x["jour"], grille[x["debut_idx"]]["debut"],
                     grille[x["debut_idx"] + x["longueur"] - 1]["fin"], f"L{20 + classes2.index(next(cc for cc in classes2 if cc[0] == x['classe']))}"))
    k2 = 0
    for c, nv in classes2:                   # 8 élèves par classe, 15 à 18 ans
        base_age = {"2nde": 15, "1ère": 16, "Terminale": 17}[nv]
        for _ in range(8):
            fille2 = rng.random() < 0.55
            while True:
                pr, nm = rng.choice(filles if fille2 else garcons), rng.choice(noms)
                if (pr, nm) not in deja:
                    deja.add((pr, nm))
                    break
            con.execute("INSERT INTO eleves(etab_id,nom,prenom,classe,responsable,contact,date_naissance,sexe) VALUES (?,?,?,?,?,?,?,?)",
                        (e2, nm, pr, c, f"Famille {nm}", "", (today - timedelta(days=int((base_age + (1 if rng.random() < 0.15 else 0)) * 365.25) + rng.randint(0, 364))).isoformat(),
                         "F" if fille2 else "M"))
            k2 += 1
    # Personnel : assistants pédagogiques, postes (rôles), besoins, indisponibilités, planning généré par le moteur
    from . import planning_personnel as pp
    installer_postes(con, e1)
    installer_postes(con, e2)
    poste_id = {nom: con.execute("SELECT id FROM postes WHERE etab_id=? AND nom=?", (e1, nom)).fetchone()[0] for nom, _, _ in POSTES_DEFAUT}
    mn = pp.minutes
    equipe_aed = [("Dumont", "Albert", 20, ["Service", "Étude", "Portail", "Cour"]), ("Leclerc", "Bernard", 16, ["Foyer", "Self", "Cour", "Étude"]),
                  ("Vidal", "Claudine", 20, ["Service", "Étude", "Foyer", "Portail"]), ("Marchal", "Daniela", 16, ["Self", "Cour", "Foyer", "Service"]),
                  ("Pons", "Ernest", 14, ["Étude", "Cour", "Portail", "Self"]), ("Benali", "Fatima", 16, ["Service", "Étude", "Foyer", "Self", "Cour"]),
                  ("Rey", "Gaspard", 14, ["Service", "Étude", "Cour", "Portail"]), ("Colin", "Hélène", 12, ["Renfort", "Étude", "Foyer", "Cour", "Bureau"])]
    dispos_aed = [(0, 2, "12:00", "19:00", "non", "Études universitaires"), (3, 0, "07:00", "12:00", "non", "Cours à l'université"),
                  (2, 0, "16:00", "19:00", "souhait", "Garde d'enfant"), (2, 1, "16:00", "19:00", "souhait", "Garde d'enfant"),
                  (2, 3, "16:00", "19:00", "souhait", "Garde d'enfant"), (4, 4, "14:00", "19:00", "non", "Rendez-vous récurrent")]
    ag_id = []
    for nom, prenom, contrat, roles in equipe_aed:
        pid_ = con.execute("INSERT INTO personnel(etab_id,nom,prenom,categorie,fonction,email,telephone,contrat_min,planifie) VALUES (?,?,?,?,?,?,?,?,1)",
                           (e1, nom, prenom, "Assistant pédagogique", "Assistant d'éducation", f"{prenom.lower().replace('é', 'e')}.{nom.lower()}@college-demo.fr",
                            f"06 20 00 00 {len(ag_id) + 1:02d}", contrat * 60)).lastrowid
        ag_id.append(pid_)
        for r in roles:
            con.execute("INSERT INTO personnel_postes VALUES (?,?)", (pid_, poste_id[r]))
    for nom, prenom, cat, fonction in [("Gilbert", "Martine", "Agent d'accueil", "Accueil et standard"), ("Fabre", "Nadia", "Personnel administratif", "Secrétaire de direction"),
                                       ("Roche", "Patrick", "Agent technique", "Maintenance des bâtiments")]:
        con.execute("INSERT INTO personnel(etab_id,nom,prenom,categorie,fonction,email,planifie) VALUES (?,?,?,?,?,?,0)",
                    (e1, nom, prenom, cat, fonction, f"{prenom.lower()}.{nom.lower()}@college-demo.fr"))
    for idx, jour, d1, d2, niveau, motif in dispos_aed:
        con.execute("INSERT INTO personnel_dispos(personnel_id,jour,debut,fin,niveau,motif) VALUES (?,?,?,?,?,?)", (ag_id[idx], jour, d1, d2, niveau, motif))
    besoins_pp = []

    def besoin(poste, jours, d1, d2, effectif=1):
        for j in jours:
            bid = con.execute("INSERT INTO besoins_postes(etab_id,poste_id,jour,debut,fin,effectif) VALUES (?,?,?,?,?,?)", (e1, poste_id[poste], j, d1, d2, effectif)).lastrowid
            besoins_pp.append({"id": bid, "poste_id": poste_id[poste], "jour": j, "debut": mn(d1), "fin": mn(d2), "effectif": effectif})
    besoin("Portail", range(5), "07:45", "08:15"); besoin("Portail", range(5), "16:00", "16:30")
    besoin("Cour", range(5), "10:00", "10:15", 2); besoin("Cour", [0, 1, 3, 4], "12:15", "13:15", 2)
    besoin("Self", [0, 1, 3, 4], "12:15", "13:45", 2); besoin("Foyer", [0, 1, 3, 4], "12:15", "14:00")
    besoin("Étude", range(5), "08:00", "12:00"); besoin("Étude", [0, 1, 3, 4], "14:00", "16:00"); besoin("Étude", [0, 1, 3, 4], "16:00", "17:00", 2)
    besoin("Service", [0, 1, 3, 4], "08:00", "17:00"); besoin("Service", [2], "08:00", "12:15")
    agents_pp = {ag_id[k]: {"nom": f"{prenom} {nom}", "contrat": contrat * 60, "max_jour": 480, "postes": {poste_id[r] for r in roles},
                            "dispos": [(j, mn(a), mn(b), n) for (i2, j, a, b, n, _) in dispos_aed if i2 == k]}
                 for k, (nom, prenom, contrat, roles) in enumerate(equipe_aed)}
    res_pp = pp.generer(besoins_pp, agents_pp, options={"marge": 0, "bloc_max": 180}, graine=3, temps_max=3)
    for a in res_pp["affectations"]:
        con.execute("INSERT INTO affectations(etab_id,personnel_id,poste_id,jour,debut,fin,source) VALUES (?,?,?,?,?,?,'auto')",
                    (e1, a["personnel_id"], a["poste_id"], a["jour"], pp.hhmm(a["debut"]), pp.hhmm(a["fin"])))
    for nom, prenom in [("Garnier", "Théo"), ("Lopes", "Inès")]:   # lycée : équipe réduite, sans planning
        con.execute("INSERT INTO personnel(etab_id,nom,prenom,categorie,fonction,contrat_min,planifie) VALUES (?,?,?,?,?,?,1)",
                    (e2, nom, prenom, "Assistant pédagogique", "Assistant d'éducation", 20 * 60))

    # Infirmerie : compte infirmier, fiches santé fictives, soins programmés, passages
    infirmiere = user("Sophie Lambert (Infirmière)", "infirmerie@demo.fr", "infirmier", [e1])
    ts_now = datetime.now().isoformat(timespec="minutes")
    eleves_e1 = con.execute("SELECT id, nom, prenom, classe FROM eleves WHERE etab_id=? ORDER BY id", (e1,)).fetchall()
    pick = lambda n: eleves_e1[(n * 17 + 5) % len(eleves_e1)]
    fiches = [(pick(1), 1, "Arachides, fruits à coque", "Stylo auto-injecteur d'adrénaline (dans le sac)", "Mère : 06 00 00 10 01", "PAI allergie alimentaire : ne pas servir de plat contenant des arachides."),
              (pick(2), 1, "", "Spray bronchodilatateur en cas de crise", "Père : 06 00 00 10 02", "PAI asthme à l'effort ; dispense d'EPS en cas de crise."),
              (pick(3), 1, "", "Contrôle de la glycémie avant le repas", "Mère : 06 00 00 10 03", "Diabète de type 1 (PAI) : collation autorisée en classe."),
              (pick(4), 0, "Pollen, acariens", "", "Père : 06 00 00 10 04", ""),
              (pick(5), 0, "", "", "Mère : 06 00 00 10 05", "Port de semelles orthopédiques.")]
    for e, pai, allerg, trait, contact, obs in fiches:
        con.execute("INSERT INTO fiches_sante(eleve_id,pai,allergies,traitements,contact_urgence,observations,maj_at) VALUES (?,?,?,?,?,?,?)",
                    (e["id"], pai, allerg, trait, contact, obs, ts_now))
    def soin(e, intitule, details, heure, duree, debut, fin="", jours=""):
        return con.execute("INSERT INTO soins(etab_id,eleve_id,intitule,details,heure,duree,date_debut,date_fin,jours,cree_par) VALUES (?,?,?,?,?,?,?,?,?,?)",
                           (e1, e["id"], intitule, details, heure, duree, debut, fin, jours, "Sophie Lambert (Infirmière)")).lastrowid
    s1 = soin(pick(3), "Contrôle de glycémie", "Avant le repas ; noter la valeur dans le carnet.", "11:45", 10, d(-30), "", "0,1,2,3,4")
    s2 = soin(pick(6), "Pansement", "Genou gauche, à refaire en nettoyant la plaie.", "10:15", 15, d(-10), d(14), "0,2,4")
    s3 = soin(pick(7), "Traitement du midi", "Comprimé fourni par la famille, à prendre après le repas.", "12:30", 5, d(-20), "", "0,1,3,4")
    s4 = soin(pick(8), "Contrôle après entorse", "Vérifier la mobilité de la cheville.", "14:00", 15, d(1))
    s5 = soin(pick(9), "Pansement", "Coude droit.", "15:00", 10, d(0))
    s6 = soin(pick(10), "Rappel de vaccination (campagne)", "Autorisation parentale reçue.", "09:30", 20, d(3))
    for jour_idx in (-3, -2, -1):
        dj = today + timedelta(days=jour_idx)
        if dj.weekday() < 5:
            for sid in (s1, s3):
                con.execute("INSERT OR IGNORE INTO soins_realises VALUES (?,?,?,?,?,?)", (sid, dj.isoformat(), "fait", "", "Sophie Lambert (Infirmière)", ts_now))
            if dj.weekday() in (0, 2, 4):
                con.execute("INSERT OR IGNORE INTO soins_realises VALUES (?,?,?,?,?,?)", (s2, dj.isoformat(), "fait", "", "Sophie Lambert (Infirmière)", ts_now))
    motifs = [("Mal de tête", "Repos 20 min, eau", "Retour en classe"), ("Mal au ventre", "Repos, bouillotte", "Retour en classe"),
              ("Chute en cour de récréation", "Désinfection, pansement", "Retour en classe"), ("Fièvre", "Température 38,4 °C", "Rentrée à domicile"),
              ("Nausées", "Repos 30 min", "Rentrée à domicile"), ("Choc à la tête (EPS)", "Surveillance, glace", "Repos à l'infirmerie"),
              ("Malaise", "Allongé, sucre", "Retour en classe"), ("Saignement de nez", "Compresse", "Retour en classe")]
    for n, (motif, soins_, decision) in enumerate(motifs * 2):
        e = pick(20 + n)
        dj = today - timedelta(days=n // 3)
        con.execute("INSERT INTO passages(etab_id,eleve_id,eleve_nom,classe,date,heure,motif,soins,decision,parents_prevenus,par_nom) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (e1, e["id"], f"{e['prenom']} {e['nom']}", e["classe"], dj.isoformat(), f"{8 + (n * 7) % 9:02d}:{(n * 13) % 60:02d}", motif, soins_, decision,
                     1 if "domicile" in decision else 0, "Sophie Lambert (Infirmière)"))
    # volumes horaires par niveau (dotations de démonstration, en heures entières par semaine)
    def vol(eid, niveau, lignes):
        for matiere, h, bloc in lignes:
            con.execute("INSERT OR IGNORE INTO volumes_horaires(etab_id,niveau,matiere,heures,bloc) VALUES (?,?,?,?,?)", (eid, niveau, matiere, h, bloc))
    base6 = [("Français", 4, 1), ("Mathématiques", 4, 1), ("Anglais", 3, 1), ("EPS", 3, 1), ("Histoire-Géographie", 3, 1),
             ("SVT", 1, 1), ("Technologie", 1, 1), ("Arts plastiques", 1, 1), ("Musique", 1, 1)]
    vol(e1, "6e", base6)
    vol(e1, "5e", [("Français", 4, 1), ("Mathématiques", 3, 1), ("Anglais", 3, 1), ("EPS", 3, 1), ("Histoire-Géographie", 3, 1), ("Espagnol", 2, 1),
                   ("Physique-Chimie", 1, 1), ("SVT", 1, 1), ("Technologie", 1, 1), ("Arts plastiques", 1, 1)])
    vol(e1, "4e", [("Français", 4, 1), ("Mathématiques", 3, 1), ("Anglais", 3, 1), ("EPS", 3, 1), ("Histoire-Géographie", 3, 1), ("Espagnol", 2, 1),
                   ("Physique-Chimie", 1, 1), ("SVT", 1, 1), ("Technologie", 1, 1), ("Musique", 1, 1)])
    vol(e1, "3e", [("Français", 4, 1), ("Mathématiques", 3, 1), ("Anglais", 3, 1), ("EPS", 3, 1), ("Histoire-Géographie", 3, 1), ("Espagnol", 2, 1),
                   ("Physique-Chimie", 1, 1), ("SVT", 1, 1), ("Technologie", 1, 1), ("Arts plastiques", 1, 1)])
    vol(e2, "2nde", [("Lettres", 4, 1), ("Mathématiques", 4, 1), ("Anglais", 3, 1), ("Histoire-Géographie", 3, 1), ("Sciences économiques", 2, 1),
                     ("SVT", 1, 1), ("Physique-Chimie", 3, 1)])
    vol(e2, "1ère", [("Lettres", 4, 1), ("Mathématiques", 4, 1), ("Anglais", 3, 1), ("Histoire-Géographie", 3, 1), ("SVT", 2, 1), ("Physique-Chimie", 3, 1)])
    vol(e2, "Terminale", [("Philosophie", 4, 1), ("Mathématiques", 4, 1), ("Anglais", 3, 1), ("Histoire-Géographie", 3, 1), ("Sciences économiques", 4, 1)])
    # service dû de la démo : volume de l'emploi du temps arrondi à l'heure (certains écarts restent visibles)
    for pid, tot in con.execute("SELECT prof_id, SUM((CAST(substr(fin,1,2) AS INTEGER)*60+CAST(substr(fin,4,2) AS INTEGER))"
                                "-(CAST(substr(debut,1,2) AS INTEGER)*60+CAST(substr(debut,4,2) AS INTEGER))) FROM creneaux GROUP BY prof_id").fetchall():
        con.execute("UPDATE professeurs SET service_min=? WHERE id=?", ((tot // 60) * 60 if pid % 3 else ((tot + 59) // 60) * 60, pid))
    con.commit()
    from .modeles_defaut import installer
    for eid in (e1, e2):
        installer(con, eid)
    for eid, ville, adr in ((e1, "Lyon", "12 rue des Écoles, 69000 Lyon"), (e2, "Lyon", "3 avenue Victor Hugo, 69000 Lyon")):
        con.execute("UPDATE entete_documents SET ligne_haut=?, adresse=?, telephone=?, email=?, ville=?, pied=? WHERE etab_id=?",
                    ("République française — Ministère de l'Éducation nationale", adr, "04 00 00 00 00", "vie-scolaire@demo.fr", ville,
                     "Établissement fictif de démonstration", eid))
    con.commit()
    con.close()
    return cpe


def demo_si_vide():
    """Charge la démo si la base ne contient aucun utilisateur. Retourne True si elle a été chargée."""
    con = connect()
    vide = con.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
    con.close()
    if vide:
        seed_demo()
    return vide
