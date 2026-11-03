"""Agent 5 – Responsable commercial IA : analyse les résultats et recommande les prochaines actions.

Règles de confiance :
- l'IA reçoit uniquement des CHIFFRES agrégés (jamais de nom, email ou téléphone de prospect) ;
- elle ne doit citer aucun chiffre absent des données ; si la réponse est inutilisable ou si la clé OpenAI
  manque, l'analyse est produite par des règles simples (toujours disponibles).
"""
import json
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..relances import aware, due_companies
from . import llm
from .targets import label

CONTACTED = ("contacte", "repondu", "rdv", "partenaire", "refuse")
REPLIED = ("repondu", "rdv", "partenaire")

SYSTEM = (
    "Tu es le responsable commercial d'un garage-carrosserie-mécanique qui prospecte des professionnels de l'automobile "
    "(loueurs, flottes, concessions, assureurs, taxis, transporteurs…) pour obtenir des partenariats de sous-traitance. "
    "À partir des chiffres fournis (JSON), rédige une analyse hebdomadaire en français, claire pour un dirigeant de garage. "
    "RÈGLES : n'utilise QUE les chiffres fournis, n'invente rien ; si les données sont trop faibles pour conclure "
    "(moins de 5 prospects contactés par exemple), dis-le franchement au lieu de tirer des conclusions. "
    "Réponds en JSON : {\"summary\": \"3 à 4 phrases\", \"recommendations\": [{\"action\": \"verbe à l'infinitif, concret\", "
    "\"why\": \"une phrase appuyée sur un chiffre\"}] (3 à 5 éléments, du plus important au moins important), "
    "\"alerts\": [\"point de vigilance\"] (0 à 3 éléments)}."
)


def gather_facts(db: Session, days: int = 7) -> dict:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    companies = list(db.scalars(select(models.Company)))
    live = [c for c in companies if c.status != "archive"]
    messages = list(db.scalars(select(models.Message)))
    events = [e for e in db.scalars(select(models.InboxEvent)) if aware(e.at) >= since]
    by_status: dict[str, int] = {}
    for c in companies:
        by_status[c.status] = by_status.get(c.status, 0) + 1

    cats: dict[str, dict] = {}
    for c in companies:
        d = cats.setdefault(label(c.category) if c.category else "Sans catégorie",
                            {"prospects": 0, "contactes": 0, "ont_repondu": 0, "rendez_vous": 0})
        d["prospects"] += 1
        d["contactes"] += c.status in CONTACTED or c.status == "archive"
        d["ont_repondu"] += c.status in REPLIED
        d["rendez_vous"] += c.status in ("rdv", "partenaire")

    calls = {"total": 0, "interesses": 0, "sans_reponse": 0, "refus": 0}
    for c in companies:
        for m in re.finditer(r"Appel du (\d{2})/(\d{2})/(\d{4}) [\d:]+ \([^)]*\) : ([^\n–]+)", c.notes or ""):
            try:
                when = datetime(int(m[3]), int(m[2]), int(m[1]), tzinfo=timezone.utc)
            except ValueError:
                continue
            if when >= since.replace(hour=0, minute=0, second=0, microsecond=0):
                calls["total"] += 1
                out = m[4].strip().lower()
                calls["interesses"] += out.startswith("intéress")
                calls["sans_reponse"] += out.startswith("pas de réponse")
                calls["refus"] += out.startswith("pas intéress")

    sent = [m for m in messages if m.sent_at and m.status == "envoye" and aware(m.sent_at) >= since]
    return {
        "periode_jours": days,
        "nouveaux_prospects": sum(1 for c in companies if aware(c.created_at) >= since),
        "emails_envoyes": sum(1 for m in sent if m.kind == "email"),
        "relances_envoyees": sum(1 for m in sent if m.kind == "relance"),
        "reponses_recues": sum(1 for e in events if e.kind in ("reponse", "refus", "stop")),
        "demandes_stop": sum(1 for e in events if e.kind == "stop"),
        "appels": calls,
        "total_prospects_actifs": len(live),
        "par_statut": by_status,
        "par_categorie": cats,
        "a_traiter": {
            "ont_repondu_a_rappeler": by_status.get("repondu", 0),
            "messages_en_attente": sum(1 for m in messages if m.status in ("brouillon", "valide") and m.kind != "confirmation_stop"),
            "relances_a_faire": len(due_companies(db)),
            "prets_pour_email": sum(1 for c in live if c.status == "a_contacter" and c.email and not c.do_not_contact),
            "sans_email_a_appeler": sum(1 for c in live if c.status == "a_contacter" and not c.email and c.phone and not c.do_not_contact),
        },
    }


def _n(n: int, one: str, many: str) -> str:
    """« 1 prospect » / « 3 prospects »."""
    return f"{n} {one if n == 1 else many}"


