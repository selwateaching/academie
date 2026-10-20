"""Séquences — créateur de séquences de leçons avec Claude.

Étapes côté page : sujet → réglages → plan modifiable → génération leçon par leçon.
La clé API reste sur le serveur.

Variables d'environnement :
  ANTHROPIC_API_KEY  clé API Anthropic (obligatoire pour générer)
  SEQ_ACCESS_CODE    facultatif : code demandé avant de générer
  SEQ_MODEL          facultatif : modèle Claude (défaut claude-sonnet-5-5)
  SEQ_PER_HOUR       facultatif : appels IA max par heure et par IP (défaut 60)
"""

import hmac
import json
import os
import re
import threading
import time
from collections import defaultdict, deque

import anthropic
from flask import Flask, Response, jsonify, request, send_from_directory

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
MODEL = os.environ.get("SEQ_MODEL", "claude-sonnet-5-5")
ACCESS_CODE = os.environ.get("SEQ_ACCESS_CODE", "").strip()
PER_HOUR = int(os.environ.get("SEQ_PER_HOUR", "60"))

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024

SYSTEM = (
    "Tu es un concepteur pédagogique expert. Tu écris en français clair (ou dans la langue demandée), "
    "adapté à l'âge des élèves, avec des contenus exacts et concrets. "
    "Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour."
)

FRAMEWORKS = {
    "standard": "modélisation explicite, pratique guidée, vérifications régulières de la compréhension",
    "jfn": "Je fais / Nous faisons / Tu fais",
    "5e": "5E : Engager, Explorer, Expliquer, Élaborer, Évaluer",
    "rosenshine": "principes de Rosenshine : révision, petites étapes, questions, modèles, pratique guidée",
    "imr": "Introduction / Activité principale / Bilan",
}

_log = defaultdict(deque)
_lock = threading.Lock()
_client = None


def error(code, message, status):
    return jsonify({"code": code, "error": message}), status


def client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[0].strip() if fwd else (request.remote_addr or "?")


def rate_ok(ip):
    now = time.time()
    with _lock:
        q = _log[ip]
        while q and now - q[0] > 3600:
            q.popleft()
        if len(q) >= PER_HOUR:
            return False
        q.append(now)
        return True


def parse_json(text):
    text = text.strip()
    candidates = [text]
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fence:
        candidates.append(fence.group(1).strip())
    a, b = text.find("{"), text.rfind("}")
    if a != -1 and b > a:
        candidates.append(text[a:b + 1])
    for c in candidates:
        try:
            return json.loads(c)
        except ValueError:
            continue
    return None


def s(value, limit):
    return str(value or "").strip()[:limit]


