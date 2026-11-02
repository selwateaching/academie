"""Réponses des prospects : lecture de la boîte mail (IMAP), détection des STOP et refus, archivage.

- STOP / désinscription : opposition enregistrée, prospect archivé, messages en attente annulés,
  un message de confirmation (sans contenu commercial) est envoyé une seule fois.
- Refus (« pas intéressé ») : statut « Refusé », plus de relance.
- Autre réponse : statut « A répondu » -> plus de relance, un humain reprend la main.
- Réponses automatiques (absence…) : ignorées.
"""
import email
import imaplib
import logging
import re
from datetime import datetime, timedelta, timezone
from email.header import decode_header, make_header
from email.utils import parseaddr

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .agent import mailer, writer
from .config import get_settings

log = logging.getLogger("garage.replies")
FREEMAIL = ("gmail.", "yahoo.", "hotmail.", "outlook.", "live.", "orange.", "wanadoo.", "free.", "sfr.", "laposte.", "icloud.", "msn.")

STOP_RE = re.compile(
    r"\b(stop|unsubscribe|d[ée]sinscri\w*|d[ée]sabonn\w*|"
    r"ne\s+(?:plus\s+)?(?:me|nous|m'|n')\s*(?:contacter|envoyer|solliciter|[ée]crire|appeler|relancer)|"
    r"plus\s+(?:me|nous)\s+(?:contacter|solliciter|envoyer|[ée]crire|appeler)|"
    r"ne\s+(?:souhaite|souhaitons|veux|voulons)\w*\s+plus|"
    r"(?:retirer|supprimer|enlever|radier)\w*\s+(?:moi|mon|ma|mes|notre|nos|nous)|"
    r"arr[êe]t\w*\s+(?:de\s+(?:m'|nous)|vos\s+(?:envois|mails|emails|messages)))", re.I)
REFUS_RE = re.compile(
    r"(?:pas|non)\s+(?:du\s+tout\s+)?int[ée]ress\w+|ne\s+(?:nous|m')\s*int[ée]resse|aucun\s+besoin|pas\s+de\s+besoin|"
    r"non\s+merci|ne\s+donn\w+\s+pas\s+suite|sans\s+suite", re.I)
AUTO_RE = re.compile(r"r[ée]ponse\s+automatique|absence|out\s+of\s+office|automatic\s+reply|auto-?reply|"
                     r"en\s+cong[ée]s?|accus[ée]\s+de\s+r[ée]ception", re.I)


def classify(subject: str, body: str, auto_header: bool = False) -> str:
    if auto_header or AUTO_RE.search(subject or ""):
        return "auto"
    if STOP_RE.search(body or "") or re.fullmatch(r"\W*stop\W*", subject or "", re.I):
        return "stop"
    if REFUS_RE.search(body or ""):
        return "refus"
    return "reponse"


def clean_body(text: str, limit: int = 700) -> str:
    """Garde seulement ce que le prospect a écrit (sans le message cité)."""
    lines = []
    for line in (text or "").replace("\r", "").split("\n"):
        if line.lstrip().startswith(">") or re.match(r"^\s*(le .{5,80} a [ée]crit\s*:|on .{5,80} wrote\s*:|-{2,}\s*(original|message))", line, re.I):
            break
        lines.append(line)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()[:limit]


# ---------- Traitement ----------
def _note(c: models.Company, text: str):
    c.notes = (c.notes + "\n" if c.notes else "") + text


def handle_stop(db: Session, c: models.Company, send=None, reason: str = "") -> dict:
    """Opposition + archivage + annulation des messages en attente + confirmation envoyée une fois."""
    now = datetime.now(timezone.utc)
    c.do_not_contact, c.status = True, "archive"
    c.next_action = ""
    _note(c, f"Opposition à la prospection le {now:%d/%m/%Y}" + (f" – {reason}" if reason else "") + " – archivé")
    for m in c.messages:
        if m.status in ("brouillon", "valide") and m.kind != "confirmation_stop":
            m.status = "rejete"
    confirmation = next((m for m in c.messages if m.kind == "confirmation_stop"), None)
    sent = False
    if c.email and confirmation is None:
        subject, body = writer.confirmation_stop(c)
        confirmation = models.Message(company_id=c.id, kind="confirmation_stop", subject=subject, body=body,
                                      status="valide", approved_by="automatique")
        db.add(confirmation)
        send = send or (mailer.send_email if mailer.smtp_configured() else None)
        if send:
            try:
                send(c.email, subject, body)
                confirmation.status, confirmation.sent_at, sent = "envoye", now, True
            except Exception as e:                      # reste « validé » : à envoyer à la main
                log.warning("Confirmation STOP non envoyée à %s : %s", c.email, e)
    db.commit()
    return {"archived": True, "confirmation": "envoyée" if sent else ("à envoyer à la main" if confirmation else "aucune adresse email")}