def rule_analysis(f: dict) -> dict:
    a, calls = f["a_traiter"], f["appels"]
    st = f["par_statut"]
    rdv, part = st.get("rdv", 0), st.get("partenaire", 0)
    summary = (f"Sur les {f['periode_jours']} derniers jours : {f['nouveaux_prospects']} nouveaux prospects, "
               f"{f['emails_envoyes']} emails et {f['relances_envoyees']} relances envoyés, {calls['total']} appels, "
               f"{f['reponses_recues']} réponses reçues. Total actuel : {f['total_prospects_actifs']} prospects actifs, "
               f"{rdv} rendez-vous en cours et {part} partenaires.")
    recs: list[dict] = []
    if a["ont_repondu_a_rappeler"]:
        k = a["ont_repondu_a_rappeler"]
        recs.append({"action": "Rappeler " + (f"le prospect qui a répondu" if k == 1 else f"les {k} prospects qui ont répondu"),
                     "why": "Ce sont les contacts les plus chauds : une réponse non traitée refroidit vite."})
    if a["messages_en_attente"]:
        k = a["messages_en_attente"]
        recs.append({"action": "Valider ou rejeter " + ("le message en attente" if k == 1 else f"les {k} messages en attente"),
                     "why": "Tant qu'ils ne sont pas validés, aucun prospect concerné n'est contacté."})
    if a["relances_a_faire"]:
        recs.append({"action": "Préparer " + ("la relance due" if a["relances_a_faire"] == 1 else f"les {a['relances_a_faire']} relances dues"),
                     "why": "Ces prospects n'ont pas répondu depuis plusieurs jours et sont éligibles à une relance."})
    if a["prets_pour_email"] and not f["emails_envoyes"]:
        recs.append({"action": "Envoyer le premier email " + ("au prospect dont l'adresse est connue" if a["prets_pour_email"] == 1 else f"aux {a['prets_pour_email']} prospects dont l'adresse est connue"),
                     "why": "Aucun email n'est parti sur la période alors que des prospects sont prêts."})
    if a["sans_email_a_appeler"]:
        recs.append({"action": "Appeler " + ("le prospect sans email" if a["sans_email_a_appeler"] == 1 else f"les {a['sans_email_a_appeler']} prospects sans email") + " depuis l'onglet « À appeler »",
                     "why": "Ils ont un téléphone mais aucune adresse publique : l'appel est leur seul canal."})
    ranked = [(n, d) for n, d in f["par_categorie"].items() if d["contactes"] >= 3]
    if ranked:
        n, d = max(ranked, key=lambda x: (x[1]["ont_repondu"] / x[1]["contactes"], x[1]["contactes"]))
        if d["ont_repondu"]:
            recs.append({"action": f"Donner la priorité à la catégorie « {n} »",
                         "why": f"{_n(d['ont_repondu'], 'réponse', 'réponses')} pour {_n(d['contactes'], 'prospect contacté', 'prospects contactés')}, le meilleur taux actuel."})
    if not f["nouveaux_prospects"]:
        recs.append({"action": "Lancer une nouvelle recherche (autre ville ou autre catégorie)",
                     "why": "Aucun nouveau prospect n'a été ajouté sur la période."})
    alerts = []
    if f["demandes_stop"]:
        alerts.append(f"{_n(f['demandes_stop'], 'demande STOP', 'demandes STOP')} sur la période : vérifier que le ciblage et le message restent pertinents.")
    contacted = sum(d["contactes"] for d in f["par_categorie"].values())
    if contacted < 5:
        alerts.append(f"Seulement {_n(contacted, 'prospect contacté', 'prospects contactés')} au total : trop peu pour tirer des conclusions fiables.")
    return {"summary": summary, "recommendations": recs[:5] or [{"action": "Poursuivre la prospection", "why": "Rien d'urgent à signaler."}],
            "alerts": alerts[:3]}


def _valid(out) -> dict | None:
    try:
        recs = [{"action": str(r["action"])[:200], "why": str(r.get("why", ""))[:300]} for r in out["recommendations"] if r.get("action")]
        if not out.get("summary") or not recs:
            return None
        return {"summary": str(out["summary"])[:900], "recommendations": recs[:5],
                "alerts": [str(x)[:250] for x in (out.get("alerts") or [])][:3]}
    except (KeyError, TypeError, AttributeError):
        return None


def analyse(db: Session, days: int = 7) -> dict:
    """Produit et enregistre l'analyse. Retourne le contenu + source + date."""
    facts = gather_facts(db, days)
    result = _valid(llm.chat_json(SYSTEM, json.dumps(facts, ensure_ascii=False)))
    source = "ia" if result else "regles"
    result = result or rule_analysis(facts)
    row = models.WeeklyAnalysis(days=days, source=source, content=json.dumps(result | {"facts": facts}, ensure_ascii=False))
    db.add(row)
    db.commit()
    return {"id": row.id, "created_at": row.created_at.isoformat(), "days": days, "source": source, **result}


def latest(db: Session) -> dict | None:
    row = db.scalars(select(models.WeeklyAnalysis).order_by(models.WeeklyAnalysis.id.desc()).limit(1)).first()
    if not row:
        return None
    data = json.loads(row.content)
    return {"id": row.id, "created_at": row.created_at.isoformat(), "days": row.days, "source": row.source,
            "summary": data["summary"], "recommendations": data["recommendations"], "alerts": data.get("alerts", [])}


def email_text(a: dict, garage: str) -> tuple[str, str]:
    lines = [f"Rapport commercial hebdomadaire – {garage}", "", a["summary"], ""]
    if a["alerts"]:
        lines += ["Points de vigilance :"] + [f"  ! {x}" for x in a["alerts"]] + [""]
    lines.append("Actions recommandées :")
    for i, r in enumerate(a["recommendations"], 1):
        lines.append(f"  {i}. {r['action']}" + (f"\n     → {r['why']}" if r["why"] else ""))
    lines += ["", "Détail complet : onglet « Rapport » du CRM.",
              "(Analyse rédigée par l'IA à partir des chiffres du CRM)" if a["source"] == "ia" else "(Analyse produite à partir des chiffres du CRM)"]
    return f"Rapport commercial de la semaine – {garage}", "\n".join(lines)
