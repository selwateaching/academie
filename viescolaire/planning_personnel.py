"""Affectation automatique du personnel (assistants pédagogiques…) à des postes : Service, Étude, Foyer, Cour, Portail, Self…

Entrées : des besoins (poste, jour, plage horaire, effectif) et des agents (contrat hebdomadaire, postes qu'ils peuvent tenir,
indisponibilités et souhaits). Sortie : des plages d'affectation sans chevauchement, qui couvrent au mieux les besoins.

Contraintes impératives : agent qualifié pour le poste, jamais pendant une indisponibilité, jamais deux postes en même temps,
heures hebdomadaires du contrat (+ marge) et durée quotidienne maximale respectées.
Confort (coûts) : souhaits non respectés, journées éclatées (trous entre les plages), nombre de jours travaillés, répartition de la
charge proportionnelle au contrat.

Méthode identique à celle des emplois du temps des professeurs : placement glouton au moindre coût, avec relances qui mettent en
tête les plages restées sans agent. Les affectations « figées » (saisies à la main) sont conservées et comptées dans la couverture.
Les heures sont exprimées en minutes depuis minuit ; le pas de découpage est de 15 minutes.
"""
import random
import time
from collections import Counter

PAS = 15
JOURNEE = 24 * 60


def hhmm(m):
    return f"{m // 60:02d}:{m % 60:02d}"


def minutes(texte):
    h, m = texte.split(":")
    return int(h) * 60 + int(m)


def chevauche(a1, b1, a2, b2):
    return a1 < b2 and a2 < b1


