"""Génération automatique d'emplois du temps (moteur indépendant de Flask).

Problème : placer des « séances » (classe × matière × professeur, durée 1 ou 2 créneaux) dans une grille
jours × créneaux, en respectant des contraintes impératives et en minimisant des contraintes de confort.

Contraintes impératives : professeur indisponible (vœu « non »), professeur / classe / salle déjà occupés,
classe fermée sur une demi-journée (ex. mercredi après-midi), limites d'heures par jour (professeur et classe),
séance sur des créneaux consécutifs d'une même demi-journée.
Confort (coûts) : vœux « souhait » non respectés, trous dans la journée (professeurs et classes), équilibre de la
charge des classes sur la semaine, une même matière plusieurs fois le même jour.

Méthode : placement glouton au moindre coût, avec relances : à chaque essai, les séances qui n'ont pas trouvé de place
passent en tête de l'ordre au suivant. On garde le meilleur résultat dans la limite de temps.
"""
import random
import time
from collections import Counter

JOURS = 5
GRILLE_PAR_DEFAUT = ["08:00-09:00", "09:00-10:00", "10:15-11:15", "11:15-12:15", "14:00-15:00", "15:00-16:00", "16:00-17:00"]

POIDS = {"souhait": 60, "trou_prof": 12, "trou_classe": 20, "charge_classe": 3, "meme_jour": 8}


def construire_grille(textes=None):
    """['08:00-09:00', …] -> [{'debut','fin','demi'}]"""
    grille = []
    for t in (textes or GRILLE_PAR_DEFAUT):
        d, f = t.split("-")
        grille.append({"debut": d.strip(), "fin": f.strip(), "demi": "matin" if d.strip() < "12:30" else "apres_midi"})
    return grille