def _event(db: Session, mid: str) -> bool:
    return db.scalar(select(models.InboxEvent.id).where(models.InboxEvent.message_id == mid)) is not None


def process_reply(db: Session, item: dict, by_email: dict, by_domain: dict, send=None) -> str | None:
    """Traite une réponse. Retourne le type traité, ou None si ignorée (inconnu / déjà vue)."""
    mid = item["message_id"]
    addr = item["from"].lower()
    c = by_email.get(addr) or by_domain.get(addr.rpartition("@")[2])
    if not c or _event(db, mid):
        return None
    kind = classify(item["subject"], item["body"], item.get("auto", False))
    summary = item["body"][:250].replace("\n", " ")
    if kind == "stop":
        handle_stop(db, c, send, reason=f"réponse reçue : « {summary[:120]} »")
    elif kind == "refus":
        c.status = "refuse"
        _note(c, f"Refus reçu le {datetime.now(timezone.utc):%d/%m/%Y} : « {summary[:150]} »")
    elif kind == "reponse":
        if c.status in ("a_contacter", "contacte"):
            c.status = "repondu"
        _note(c, f"Réponse reçue le {datetime.now(timezone.utc):%d/%m/%Y} : « {summary[:200]} »")
    db.add(models.InboxEvent(message_id=mid, company_id=c.id, kind=kind, summary=summary[:290]))
    db.commit()
    return kind


# ---------- Lecture de la boîte mail ----------
def imap_settings() -> tuple[str, int, str, str] | None:
    s = get_settings()
    if not (s.imap_host and s.smtp_user and s.smtp_password):
        return None
    return s.imap_host, 993, s.smtp_user, s.smtp_password


def _text_of(msg: email.message.Message) -> str:
    parts = [msg] if not msg.is_multipart() else list(msg.walk())
    for want in ("text/plain", "text/html"):
        for p in parts:
            if p.get_content_type() == want and not p.get_filename():
                raw = p.get_payload(decode=True) or b""
                txt = raw.decode(p.get_content_charset() or "utf-8", errors="replace")
                return txt if want == "text/plain" else re.sub(r"<[^>]+>", " ", txt)
    return ""


def fetch_replies(emails: set[str], domains: set[str], days: int = 14) -> list[dict]:
    """Lit la boîte de réception (lecture seule) et retourne les messages reçus de nos prospects."""
    cfg = imap_settings()
    if not cfg:
        return []
    host, port, user, pw = cfg
    out = []
    M = imaplib.IMAP4_SSL(host, port, timeout=30)
    try:
        M.login(user, pw)
        M.select("INBOX", readonly=True)
        since = (datetime.now() - timedelta(days=days)).strftime("%d-%b-%Y")
        _, data = M.search(None, "SINCE", since)
        for num in data[0].split()[-400:]:
            _, d = M.fetch(num, "(BODY.PEEK[HEADER.FIELDS (FROM)])")
            addr = parseaddr(email.message_from_bytes(d[0][1]).get("From", ""))[1].lower()
            if addr not in emails and addr.rpartition("@")[2] not in domains:
                continue
            _, d = M.fetch(num, "(BODY.PEEK[])")
            msg = email.message_from_bytes(d[0][1])
            subject = str(make_header(decode_header(msg.get("Subject", ""))))
            auto = (msg.get("Auto-Submitted", "no").lower() != "no" or bool(msg.get("X-Autoreply"))
                    or msg.get("Precedence", "").lower() in ("bulk", "auto_reply", "junk"))
            out.append({"message_id": (msg.get("Message-ID") or f"{addr}|{subject}|{msg.get('Date')}").strip(),
                        "from": addr, "subject": subject, "auto": auto, "body": clean_body(_text_of(msg))})
    finally:
        try:
            M.logout()
        except Exception:
            pass
    return out


def check_inbox(db: Session, fetch=None, send=None) -> dict:
    """Lit les réponses et applique les règles. `fetch` permet de tester sans boîte mail."""
    if fetch is None and not imap_settings():
        return {"configured": False, "processed": {}}
    companies = list(db.scalars(select(models.Company).where(models.Company.email != "", models.Company.status != "archive")))
    by_email = {c.email.lower(): c for c in companies}
    doms: dict[str, list] = {}
    for c in companies:
        d = c.email.lower().rpartition("@")[2]
        if not d.startswith(FREEMAIL):
            doms.setdefault(d, []).append(c)
    by_domain = {d: cs[0] for d, cs in doms.items() if len(cs) == 1}
    try:
        items = (fetch or fetch_replies)(set(by_email), set(by_domain))
    except Exception as e:
        log.warning("Lecture de la boîte mail impossible : %s", e)
        return {"configured": True, "error": f"{type(e).__name__}: {e}"[:200], "processed": {}}
    counts: dict[str, int] = {}
    for it in items:
        k = process_reply(db, it, by_email, by_domain, send)
        if k:
            counts[k] = counts.get(k, 0) + 1
    return {"configured": True, "processed": counts}
