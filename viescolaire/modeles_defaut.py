"""Modèles de documents et types d'incident livrés par défaut (copiés dans chaque établissement, ensuite modifiables).

Dans un texte, {{variable}} est remplacé automatiquement. Variables disponibles : voir VARIABLES."""

VARIABLES = [
    ("eleve", "Prénom et nom de l'élève"), ("prenom", "Prénom de l'élève"), ("nom", "Nom de l'élève"), ("classe", "Classe de l'élève"),
    ("responsable", "Responsable légal (ou « Madame, Monsieur »)"), ("professeur", "Professeur concerné"), ("matiere", "Matière concernée"),
    ("prof_principal", "Professeur principal de la classe"), ("date", "Date des faits (ex. mardi 27 octobre 2026)"), ("heure", "Heure des faits"),
    ("lieu", "Lieu des faits"), ("type_incident", "Type d'incident choisi"), ("description", "Faits constatés"),
    ("suite", "Mesures prises / suite donnée"), ("auteur", "Auteur du document"), ("date_du_jour", "Date de rédaction"),
    ("etablissement", "Nom de l'établissement"),
]

# (code, titre, corps, ouvert_enseignants, avec_incident)
MODELES = [
    ("rapport_incident", "Rapport d'incident", """RAPPORT D'INCIDENT

Élève : {{eleve}} — Classe : {{classe}}
Date et heure : {{date}} {{heure}}
Lieu : {{lieu}}
Professeur concerné : {{professeur}} ({{matiere}})
Professeur principal : {{prof_principal}}
Nature de l'incident : {{type_incident}}

Faits constatés :
{{description}}

Mesures prises :
{{suite}}

Rédigé par {{auteur}}, le {{date_du_jour}}.""", 1, 1),
    ("convocation_parents", "Convocation des parents", """Objet : convocation concernant {{eleve}} ({{classe}})

{{responsable}},

Je vous prie de bien vouloir vous présenter le {{date}} à {{heure}} (lieu : {{lieu}}) afin d'échanger au sujet de {{eleve}}, élève de {{classe}}.

Motif de la convocation : {{type_incident}}.
{{description}}

Merci de bien vouloir confirmer votre présence. Votre professeur principal, {{prof_principal}}, pourra également être associé à cet entretien.

Cordialement,
{{auteur}}
Vie scolaire — {{date_du_jour}}""", 0, 0),
    ("avertissement_conduite", "Avertissement de conduite", """AVERTISSEMENT DE CONDUITE

{{eleve}} — {{classe}}

Après les faits suivants survenus le {{date}} lors du cours (matière : {{matiere}}) avec {{professeur}} :
{{description}}

Un avertissement est notifié à l'élève pour : {{type_incident}}.
Suite donnée : {{suite}}

Il est rappelé que le respect du règlement intérieur est une obligation pour tous les élèves.

Fait le {{date_du_jour}}, par {{auteur}}.

Signature de l'élève :                    Signature du responsable légal :""", 0, 1),
    ("compte_rendu_entretien", "Compte rendu d'entretien", """COMPTE RENDU D'ENTRETIEN

Élève : {{eleve}} ({{classe}})
Date : {{date}} {{heure}}
Personnes présentes : {{auteur}}, {{responsable}}, {{professeur}}
Professeur principal : {{prof_principal}}

Objet de l'entretien : {{type_incident}}

Points abordés :
{{description}}

Décisions et suites :
{{suite}}

Compte rendu rédigé le {{date_du_jour}}.""", 0, 0),
    ("signalement_absences", "Signalement d'absences et de retards", """SIGNALEMENT D'ABSENTÉISME

Élève : {{eleve}} — Classe : {{classe}}
Période concernée : {{date}}
Responsable légal : {{responsable}}

Constat : {{type_incident}}
{{description}}

Démarches engagées auprès de la famille :
{{suite}}

Professeur principal informé : {{prof_principal}}
Rédigé par {{auteur}}, le {{date_du_jour}}.""", 0, 0),
]

# (libellé, texte par défaut des faits, gravité)
TYPES_INCIDENT = [
    ("Retard", "{{eleve}} est arrivé(e) en retard au cours (matière : {{matiere}}) sans justificatif.", "mineur"),
    ("Absence non justifiée", "{{eleve}} était absent(e) au cours (matière : {{matiere}}) sans motif connu de l'établissement.", "mineur"),
    ("Oubli de matériel", "{{eleve}} n'avait pas le matériel nécessaire au cours (matière : {{matiere}}).", "mineur"),
    ("Travail non fait", "{{eleve}} n'a pas rendu le travail demandé (matière : {{matiere}}).", "mineur"),
    ("Comportement perturbateur", "{{eleve}} a perturbé le déroulement du cours (matière : {{matiere}}) malgré plusieurs rappels à l'ordre.", "moyen"),
    ("Manque de respect", "{{eleve}} a tenu des propos irrespectueux envers {{professeur}} pendant le cours (matière : {{matiere}}).", "moyen"),
    ("Usage du téléphone portable", "{{eleve}} a utilisé son téléphone portable pendant le cours (matière : {{matiere}}) malgré l'interdiction.", "mineur"),
    ("Dégradation de matériel", "{{eleve}} a dégradé du matériel de l'établissement.", "grave"),
    ("Violence entre élèves", "{{eleve}} est impliqué(e) dans une altercation physique avec un autre élève.", "grave"),
    ("Triche ou fraude", "{{eleve}} a été surpris(e) en train de tricher lors d'une évaluation (matière : {{matiere}}).", "grave"),
    ("Suspicion de harcèlement", "Des faits pouvant relever du harcèlement concernant {{eleve}} ont été signalés.", "grave"),
    ("Autre (à préciser)", "", "moyen"),
]


def installer(con, etab_id):
    """Copie les modèles et types par défaut dans un établissement qui n'en a pas encore."""
    if not con.execute("SELECT 1 FROM modeles_documents WHERE etab_id=?", (etab_id,)).fetchone():
        for code, titre, corps, ouvert, inc in MODELES:
            con.execute("INSERT INTO modeles_documents(etab_id,code,titre,corps,ouvert_enseignants,avec_incident) VALUES (?,?,?,?,?,?)",
                        (etab_id, code, titre, corps, ouvert, inc))
    if not con.execute("SELECT 1 FROM types_incident WHERE etab_id=?", (etab_id,)).fetchone():
        for libelle, texte, gravite in TYPES_INCIDENT:
            con.execute("INSERT INTO types_incident(etab_id,libelle,texte,gravite) VALUES (?,?,?,?)", (etab_id, libelle, texte, gravite))
    con.commit()
