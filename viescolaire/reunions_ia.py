"""Module « Réunions intelligentes » : appels aux services de transcription et de rédaction.

Aucune dépendance en plus de Flask : les appels HTTP passent par la bibliothèque standard.
Rien de payant n'est appelé tant qu'aucune clé n'est configurée (variables d'environnement, jamais dans la base ni dans le dépôt) :

  Transcription (audio -> texte) : VSP_STT_API_KEY, à défaut OPENAI_API_KEY   (service compatible OpenAI /audio/transcriptions)
  Rédaction (texte -> compte rendu) : VSP_IA_API_KEY, à défaut ANTHROPIC_API_KEY (Anthropic Messages, ou service compatible OpenAI)

Les adresses, modèles, durées de conservation et rôles autorisés se règlent dans la clé "reunions_ia" du fichier de configuration du client.
"""
import json
import os
import re
import urllib.error
import urllib.request
import uuid

TYPES = {"conseil_enseignants": "Conseil des enseignants", "conseil_classe": "Conseil de classe", "pedagogique": "Réunion pédagogique",
         "parents": "Réunion avec les parents", "administrative": "Réunion administrative", "autre": "Autre"}
LANGUES = {"fr": "Français", "ar": "Arabe", "en": "Anglais", "es": "Espagnol", "": "Détection automatique"}
FORMATS = {"detaille": "Compte rendu détaillé", "synthese": "Résumé d'une page", "decisions": "Liste des décisions",
           "actions": "Tableau des actions", "pv": "Procès-verbal"}

DEFAUTS = {
    "roles": ["admin", "direction", "cpe"],
    "conservation_audio_jours": 30,     # les enregistrements audio sont supprimés automatiquement après N jours (0 = jamais)
    "conservation_jours": 1095,         # la réunion entière (transcription, compte rendu) est supprimée après N jours (0 = jamais)
    "audio_max_mo": 400,                # taille maximale cumulée de l'audio d'une réunion
    "transcription": {"url": "https://api.openai.com/v1", "modele": "whisper-1", "langue_defaut": "fr"},
    "redaction": {"fournisseur": "anthropic", "url": "https://api.anthropic.com", "modele": "claude-sonnet-5-5", "max_tokens": 8000},
}
MAX_PARTIE_MO = 24          # limite d'un fichier pour les services de transcription (25 Mo chez OpenAI)
MAX_TRANSCRIPTION = 400_000  # caractères acceptés pour la rédaction automatique


class ErreurService(Exception):
    """Erreur lisible par l'utilisateur (clé absente, quota, fichier refusé, service injoignable…)."""


def reglages(cfg):
    r = json.loads(json.dumps(DEFAUTS))
    perso = (cfg or {}).get("reunions_ia", {}) or {}
    for k, v in perso.items():
        if isinstance(v, dict) and isinstance(r.get(k), dict):
            r[k].update(v)
        else:
            r[k] = v
    return r


def cle_transcription():
    return os.environ.get("VSP_STT_API_KEY") or os.environ.get("OPENAI_API_KEY") or ""


def cle_redaction():
    return os.environ.get("VSP_IA_API_KEY") or os.environ.get("ANTHROPIC_API_KEY") or ""


