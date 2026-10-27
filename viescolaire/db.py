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
    # (5, "ALTER TABLE professeurs ADD COLUMN statut TEXT NOT NULL DEFAULT 'titulaire';"),
]


def init_db(extra_sql=()):
    con = connect()
    con.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at TEXT)")
    deja = {r[0] for r in con.execute("SELECT version FROM schema_version")}
    for version, sql in MIGRATIONS:
        if version not in deja:
            con.executescript(sql)
            con.execute("INSERT INTO schema_version VALUES (?, datetime('now'))", (version,))
            con.commit()
    for sql in extra_sql:  # tables des extensions (idempotentes)
        con.executescript(sql)
    con.commit()
    con.close()


def create_admin(email, password, nom, etab_nom):
    con = connect()
    etab = con.execute("SELECT id FROM etablissements WHERE nom=?", (etab_nom,)).fetchone()
    etab_id = etab["id"] if etab else con.execute("INSERT INTO etablissements(nom) VALUES (?)", (etab_nom,)).lastrowid
    uid = con.execute(
        "INSERT INTO users(nom,email,pwd_hash,role) VALUES (?,?,?,'cpe')",
        (nom, email.lower(), generate_password_hash(password)),
    ).lastrowid
    con.execute("INSERT INTO user_etabs VALUES (?,?)", (uid, etab_id))
    con.commit()
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

    profs = [
        ("Martin", "Alice", "Mathématiques"), ("Bernard", "Hugo", "Français"),
        ("Petit", "Léa", "Histoire-Géographie"), ("Robert", "Paul", "Anglais"),
        ("Richard", "Emma", "SVT"), ("Moreau", "Louis", "Physique-Chimie"),
        ("Simon", "Chloé", "EPS"), ("Laurent", "Noah", "Mathématiques"),
        ("Fournier", "Inès", "Arts plastiques"), ("Girard", "Théo", "Technologie"),
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

    classes = ["6A", "6B", "5A", "5B", "4A", "4B", "3A", "3B"]
    for i, c in enumerate(classes):
        con.execute("INSERT INTO classes(etab_id,nom,niveau,prof_principal_id) VALUES (?,?,?,?)",
                    (e1, c, c[0] + "e", ids[i % len(ids)]))

    horaires = [("08:00", "09:00"), ("09:00", "10:00"), ("10:15", "11:15"), ("11:15", "12:15"),
                ("14:00", "15:00"), ("15:00", "16:00"), ("16:00", "17:00")]
    for i, pid in enumerate(ids):
        mat = profs[i][2]
        for j in range(7):  # 7 créneaux par professeur répartis sur la semaine
            jour = (i + j * 2) % 5
            deb, fin = horaires[(i * 3 + j) % len(horaires)]
            con.execute(
                "INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                (e1, pid, classes[(i + j) % len(classes)], mat, jour, deb, fin, f"B{10 + (i + j) % 8}"),
            )

    # Besoins du générateur (déduits des cours existants) et vœux des professeurs
    con.execute("""INSERT INTO besoins(etab_id,classe,matiere,prof_id,heures,bloc)
                   SELECT etab_id, classe, matiere, prof_id, COUNT(*), 1 FROM creneaux WHERE etab_id=? GROUP BY classe, matiere, prof_id""", (e1,))
    for pid, jour, demi, niveau in [(ids[0], 2, "apres_midi", "non"), (ids[1], 0, "matin", "souhait"), (ids[2], 4, "apres_midi", "souhait"),
                                    (ids[3], 3, "matin", "non"), (ids[6], 1, "matin", "souhait"), (ids[7], 2, "apres_midi", "non")]:
        con.execute("INSERT INTO voeux VALUES (?,?,?,?)", (pid, jour, demi, niveau))

    def absence(prof, typ, a, b, motif, statut="validee"):
        return con.execute("INSERT INTO absences(etab_id,prof_id,type,date_debut,date_fin,motif,statut) VALUES (?,?,?,?,?,?,?)",
                           (e1, prof, typ, a, b, motif, statut)).lastrowid

    abs_ids = [
        absence(ids[0], "absence", d(0), d(1), "Maladie"),
        absence(ids[3], "indisponibilite", d(3), d(3), "Sortie scolaire"),
        absence(ids[6], "absence", d(5), d(7), "Formation", "declaree"),
        absence(ids[4], "absence", d(-9), d(-8), "Maladie"),
        absence(ids[1], "absence", d(-3), d(-3), "Rendez-vous médical"),
    ]
    # Remplacements : un par cours des professeurs absents
    for aid in abs_ids:
        a = con.execute("SELECT * FROM absences WHERE id=?", (aid,)).fetchone()
        if a["type"] != "absence":
            continue
        jour = date.fromisoformat(a["date_debut"])
        while jour <= date.fromisoformat(a["date_fin"]):
            if jour.weekday() < 5:
                for c in con.execute("SELECT id FROM creneaux WHERE prof_id=? AND jour=?", (a["prof_id"], jour.weekday())).fetchall():
                    statut, remp = "a_pourvoir", None
                    if jour < today:
                        statut, remp = "effectue", ids[(a["prof_id"] + 2) % len(ids)] if (a["prof_id"] + 2) % len(ids) != a["prof_id"] else None
                    con.execute("INSERT INTO remplacements(etab_id,absence_id,creneau_id,date,remplacant_id,statut) VALUES (?,?,?,?,?,?)",
                                (e1, aid, c["id"], jour.isoformat(), remp, statut))
            jour += timedelta(days=1)
    # Quelques remplacements déjà traités pour illustrer les statuts
    aujourdhui = con.execute("SELECT id FROM remplacements WHERE etab_id=? AND date>=? AND statut='a_pourvoir' ORDER BY date,id", (e1, d(0))).fetchall()
    if aujourdhui:
        con.execute("UPDATE remplacements SET remplacant_id=?, statut='assigne' WHERE id=?", (ids[7], aujourdhui[0]["id"]))
    if len(aujourdhui) > 2:
        con.execute("UPDATE remplacements SET statut='annule' WHERE id=?", (aujourdhui[2]["id"],))

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

    # Second établissement (démonstration du multi-établissements)
    for nom, prenom, mat in [("Garcia", "Léo", "Philosophie"), ("Roux", "Manon", "Lettres"), ("Blanc", "Adam", "Mathématiques")]:
        con.execute("INSERT INTO professeurs(etab_id,nom,prenom,matiere,email) VALUES (?,?,?,?,?)",
                    (e2, nom, prenom, mat, f"{prenom.lower()}@demo.fr"))
    for c in ["2nde1", "1ère S", "Term ES"]:
        con.execute("INSERT INTO classes(etab_id,nom,niveau) VALUES (?,?,?)", (e2, c, c[:3]))
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
