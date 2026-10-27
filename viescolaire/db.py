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
    # (2, "ALTER TABLE professeurs ADD COLUMN statut TEXT NOT NULL DEFAULT 'titulaire';"),
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
    """Jeu de données fictives (personnes imaginaires) pour tester l'application."""
    con = connect()
    h = generate_password_hash(password)
    e1 = con.execute("INSERT INTO etablissements(nom) VALUES ('Collège Victor Hugo')").lastrowid
    e2 = con.execute("INSERT INTO etablissements(nom) VALUES ('Lycée Jean Moulin')").lastrowid

    def user(nom, email, role, etabs):
        uid = con.execute("INSERT INTO users(nom,email,pwd_hash,role) VALUES (?,?,?,?)", (nom, email, h, role)).lastrowid
        for e in etabs:
            con.execute("INSERT INTO user_etabs VALUES (?,?)", (uid, e))
        return uid

    cpe = user("Camille Durand (CPE)", "cpe@demo.fr", "cpe", [e1, e2])
    user("Dominique Leroy (Direction)", "direction@demo.fr", "direction", [e1])

    profs = [
        ("Martin", "Alice", "Mathématiques"), ("Bernard", "Hugo", "Français"),
        ("Petit", "Léa", "Histoire-Géographie"), ("Robert", "Paul", "Anglais"),
        ("Richard", "Emma", "SVT"), ("Moreau", "Louis", "Physique-Chimie"),
        ("Simon", "Chloé", "EPS"), ("Laurent", "Noah", "Mathématiques"),
    ]
    ids = []
    for i, (nom, prenom, mat) in enumerate(profs, 1):
        email = f"prof{i}@demo.fr"
        uid = user(f"{prenom} {nom}", email, "enseignant", [e1])
        pid = con.execute(
            "INSERT INTO professeurs(etab_id,user_id,nom,prenom,matiere,email,telephone) VALUES (?,?,?,?,?,?,?)",
            (e1, uid, nom, prenom, mat, email, f"06 00 00 00 {i:02d}"),
        ).lastrowid
        ids.append(pid)

    classes = ["6A", "6B", "5A", "5B", "4A", "3A"]
    for i, c in enumerate(classes):
        con.execute("INSERT INTO classes(etab_id,nom,niveau,prof_principal_id) VALUES (?,?,?,?)",
                    (e1, c, c[0] + "e", ids[i % len(ids)]))

    horaires = [("08:00", "09:00"), ("09:00", "10:00"), ("10:15", "11:15"), ("11:15", "12:15"),
                ("14:00", "15:00"), ("15:00", "16:00")]
    for i, pid in enumerate(ids):
        mat = profs[i][2]
        for j in range(5):  # 5 créneaux par prof, répartis sur la semaine
            jour = (i + j) % 5
            d, f = horaires[(i * 2 + j) % len(horaires)]
            con.execute(
                "INSERT INTO creneaux(etab_id,prof_id,classe,matiere,jour,debut,fin,salle) VALUES (?,?,?,?,?,?,?,?)",
                (e1, pid, classes[(i + j) % len(classes)], mat, jour, d, f, f"B{10 + (i + j) % 8}"),
            )

    today = date.today()
    con.execute("INSERT INTO absences(etab_id,prof_id,type,date_debut,date_fin,motif,statut) VALUES (?,?,?,?,?,?,?)",
                (e1, ids[0], "absence", today.isoformat(), (today + timedelta(days=1)).isoformat(), "Maladie", "validee"))
    con.execute("INSERT INTO absences(etab_id,prof_id,type,date_debut,date_fin,motif,statut) VALUES (?,?,?,?,?,?,?)",
                (e1, ids[3], "indisponibilite", (today + timedelta(days=3)).isoformat(),
                 (today + timedelta(days=3)).isoformat(), "Sortie scolaire", "validee"))
    con.commit()
    con.close()
    return cpe
