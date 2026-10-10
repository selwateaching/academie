"""Moteur de diagnostic configurable.

Les règles sont des données (JSON) éditables par la professionnelle :

  condition : {"all": [...]} | {"any": [...]} | {"q": "<id question>", "op": "...", "v": ...}
  action    : {"verdict": "go|caution|prepare|not_now",
               "validation": true,           # validation professionnelle requise
               "alert": "texte d'alerte",
               "message": "texte affiché à la cliente",
               "recommend": ["slug-prestation", ...],
               "note": "note interne (visible par la professionnelle seulement)"}

Le verdict final est le plus sévère de toutes les règles déclenchées.
Les recommandations ne constituent jamais un avis médical.
"""

VERDICT_ORDER = ["go", "caution", "prepare", "not_now"]

OPERATORS = {
    "eq": "est égal à",
    "neq": "est différent de",
    "in": "fait partie de",
    "not_in": "ne fait pas partie de",
    "has": "contient",
    "has_any": "contient l'un de",
    "not_has": "ne contient pas",
    "gte": "≥",
    "lte": "≤",
    "answered": "est renseigné",
}

DEFAULT_VERDICT_TEXTS = {
    "go": {
        "title": "Votre prestation est possible",
        "message": "D'après vos réponses, rien ne s'oppose à la réalisation de la prestation souhaitée.",
    },
    "caution": {
        "title": "Prestation possible avec précautions",
        "message": "Votre prestation semble réalisable, avec quelques précautions que nous vous détaillons ci-dessous.",
    },
    "prepare": {
        "title": "Nous recommandons une préparation avant la prestation",
        "message": "Après analyse de votre diagnostic, nous vous recommandons de ne pas réaliser immédiatement la prestation souhaitée. Votre situation semble nécessiter une phase de préparation.",
    },
    "not_now": {
        "title": "Prestation déconseillée pour le moment",
        "message": "Après analyse de votre diagnostic, la prestation souhaitée ne nous paraît pas adaptée pour le moment. Un échange avec la professionnelle est nécessaire avant toute réservation.",
    },
}

DISCLAIMER = (
    "Ces recommandations sont indicatives et établies à partir de vos réponses : elles ne constituent "
    "pas un diagnostic médical. En cas d'allergie, de réaction, d'irritation, de douleur ou de doute, "
    "consultez un professionnel de santé. La professionnelle confirmera toujours la prestation en institut "
    "après examen, et reste libre de la refuser ou de l'adapter pour des raisons de sécurité."
)


def _as_list(a):
    if a is None or a == "":
        return []
    return a if isinstance(a, list) else [a]


def _num(a):
    try:
        return float(a)
    except (TypeError, ValueError):
        return None


def eval_condition(cond, answers):
    """Évalue une condition ; une condition vide est toujours vraie."""
    if not cond:
        return True
    if "all" in cond:
        return all(eval_condition(c, answers) for c in cond["all"])
    if "any" in cond:
        return any(eval_condition(c, answers) for c in cond["any"])
    qid, op, v = cond.get("q"), cond.get("op", "eq"), cond.get("v")
    a = answers.get(qid)
    vals = _as_list(a)
    vl = _as_list(v)
    if op == "answered":
        return bool(vals)
    if op == "eq":
        if isinstance(a, list):
            return set(map(str, vals)) == set(map(str, vl))
        return a not in (None, "") and str(a) == str(v)
    if op == "neq":
        return not eval_condition({"q": qid, "op": "eq", "v": v}, answers)
    if op == "in":
        return any(str(x) in map(str, vl) for x in vals)
    if op == "not_in":
        return not any(str(x) in map(str, vl) for x in vals)
    if op == "has":
        return str(v) in map(str, vals)
    if op == "has_any":
        return any(str(x) in map(str, vl) for x in vals)
    if op == "not_has":
        return str(v) not in map(str, vals)
    if op in ("gte", "lte"):
        n, t = _num(a), _num(v)
        if n is None or t is None:
            return False
        return n >= t if op == "gte" else n <= t
    return False


def visible_questions(questions, answers):
    """Questions à afficher compte tenu des conditions d'affichage (questions intelligentes)."""
    return [q for q in questions if eval_condition(q.get("show_if"), answers)]


def missing_required(diagnostic, answers):
    out = []
    for q in visible_questions(diagnostic["questions"], answers):
        if q.get("required", True) and not _as_list(answers.get(q["id"])):
            out.append(q["id"])
    return out


def evaluate(diagnostic, rules, answers, services_by_slug, requested_service=None):
    """Retourne le résultat du diagnostic.

    services_by_slug : {slug: {id, name, price, duration, ...}}
    """
    texts = dict(DEFAULT_VERDICT_TEXTS)
    for k, v in (diagnostic.get("verdict_texts") or {}).items():
        if k in texts and isinstance(v, dict):
            texts[k] = {**texts[k], **{kk: vv for kk, vv in v.items() if vv}}

    # on n'évalue que les réponses aux questions réellement visibles
    vis = {q["id"] for q in visible_questions(diagnostic["questions"], answers)}
    answers = {k: v for k, v in answers.items() if k in vis}

    verdict = "go"
    validation = False
    alerts, messages, notes, fired = [], [], [], []
    recommend = []
    for rule in sorted((r for r in rules if r.get("active", 1)), key=lambda r: (r.get("priority", 100), r["id"])):
        if not eval_condition(rule["condition"], answers):
            continue
        act = rule["action"] or {}
        fired.append({"id": rule["id"], "name": rule["name"]})
        v = act.get("verdict")
        if v in VERDICT_ORDER and VERDICT_ORDER.index(v) > VERDICT_ORDER.index(verdict):
            verdict = v
        validation = validation or bool(act.get("validation"))
        if act.get("alert"):
            alerts.append(act["alert"])
        if act.get("message"):
            messages.append(act["message"])
        if act.get("note"):
            notes.append(act["note"])
        for slug in act.get("recommend", []) or []:
            if slug in services_by_slug and slug not in recommend:
                recommend.append(slug)

    recs = [services_by_slug[s] for s in recommend]
    steps = []
    if verdict in ("prepare", "not_now") and recs:
        steps = [r["name"] for r in recs]
        if requested_service and verdict == "prepare":
            steps.append(f"{requested_service['name']} après amélioration de l'état de votre {_subject(diagnostic)}")
        quote_items = recs
    elif verdict in ("go", "caution") and requested_service:
        quote_items = [requested_service] + [r for r in recs if r["slug"] != requested_service["slug"]]
        steps = [r["name"] for r in quote_items]
    else:
        quote_items = recs or ([requested_service] if requested_service and verdict != "not_now" else [])

    return {
        "verdict": verdict,
        "title": texts[verdict]["title"],
        "message": texts[verdict]["message"],
        "extra_messages": messages,
        "alerts": alerts,
        "needs_validation": validation or verdict == "not_now",
        "recommended": [{"id": s["id"], "slug": s["slug"], "name": s["name"], "price": s["price"],
                         "duration": s["duration"]} for s in quote_items],
        "steps": steps,
        "internal_notes": notes,
        "fired_rules": fired,
        "disclaimer": DISCLAIMER,
    }


def _subject(diagnostic):
    cat = (diagnostic.get("category") or "").lower()
    return {"cheveux": "chevelure", "ongles": "ongles", "pieds": "pieds", "cils": "cils"}.get(cat, "situation")