def seances(besoins):
    """Découpe chaque besoin en séances (blocs de 1 ou 2 créneaux)."""
    out = []
    for b in besoins:
        bloc = 2 if b.get("bloc", 1) == 2 else 1
        for _ in range(b["heures"] // bloc):
            out.append({"besoin": b, "len": bloc})
        if b["heures"] % bloc:
            out.append({"besoin": b, "len": 1})
    return out


class Etat:
    def __init__(self, grille, profs, options):
        self.g, self.profs, self.o = grille, profs, options
        self.n = len(grille)
        self.prof_occ, self.classe_occ, self.salle_occ = set(), set(), set()   # (id, jour, idx)
        self.charge_prof, self.charge_classe, self.matiere_jour = Counter(), Counter(), Counter()
        self.placements = []

    # --- lecture de l'état -------------------------------------------------
    def _voeu(self, pid, j, demi):
        return self.profs.get(pid, {}).get("voeux", {}).get((j, demi))

    def _max_prof(self, pid):
        return self.profs.get(pid, {}).get("max_jour", 6)

    def refus(self, s, j, i, strict=True):
        """None si la séance peut être posée en (jour j, créneau i), sinon la raison du refus."""
        b, L = s["besoin"], s["len"]
        # une séance de 2 h doit tenir sur des créneaux contigus (pas de récréation ni de pause entre les deux)
        if i + L > self.n or any(self.g[i + k]["demi"] != self.g[i]["demi"] or (k and self.g[i + k]["debut"] != self.g[i + k - 1]["fin"]) for k in range(L)):
            return "forme"
        demi = self.g[i]["demi"]
        if (j, demi) in self.o["classe_fermee"]:
            return "classe fermée"
        if self._voeu(b["prof_id"], j, demi) == "non":
            return "professeur indisponible"
        for k in range(L):
            if (b["prof_id"], j, i + k) in self.prof_occ:
                return "professeur déjà occupé"
            if (b["classe"], j, i + k) in self.classe_occ:
                return "classe déjà occupée"
            if b.get("salle") and (b["salle"], j, i + k) in self.salle_occ:
                return "salle déjà occupée"
        if self.charge_prof[(b["prof_id"], j)] + L > self._max_prof(b["prof_id"]):
            return "limite d'heures du professeur par jour"
        if self.charge_classe[(b["classe"], j)] + L > self.o["max_classe_jour"]:
            return "limite d'heures de la classe par jour"
        if strict and self.matiere_jour[(b["classe"], b["matiere"], j)] > 0 and b["heures"] > 1:
            return "même matière déjà ce jour"
        return None

    def trous(self, cle_occ, ident, j, ajout):
        """Nombre de créneaux libres entre le premier et le dernier occupés d'une journée, après ajout."""
        occ = {i for i in range(self.n) if (ident, j, i) in cle_occ} | set(ajout)
        if not occ:
            return 0
        return (max(occ) - min(occ) + 1) - len(occ)

    def cout(self, s, j, i):
        b, L = s["besoin"], s["len"]
        demi = self.g[i]["demi"]
        ajout = range(i, i + L)
        c = 0
        if self._voeu(b["prof_id"], j, demi) == "souhait":
            c += POIDS["souhait"] * L
        c += POIDS["trou_prof"] * (self.trous(self.prof_occ, b["prof_id"], j, ajout) - self.trous(self.prof_occ, b["prof_id"], j, ()))
        c += POIDS["trou_classe"] * (self.trous(self.classe_occ, b["classe"], j, ajout) - self.trous(self.classe_occ, b["classe"], j, ()))
        c += POIDS["charge_classe"] * self.charge_classe[(b["classe"], j)]
        c += POIDS["meme_jour"] * self.matiere_jour[(b["classe"], b["matiere"], j)]
        return c

    def poser(self, s, j, i):
        b, L = s["besoin"], s["len"]
        for k in range(L):
            self.prof_occ.add((b["prof_id"], j, i + k))
            self.classe_occ.add((b["classe"], j, i + k))
            if b.get("salle"):
                self.salle_occ.add((b["salle"], j, i + k))
        self.charge_prof[(b["prof_id"], j)] += L
        self.charge_classe[(b["classe"], j)] += L
        self.matiere_jour[(b["classe"], b["matiere"], j)] += 1
        self.placements.append({"besoin_id": b["id"], "classe": b["classe"], "matiere": b["matiere"], "prof_id": b["prof_id"],
                                "salle": b.get("salle", ""), "jour": j, "debut_idx": i, "longueur": L})

    def candidats(self, s, strict):
        return [(j, i) for j in range(JOURS) for i in range(self.n) if self.refus(s, j, i, strict) is None]


def un_essai(grille, profs, liste, options, rng):
    etat = Etat(grille, profs, options)
    non_places = []
    for s in liste:
        cand = etat.candidats(s, True) or etat.candidats(s, False)
        if not cand:
            non_places.append(s)
            continue
        meilleur = min(cand, key=lambda p: (etat.cout(s, *p), rng.random()))
        etat.poser(s, *meilleur)
    return etat, non_places


def evaluer(etat, non_places):
    souhaits = sum(p["longueur"] for p in etat.placements
                   if etat._voeu(p["prof_id"], p["jour"], etat.g[p["debut_idx"]]["demi"]) == "souhait")
    tp = sum(etat.trous(etat.prof_occ, pid, j, ()) for pid in {p["prof_id"] for p in etat.placements} for j in range(JOURS))
    tc = sum(etat.trous(etat.classe_occ, c, j, ()) for c in {p["classe"] for p in etat.placements} for j in range(JOURS))
    score = len(non_places) * 100000 + souhaits * POIDS["souhait"] + tp * POIDS["trou_prof"] + tc * POIDS["trou_classe"]
    return {"souhaits_non_respectes": souhaits, "trous_professeurs": tp, "trous_classes": tc, "score": score}


def raisons(etat, s):
    c = Counter(etat.refus(s, j, i, False) or "libre" for j in range(JOURS) for i in range(etat.n))
    c.pop("forme", None)
    c.pop("libre", None)
    return [r for r, _ in c.most_common(2)]


def diagnostic(grille, besoins, profs, options):
    """Vérifications de faisabilité avant de lancer le calcul. Retourne [(niveau, message)]."""
    msgs = []
    n = len(grille)
    ouverts = [(j, d) for j in range(JOURS) for d in ("matin", "apres_midi") if (j, d) not in options["classe_fermee"]]
    cren_demi = {d: sum(1 for x in grille if x["demi"] == d) for d in ("matin", "apres_midi")}
    capacite_classe = min(sum(cren_demi[d] for _, d in ouverts), JOURS * options["max_classe_jour"])
    par_prof, par_classe = Counter(), Counter()
    for b in besoins:
        par_prof[b["prof_id"]] += b["heures"]
        par_classe[b["classe"]] += b["heures"]
        if b["prof_id"] not in profs:
            msgs.append(("err", f"Besoin {b['classe']} · {b['matiere']} : professeur introuvable."))
    for pid, h in par_prof.items():
        p = profs.get(pid)
        if not p:
            continue
        libres = [(j, d) for j in range(JOURS) for d in ("matin", "apres_midi") if p["voeux"].get((j, d)) != "non" and (j, d) not in ()]
        cap = min(sum(cren_demi[d] for _, d in libres), len({j for j, _ in libres}) * p["max_jour"])
        if h > cap:
            msgs.append(("err", f"{p['nom']} : {h} h demandées pour {cap} h réellement disponibles (vœux et limite par jour)."))
        elif h > 0.9 * cap:
            msgs.append(("warn", f"{p['nom']} : emploi du temps très contraint ({h} h pour {cap} h disponibles)."))
    for c, h in par_classe.items():
        if h > capacite_classe:
            msgs.append(("err", f"Classe {c} : {h} h demandées pour {capacite_classe} h possibles par semaine."))
    return msgs


def generer(grille, besoins, profs, options, essais=60, temps_max=8.0, graine=None):
    """Retourne {'placements', 'non_places', 'stats'}. `profs` : {id: {'nom','max_jour','voeux':{(jour,demi):'non'|'souhait'}}}."""
    options = {"classe_fermee": set(), "max_classe_jour": 7, **options}
    rng = random.Random(graine)
    toutes = seances(besoins)
    marge = {}
    base = Etat(grille, profs, options)
    for k, s in enumerate(toutes):
        marge[k] = len(base.candidats(s, False))
    ordre = sorted(range(len(toutes)), key=lambda k: (marge[k], -toutes[k]["len"]))
    meilleur, debut = None, time.time()
    for essai in range(essais):
        liste = [toutes[k] for k in ordre]
        etat, non = un_essai(grille, profs, liste, options, rng)
        ev = evaluer(etat, non)
        if meilleur is None or ev["score"] < meilleur[2]["score"]:
            meilleur = (etat, non, ev)
        if not non and ev["souhaits_non_respectes"] == 0 and essai >= 8:
            break
        if time.time() - debut > temps_max:
            break
        # prochain essai : les séances non placées d'abord, le reste en ordre bruité
        echecs = {id(s) for s in non}
        idx_echecs = [k for k in ordre if id(toutes[k]) in echecs]
        reste = [k for k in ordre if id(toutes[k]) not in echecs]
        bruit = sorted(reste, key=lambda k: marge[k] + rng.random() * 6)
        ordre = idx_echecs + bruit
    etat, non, ev = meilleur
    ev["essais"] = essai + 1
    ev["seances"] = len(toutes)
    ev["placees"] = len(etat.placements)
    return {
        "placements": etat.placements,
        "non_places": [{"besoin_id": s["besoin"]["id"], "classe": s["besoin"]["classe"], "matiere": s["besoin"]["matiere"],
                        "prof_id": s["besoin"]["prof_id"], "longueur": s["len"], "raisons": raisons(etat, s)} for s in non],
        "stats": ev,
    }