def ask(prompt, max_tokens):
    """Appelle Claude et renvoie (dict, None) ou (None, réponse d'erreur)."""
    global _client
    if ACCESS_CODE and not hmac.compare_digest(
        request.headers.get("X-Seq-Code", "").encode(), ACCESS_CODE.encode()
    ):
        return None, error("access", "Code d'accès requis.", 401)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None, error("no_key", "ANTHROPIC_API_KEY n'est pas configurée sur le serveur.", 503)
    if not rate_ok(client_ip()):
        return None, error("rate_limited", "Trop de générations. Réessayez plus tard.", 429)
    if _client is None:
        _client = anthropic.Anthropic(timeout=300.0)
    try:
        msg = _client.messages.create(
            model=MODEL, max_tokens=max_tokens, system=SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.AuthenticationError:
        return None, error("no_key", "Clé API invalide.", 503)
    except anthropic.RateLimitError:
        return None, error("rate_limited", "Limite de l'API Anthropic atteinte.", 429)
    except anthropic.APIStatusError as e:
        app.logger.warning("API %s: %s", e.status_code, e.message)
        return None, error("upstream_error", "Erreur du service Claude.", 502)
    except anthropic.APIConnectionError:
        return None, error("upstream_error", "Connexion à Claude impossible.", 502)
    if msg.stop_reason == "refusal":
        return None, error("refused", "Claude a refusé cette demande.", 422)
    data = parse_json("".join(b.text for b in msg.content if b.type == "text"))
    if not isinstance(data, dict):
        return None, error("invalid_json", "Réponse illisible, réessayez.", 422)
    return data, None


def brief(b):
    """Résumé de la demande, commun au plan et aux leçons."""
    lines = [
        f"Sujet de la séquence : {s(b.get('topic'), 300)}",
        f"Niveau : {s(b.get('level'), 80)}",
        f"Langue des contenus : {s(b.get('language'), 40) or 'français'}",
    ]
    if b.get("instructions"):
        lines.append(f"Consignes de l'enseignant : {s(b['instructions'], 3000)}")
    return "\n".join(lines)


@app.post("/api/outline")
def outline():
    b = request.get_json(silent=True) or {}
    if not s(b.get("topic"), 300):
        return error("invalid_request", "Sujet manquant.", 400)
    n = max(2, min(10, int(b.get("count") or 5)))
    data, err = ask(
        f"{brief(b)}\n\nPropose le plan d'une séquence de {n} leçons, progressives et cohérentes "
        "(chaque leçon s'appuie sur la précédente).\n"
        'Format : {"title": "titre de la séquence", "lessons": [{"title": "...", "summary": "2 phrases : ce que couvre la leçon"}]}',
        3000,
    )
    if err:
        return err
    lessons = [
        {"title": s(l.get("title"), 160), "summary": s(l.get("summary"), 600)}
        for l in data.get("lessons", []) if isinstance(l, dict) and l.get("title")
    ][:10]
    if not lessons:
        return error("invalid_json", "Plan vide, réessayez.", 422)
    return jsonify({"title": s(data.get("title"), 160) or s(b.get("topic"), 160), "lessons": lessons})


@app.post("/api/lesson")
def lesson():
    b = request.get_json(silent=True) or {}
    plan = b.get("lessons")
    try:
        idx = int(b.get("index"))
    except (TypeError, ValueError):
        idx = -1
    if not isinstance(plan, list) or not 0 <= idx < len(plan) or len(plan) > 10:
        return error("invalid_request", "Plan ou numéro de leçon invalide.", 400)
    opt = b.get("options") if isinstance(b.get("options"), dict) else {}
    slides = max(6, min(20, int(opt.get("slides") or 10)))
    outline_txt = "\n".join(
        f"{i + 1}. {s(l.get('title'), 160)} — {s(l.get('summary'), 600)}" for i, l in enumerate(plan)
    )
    cur = plan[idx]
    extras = []
    if opt.get("objectives", True):
        extras.append('"objectives": ["2 à 4 objectifs d\'apprentissage"]')
    if opt.get("vocabulary", True):
        extras.append('"vocabulary": [{"term": "...", "definition": "..."}] (4 à 8 mots clés)')
    if opt.get("quiz", True):
        extras.append('"quiz": [{"q": "...", "choices": ["A","B","C","D"], "answer": 0, "why": "explication courte"}] (4 questions, "answer" = indice de la bonne réponse)')
    data, err = ask(
        f"{brief(b)}\nCadre de leçon : {FRAMEWORKS.get(b.get('framework'), FRAMEWORKS['standard'])}\n\n"
        f"Titre de la séquence : {s(b.get('title'), 160)}\nPlan complet :\n{outline_txt}\n\n"
        f"Écris maintenant la leçon {idx + 1} : « {s(cur.get('title'), 160)} » ({s(cur.get('summary'), 600)}). "
        "Ne répète pas le contenu des autres leçons.\n"
        f'Format : {{"title": "...", "slides": [{{"title": "...", "bullets": ["3 à 5 phrases courtes"], "emoji": "un emoji", "notes": "notes pour l\'enseignant : points clés, erreurs fréquentes, réponses"}}], '
        f'{", ".join(extras)}}}\nExactement {slides} diapositives, de l\'accroche au bilan.',
        16000,
    )
    if err:
        return err
    out = {
        "title": s(data.get("title"), 160) or s(cur.get("title"), 160),
        "slides": [
            {
                "title": s(x.get("title"), 160),
                "bullets": [s(t, 400) for t in x.get("bullets", []) if t][:8],
                "emoji": s(x.get("emoji"), 8),
                "notes": s(x.get("notes"), 1500),
            }
            for x in data.get("slides", []) if isinstance(x, dict)
        ][:24],
        "objectives": [s(t, 300) for t in data.get("objectives", []) if t][:6],
        "vocabulary": [
            {"term": s(v.get("term"), 80), "definition": s(v.get("definition"), 300)}
            for v in data.get("vocabulary", []) if isinstance(v, dict) and v.get("term")
        ][:12],
        "quiz": [],
    }
    for q in data.get("quiz", []):
        if isinstance(q, dict) and isinstance(q.get("choices"), list) and isinstance(q.get("answer"), int):
            ch = [s(c, 200) for c in q["choices"]][:6]
            if 0 <= q["answer"] < len(ch):
                out["quiz"].append({"q": s(q.get("q"), 400), "choices": ch, "answer": q["answer"], "why": s(q.get("why"), 500)})
    if not out["slides"]:
        return error("invalid_json", "Leçon vide, réessayez.", 422)
    return jsonify(out)


@app.get("/")
def index():
    with open(os.path.join(STATIC_DIR, "index.html"), encoding="utf-8") as f:
        return Response(f.read(), mimetype="text/html", headers={"Cache-Control": "no-cache"})


@app.get("/healthz")
def healthz():
    return {"ok": True, "ai": bool(os.environ.get("ANTHROPIC_API_KEY"))}


@app.get("/<path:name>")
def static_files(name):
    return send_from_directory(STATIC_DIR, name)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