def decouper(debut, fin, bloc_max):
    """Coupe une plage trop longue en morceaux égaux (multiples de 15 min) d'au plus bloc_max minutes."""
    duree = fin - debut
    if bloc_max <= 0 or duree <= bloc_max:
        return [(debut, fin)]
    n = -(-duree // bloc_max)
    base = (duree // n) // PAS * PAS
    longueurs = [base] * n
    reste = duree - base * n
    i = 0
    while reste > 0:
        ajout = min(PAS, reste)
        longueurs[i % n] += ajout
        reste -= ajout
        i += 1
    out, cur = [], debut
    for L in longueurs:
        out.append((cur, cur + L))
        cur += L
    return out


def demande_restante(besoins, fixes):
    """{(poste, jour): [effectif restant par tranche de 15 min]} après déduction des affectations déjà figées."""
    d = {}
    for b in besoins:
        tab = d.setdefault((b["poste_id"], b["jour"]), [0] * (JOURNEE // PAS))
        for s in range(b["debut"] // PAS, -(-b["fin"] // PAS)):
            tab[s] += b["effectif"]
    for f in fixes:
        tab = d.get((f["poste_id"], f["jour"]))
        if tab:
            for s in range(f["debut"] // PAS, -(-f["fin"] // PAS)):
                if tab[s] > 0:
                    tab[s] -= 1
    return d


def blocs_a_pourvoir(besoins, fixes, bloc_max):
    blocs, n = [], 0
    for (poste, jour), tab in sorted(demande_restante(besoins, fixes).items()):
        for k in range(1, (max(tab) if tab else 0) + 1):          # une « couche » par agent nécessaire simultanément
            s = 0
            while s < len(tab):
                if tab[s] >= k:
                    e = s
                    while e < len(tab) and tab[e] >= k:
                        e += 1
                    for deb, fin in decouper(s * PAS, e * PAS, bloc_max):
                        n += 1
                        blocs.append({"id": n, "poste_id": poste, "jour": jour, "debut": deb, "fin": fin})
                    s = e
                else:
                    s += 1
    return blocs


class Etat:
    def __init__(self, agents, fixes, options):
        self.agents, self.o = agents, options
        self.occ = {}                                   # (agent, jour) -> [(debut, fin)]
        self.total, self.jour_total, self.affectations = Counter(), Counter(), []
        for f in fixes:
            self._poser(f["personnel_id"], f["poste_id"], f["jour"], f["debut"], f["fin"], f.get("source", "manuel"))

    def _poser(self, aid, poste, jour, deb, fin, source="auto"):
        self.occ.setdefault((aid, jour), []).append((deb, fin))
        self.total[aid] += fin - deb
        self.jour_total[(aid, jour)] += fin - deb
        self.affectations.append({"personnel_id": aid, "poste_id": poste, "jour": jour, "debut": deb, "fin": fin, "source": source})

    def refus(self, aid, b):
        a = self.agents[aid]
        if b["poste_id"] not in a["postes"]:
            return "non qualifié pour ce poste"
        for (j, d1, d2, niveau) in a["dispos"]:
            if niveau == "non" and j == b["jour"] and chevauche(d1, d2, b["debut"], b["fin"]):
                return "indisponible"
        for (d1, d2) in self.occ.get((aid, b["jour"]), []):
            if chevauche(d1, d2, b["debut"], b["fin"]):
                return "déjà affecté ailleurs"
        dur = b["fin"] - b["debut"]
        if self.total[aid] + dur > a["contrat"] + self.o["marge"]:
            return "heures du contrat atteintes"
        if self.jour_total[(aid, b["jour"])] + dur > a["max_jour"]:
            return "durée quotidienne maximale"
        return None

    def cout(self, aid, b, rng):
        a, dur = self.agents[aid], b["fin"] - b["debut"]
        c = 0.0
        for (j, d1, d2, niveau) in a["dispos"]:
            if niveau == "souhait" and j == b["jour"] and chevauche(d1, d2, b["debut"], b["fin"]):
                c += 40 * (min(d2, b["fin"]) - max(d1, b["debut"])) / 60
        jour_occ = self.occ.get((aid, b["jour"]), [])
        if not jour_occ:
            c += 12                                                       # ouvre une nouvelle journée de travail
        else:
            avant = [b["debut"] - e for (_, e) in jour_occ if e <= b["debut"]]
            apres = [d - b["fin"] for (d, _) in jour_occ if d >= b["fin"]]
            ecart = min(avant + apres) if (avant or apres) else 0
            c += min(ecart, 240) / PAS * 1.5                              # préfère des plages contiguës
            if ecart == 0:
                c -= 8
        c += 25 * (self.total[aid] + dur) / max(a["contrat"], 1)          # répartition proportionnelle au contrat
        return c + rng.random() * 0.5


def un_essai(agents, fixes, blocs, options, rng):
    etat = Etat(agents, fixes, options)
    non = []
    for b in blocs:
        candidats = [aid for aid in agents if etat.refus(aid, b) is None]
        if not candidats:
            non.append(b)
            continue
        aid = min(candidats, key=lambda x: etat.cout(x, b, rng))
        etat._poser(aid, b["poste_id"], b["jour"], b["debut"], b["fin"], "auto")
    return etat, non


def fusionner(affectations):
    """Réunit les plages contiguës d'un même agent sur un même poste."""
    out = []
    for a in sorted(affectations, key=lambda x: (x["personnel_id"], x["jour"], x["debut"])):
        if out and all(out[-1][k] == a[k] for k in ("personnel_id", "poste_id", "jour", "source")) and out[-1]["fin"] == a["debut"]:
            out[-1]["fin"] = a["fin"]
        else:
            out.append(dict(a))
    return out


def diagnostic(besoins, agents, fixes=(), options=None):
    """Contrôles avant calcul : [(niveau, message)]."""
    options = {"marge": 0, "bloc_max": 180, **(options or {})}
    msgs = []
    total = sum(b["fin"] - b["debut"] for b in blocs_a_pourvoir(besoins, fixes, 0))
    capacite = sum(a["contrat"] + options["marge"] for a in agents.values())
    dispo = capacite - sum(f["fin"] - f["debut"] for f in fixes)
    if total > dispo:
        msgs.append(("err", f"Besoins à pourvoir : {total / 60:.1f} h pour {max(dispo, 0) / 60:.1f} h de contrats disponibles : "
                            f"il manquera au moins {(total - dispo) / 60:.1f} h."))
    par_poste = Counter()
    for b in blocs_a_pourvoir(besoins, fixes, 0):
        par_poste[b["poste_id"]] += b["fin"] - b["debut"]
    for poste, mins in par_poste.items():
        qualifies = [a for a in agents.values() if poste in a["postes"]]
        if not qualifies:
            msgs.append(("err", f"Aucun agent n'est habilité pour le poste « {options.get('noms_postes', {}).get(poste, poste)} »."))
        elif mins > sum(a["contrat"] + options["marge"] for a in qualifies):
            msgs.append(("warn", f"Poste « {options.get('noms_postes', {}).get(poste, poste)} » : {mins / 60:.1f} h à couvrir pour "
                                 f"{sum(a['contrat'] for a in qualifies) / 60:.1f} h de contrats d'agents habilités."))
    return msgs


def raisons(etat, b):
    c = Counter(etat.refus(aid, b) or "libre" for aid in etat.agents)
    c.pop("libre", None)
    return [r for r, _ in c.most_common(2)]


def generer(besoins, agents, fixes=(), options=None, essais=40, temps_max=6.0, graine=None):
    """agents : {id: {'nom','contrat','max_jour','postes':set,'dispos':[(jour, debut, fin, 'non'|'souhait')]}}.
    Retourne {'affectations' (nouvelles, fusionnées), 'non_couverts', 'stats'}."""
    options = {"marge": 0, "bloc_max": 180, **(options or {})}
    rng = random.Random(graine)
    fixes = list(fixes)
    blocs = blocs_a_pourvoir(besoins, fixes, options["bloc_max"])
    base = Etat(agents, fixes, options)
    souplesse = {b["id"]: sum(1 for aid in agents if base.refus(aid, b) is None) for b in blocs}
    ordre = sorted(range(len(blocs)), key=lambda i: (souplesse[blocs[i]["id"]], -(blocs[i]["fin"] - blocs[i]["debut"])))
    meilleur, debut = None, time.time()
    for essai in range(essais):
        etat, non = un_essai(agents, fixes, [blocs[i] for i in ordre], options, rng)
        manquant = sum(b["fin"] - b["debut"] for b in non)
        ecart = sum(abs(a["contrat"] - etat.total[aid]) for aid, a in agents.items())
        score = manquant * 1000 + ecart
        if meilleur is None or score < meilleur[2]:
            meilleur = (etat, non, score)
        if not non and essai >= 6:
            break
        if time.time() - debut > temps_max:
            break
        echecs = {b["id"] for b in non}
        ordre = [i for i in ordre if blocs[i]["id"] in echecs] + \
                sorted([i for i in ordre if blocs[i]["id"] not in echecs], key=lambda i: souplesse[blocs[i]["id"]] + rng.random() * 3)
    etat, non, _ = meilleur
    nouvelles = fusionner([a for a in etat.affectations if a["source"] == "auto"])
    total_besoin = sum(b["fin"] - b["debut"] for b in blocs)
    couvert = total_besoin - sum(b["fin"] - b["debut"] for b in non)
    return {
        "affectations": nouvelles,
        "non_couverts": [{"poste_id": b["poste_id"], "jour": b["jour"], "debut": b["debut"], "fin": b["fin"], "raisons": raisons(etat, b)} for b in non],
        "stats": {"minutes_besoin": total_besoin, "minutes_couvertes": couvert, "couverture": round(100 * couvert / total_besoin) if total_besoin else 100,
                  "par_agent": {aid: {"affecte": etat.total[aid], "contrat": a["contrat"], "solde": a["contrat"] - etat.total[aid]} for aid, a in agents.items()},
                  "essais": essai + 1},
    }