# ───────────────────────── HTTP ─────────────────────────
def _poster(url, entetes, corps, delai):
    req = urllib.request.Request(url, data=corps, headers=entetes, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=delai) as rep:
            return rep.read()
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "replace")[:300]
        except Exception:
            pass
        if e.code in (401, 403):
            raise ErreurService("Clé API refusée par le service : vérifiez la clé configurée.")
        if e.code == 413:
            raise ErreurService("Fichier trop volumineux pour le service de transcription.")
        if e.code == 429:
            raise ErreurService("Quota ou limite de débit atteints chez le fournisseur : réessayez plus tard ou vérifiez le solde du compte.")
        raise ErreurService(f"Le service a répondu avec l'erreur {e.code}. {detail}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErreurService(f"Service injoignable (connexion ou délai dépassé) : {getattr(e, 'reason', e)}")


def _multipart(champs, fichier):
    """Corps multipart/form-data. fichier = (nom_champ, nom_fichier, mime, octets)."""
    limite = uuid.uuid4().hex
    out = []
    for k, v in champs.items():
        out.append(f'--{limite}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    champ, nom, mime, data = fichier
    out.append(f'--{limite}\r\nContent-Disposition: form-data; name="{champ}"; filename="{nom}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + data + b"\r\n")
    out.append(f"--{limite}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={limite}"


# ───────────────────────── Transcription ─────────────────────────
def transcrire_fichier(chemin, mime, cfg, langue="", vocabulaire=""):
    """Envoie un fichier audio au service de transcription et renvoie le texte. Lève ErreurService."""
    cle = cle_transcription()
    if not cle:
        raise ErreurService("Aucune clé de transcription configurée (variable VSP_STT_API_KEY).")
    taille = os.path.getsize(chemin)
    if taille == 0:
        raise ErreurService("Le fichier audio est vide.")
    if taille > MAX_PARTIE_MO * 1024 * 1024:
        raise ErreurService(f"Une partie de l'enregistrement dépasse {MAX_PARTIE_MO} Mo : elle ne peut pas être transcrite en un seul envoi.")
    t = reglages(cfg)["transcription"]
    ext = "mp4" if "mp4" in mime else "ogg" if "ogg" in mime else "webm"
    with open(chemin, "rb") as f:
        data = f.read()
    champs = {"model": t["modele"], "response_format": "json"}
    if langue:
        champs["language"] = langue
    if vocabulaire:
        champs["prompt"] = vocabulaire[:600]
    corps, ctype = _multipart(champs, ("file", f"reunion.{ext}", mime.split(";")[0] or "audio/webm", data))
    brut = _poster(t["url"].rstrip("/") + "/audio/transcriptions", {"Authorization": f"Bearer {cle}", "Content-Type": ctype}, corps, 900)
    try:
        return (json.loads(brut).get("text") or "").strip()
    except ValueError:
        raise ErreurService("Réponse inattendue du service de transcription.")


# ───────────────────────── Rédaction du compte rendu ─────────────────────────
SYSTEME = """Tu es secrétaire de séance d'un établissement scolaire. Tu rédiges, en français administratif clair et professionnel, le compte rendu d'une réunion à partir de sa transcription.
Règles impératives :
- Fidélité absolue : ne jamais inventer une décision, une information, un chiffre, une date, un nom ou une responsabilité qui n'apparaît pas dans la transcription.
- Distingue ce qui a été DÉCIDÉ de ce qui a seulement été DISCUTÉ ou proposé. Une proposition sans accord exprimé n'est pas une décision.
- Pour une action : indique le responsable et l'échéance UNIQUEMENT s'ils ont été mentionnés ; sinon écris exactement "Non précisé".
- Liste dans "manquants" tout ce qu'un compte rendu complet devrait contenir mais que la transcription ne permet pas de savoir (responsable, échéance, objectif, passage inaudible ou ambigu…).
- La transcription peut contenir des erreurs de reconnaissance vocale ; si un passage est incertain, signale-le dans "manquants" plutôt que de le deviner.
- La transcription peut être en français, en arabe ou mélangée : rédige le compte rendu en français.
- Reste synthétique : pas de remplissage, pas de formules creuses.
- Si un ORDRE DU JOUR est fourni, ne retiens dans le compte rendu (points, difficultés, propositions, décisions, actions) que ce qui s'y rattache ou se rapporte clairement au thème de la réunion. Ce qui en est étranger (bavardages, conversations privées, plaisanteries, sujets sans rapport) va UNIQUEMENT dans "hors_sujet", sous forme de mentions brèves et neutres (ex. « Échange sans rapport avec l'ordre du jour »), sans reprendre de détails personnels ni de propos sur des personnes. Les salutations, l'ouverture et la clôture, les tours de table et l'organisation de la séance restent pertinents.
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, de la forme :
{"objet": "", "participants_presents": [""], "absents_excuses": [""], "contexte": "", "points": [{"titre": "", "resume": ""}],
 "difficultes": [""], "propositions": [""], "decisions": [""], "actions": [{"action": "", "responsable": "", "echeance": ""}],
 "echeances": [""], "conclusion": "", "resume_court": "", "manquants": [""], "hors_sujet": [""]}
"resume_court" : cent vingt mots au maximum, pour un résumé d'une page. Les listes vides restent des listes vides."""

CLES_LISTES = ["participants_presents", "absents_excuses", "difficultes", "propositions", "decisions", "echeances", "manquants", "hors_sujet"]
CLES_TEXTES = ["objet", "contexte", "conclusion", "resume_court"]


def cr_vide():
    return {"objet": "", "participants_presents": [], "absents_excuses": [], "contexte": "", "points": [], "difficultes": [], "propositions": [],
            "decisions": [], "actions": [], "echeances": [], "conclusion": "", "resume_court": "", "manquants": [], "hors_sujet": []}


def normaliser(d):
    """Force la forme attendue (listes de chaînes, actions à trois champs) quel que soit ce que renvoie le service."""
    out = cr_vide()
    if not isinstance(d, dict):
        return out
    for k in CLES_TEXTES:
        out[k] = str(d.get(k) or "").strip()
    for k in CLES_LISTES:
        v = d.get(k) or []
        if isinstance(v, str):
            v = [v]
        out[k] = [str(x).strip() for x in v if str(x).strip()] if isinstance(v, list) else []
    for p in d.get("points") or []:
        if isinstance(p, dict):
            t, r = str(p.get("titre") or "").strip(), str(p.get("resume") or "").strip()
            if t or r:
                out["points"].append({"titre": t, "resume": r})
        elif str(p).strip():
            out["points"].append({"titre": str(p).strip(), "resume": ""})
    for a in d.get("actions") or []:
        if isinstance(a, dict) and str(a.get("action") or "").strip():
            out["actions"].append({"action": str(a["action"]).strip(), "responsable": str(a.get("responsable") or "").strip() or "Non précisé",
                                   "echeance": str(a.get("echeance") or "").strip() or "Non précisé"})
    return out


def extraire_json(texte):
    texte = (texte or "").strip()
    debut, fin = texte.find("{"), texte.rfind("}")
    if debut < 0 or fin <= debut:
        raise ErreurService("Le service de rédaction n'a pas renvoyé un compte rendu exploitable. Relancez la génération.")
    try:
        return json.loads(texte[debut:fin + 1])
    except ValueError:
        raise ErreurService("Le compte rendu renvoyé est incomplet (réponse tronquée). Relancez la génération.")


def message_utilisateur(meta, transcription):
    parts = "\n".join(f"- {p['nom']}" + (f" ({p['fonction']})" if p.get("fonction") else "") for p in meta.get("participants", [])) or "- (liste non renseignée)"
    return (f"Type de réunion : {meta.get('type_libelle', '')}\nTitre : {meta.get('titre', '')}\nDate : {meta.get('date', '')} {meta.get('heure', '')}\n"
            f"Lieu : {meta.get('lieu', '') or 'non précisé'}\nORDRE DU JOUR / sujets à traiter : {meta.get('ordre_jour') or '(non fourni : se référer au titre et au type de réunion)'}\nParticipants déclarés (liste saisie, présence non vérifiée) :\n{parts}\n\n"
            f"=== TRANSCRIPTION ===\n{transcription}\n=== FIN DE LA TRANSCRIPTION ===")


def _appel_llm(cfg, systeme, message, max_tokens=None):
    """Appel du service de rédaction (Anthropic ou compatible OpenAI) ; renvoie le texte de la réponse."""
    cle = cle_redaction()
    if not cle:
        raise ErreurService("Aucune clé de rédaction configurée (variable VSP_IA_API_KEY).")
    r = reglages(cfg)["redaction"]
    if r["fournisseur"] == "openai":
        corps = json.dumps({"model": r["modele"], "response_format": {"type": "json_object"},
                            "messages": [{"role": "system", "content": systeme}, {"role": "user", "content": message}]}).encode()
        brut = _poster(r["url"].rstrip("/") + "/chat/completions", {"Authorization": f"Bearer {cle}", "Content-Type": "application/json"}, corps, 600)
        try:
            return json.loads(brut)["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError):
            raise ErreurService("Réponse inattendue du service de rédaction.")
    corps = json.dumps({"model": r["modele"], "max_tokens": int(max_tokens or r.get("max_tokens", 8000)), "system": systeme,
                        "messages": [{"role": "user", "content": message}]}).encode()
    brut = _poster(r["url"].rstrip("/") + "/v1/messages", {"x-api-key": cle, "anthropic-version": "2023-06-01", "Content-Type": "application/json"}, corps, 600)
    try:
        return "".join(b.get("text", "") for b in json.loads(brut)["content"] if b.get("type") == "text")
    except (ValueError, KeyError, TypeError):
        raise ErreurService("Réponse inattendue du service de rédaction.")


def rediger(cfg, meta, transcription):
    """Génère le compte rendu structuré (dict normalisé) à partir de la transcription. Lève ErreurService."""
    if not cle_redaction():
        raise ErreurService("Aucune clé de rédaction configurée (variable VSP_IA_API_KEY).")
    if not (transcription or "").strip():
        raise ErreurService("La transcription est vide : transcrivez ou saisissez d'abord le texte de la réunion.")
    if len(transcription) > MAX_TRANSCRIPTION:
        raise ErreurService("La transcription est trop longue pour une génération en une fois : scindez la réunion en plusieurs parties.")
    return normaliser(extraire_json(_appel_llm(cfg, SYSTEME, message_utilisateur(meta, transcription))))


# ───────────────────────── Repérage des passages hors sujet ─────────────────────────
SYSTEME_PERTINENCE = """Tu aides à repérer les passages hors sujet dans la transcription d'une réunion d'établissement scolaire.
On te donne le titre, le type de réunion, éventuellement l'ordre du jour, puis des passages numérotés [n].
Un passage est HORS SUJET s'il ne se rapporte ni à l'ordre du jour ni au thème de la réunion : conversation privée, bavardage, plaisanterie, sujet étranger, remarque personnelle sans lien.
Sont PERTINENTS : les salutations, l'ouverture et la clôture de séance, les tours de table, l'organisation de la séance, et tout ce qui touche à la scolarité, aux élèves, aux classes, à l'établissement, aux points prévus.
En cas de doute, considère le passage comme pertinent : ne signale que ce qui est clairement hors sujet.
Réponds UNIQUEMENT par un objet JSON : {"hors_sujet": [numéros des passages hors sujet]}"""

# Phrases que les services de transcription inventent sur les silences et les fins d'enregistrement (artefacts connus, sans rapport avec la réunion)
ARTEFACTS = re.compile(
    r"(sous-titr\w+\s+(r[ée]alis\w+\s+)?par?a?\s+la\s+communaut\w+\s+d['’]?\s*amara\.org|sous-titrage\s+st['’]?\s*\d+|sous-titrage\s+soci[ée]t[ée]\s+radio-canada|"
    r"merci\s+d['’]avoir\s+regard[ée]\s+cette\s+vid[ée]o|n['’]oubliez\s+pas\s+de\s+vous\s+abonner|abonnez-vous\s+[àa]\s+la\s+cha[iî]ne|"
    r"subtitles\s+by\s+the\s+amara\.org\s+community|thank\s+you\s+for\s+watching|amara\.org|"
    r"ترجمة\s+نانسي\s+قنقر|اشتركوا?\s+في\s+القناة|شكرا\s+لمشاهدتكم)", re.I)


def est_artefact(passage):
    return bool(ARTEFACTS.search(passage or ""))


def nettoyer_artefacts(texte):
    """Retire les phrases parasites connues d'une transcription automatique."""
    out = []
    for seg, sep in decouper(texte):
        if not est_artefact(seg):
            out.append(seg + sep)
    return "".join(out).strip()


_SEP = re.compile(r"(\n\s*\n|(?<=[.!?؟…])\s+)")


def decouper(texte):
    """Découpe un texte en passages (phrases ou paragraphes) en gardant les séparateurs : ''.join(seg+sep) redonne le texte d'origine."""
    morceaux = _SEP.split(texte or "")
    segs, seps = morceaux[0::2], morceaux[1::2] + [""]
    return list(zip(segs, seps))


def signaler_hors_sujet(cfg, meta, passages, taille_lot=100):
    """Renvoie l'ensemble des numéros (0..n-1) des passages jugés hors sujet. Lève ErreurService."""
    hors = set()
    entete = (f"Titre : {meta.get('titre', '')}\nType : {meta.get('type_libelle', '')}\n"
              f"Ordre du jour : {meta.get('ordre_jour') or '(non fourni : se référer au titre et au type)'}\n\n")
    for debut in range(0, len(passages), taille_lot):
        lot = [(i, p) for i, p in enumerate(passages) if debut <= i < debut + taille_lot and p.strip()]
        if not lot:
            continue
        msg = entete + "\n".join(f"[{i}] {p[:500]}" for i, p in lot)
        d = extraire_json(_appel_llm(cfg, SYSTEME_PERTINENCE, msg, 1500))
        valides = {i for i, _ in lot}
        for n in d.get("hors_sujet", []) if isinstance(d, dict) else []:
            try:
                if int(n) in valides:
                    hors.add(int(n))
            except (TypeError, ValueError):
                pass
    return hors


# ───────────────────────── Formulaire d'édition <-> compte rendu ─────────────────────────
def vers_formulaire(cr):
    """Compte rendu -> textes éditables (une ligne par élément)."""
    return {"objet": cr["objet"], "contexte": cr["contexte"], "conclusion": cr["conclusion"], "resume_court": cr["resume_court"],
            "participants_presents": "\n".join(cr["participants_presents"]), "absents_excuses": "\n".join(cr["absents_excuses"]),
            "points": "\n".join(f"{p['titre']} : {p['resume']}" if p["resume"] else p["titre"] for p in cr["points"]),
            "difficultes": "\n".join(cr["difficultes"]), "propositions": "\n".join(cr["propositions"]), "decisions": "\n".join(cr["decisions"]),
            "actions": "\n".join(f"{a['action']} | {a['responsable']} | {a['echeance']}" for a in cr["actions"]),
            "echeances": "\n".join(cr["echeances"]), "manquants": "\n".join(cr["manquants"]), "hors_sujet": "\n".join(cr["hors_sujet"])}


def depuis_formulaire(f):
    def lignes(k):
        return [x.strip() for x in (f.get(k) or "").splitlines() if x.strip()]
    d = {k: (f.get(k) or "").strip() for k in CLES_TEXTES}
    for k in ("participants_presents", "absents_excuses", "difficultes", "propositions", "decisions", "echeances", "manquants", "hors_sujet"):
        d[k] = lignes(k)
    d["points"] = []
    for ln in lignes("points"):
        t, _, r = ln.partition(":")
        d["points"].append({"titre": t.strip(), "resume": r.strip()} if r else {"titre": ln, "resume": ""})
    d["actions"] = []
    for ln in lignes("actions"):
        p = [x.strip() for x in ln.split("|")]
        d["actions"].append({"action": p[0], "responsable": p[1] if len(p) > 1 else "", "echeance": p[2] if len(p) > 2 else ""})
    return normaliser(d)


def parse_participants(texte):
    """Une personne par ligne : « Nom, fonction » ou « Nom - fonction »."""
    out, vus = [], set()
    for ln in (texte or "").splitlines():
        ln = ln.strip()
        if not ln:
            continue
        nom, fonction = (re.split(r"\s*[,;–—]\s*|\s+-\s+", ln, maxsplit=1) + [""])[:2]
        if nom and nom.lower() not in vus:
            vus.add(nom.lower())
            out.append({"nom": nom[:80], "fonction": fonction[:80]})
    return out[:80]
