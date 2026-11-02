"""Trouve l'adresse email professionnelle d'une entreprise en lisant son propre site web
(page d'accueil, Contact, Mentions légales). Seules les adresses affichées publiquement sont retenues.

Le résultat est toujours « à vérifier » par l'humain. Aucune adresse n'est devinée ni inventée.
"""
import html as htmllib
import ipaddress
import re
import socket
from urllib.parse import urljoin, urlparse

import httpx

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}")
BAD_TLD = {"png", "jpg", "jpeg", "gif", "svg", "webp", "css", "js", "ico", "woff", "woff2", "pdf"}
BAD_DOMAINS = ("sentry", "wixpress", "example.", "exemple.", "domain.", "email.com", "votre", "yourdomain", "test.com")
BAD_LOCALS = ("noreply", "no-reply", "donotreply", "webmaster", "postmaster", "abuse", "dpo", "privacy", "rgpd",
              "root", "hostmaster", "mailer-daemon")
GENERIC = ("contact", "info", "accueil", "commercial", "agence", "direction", "garage", "atelier", "secretariat",
           "bonjour", "hello", "devis", "location", "reservation", "carrosserie", "service")
FREEMAIL = ("gmail.", "yahoo.", "hotmail.", "outlook.", "live.", "orange.", "wanadoo.", "free.", "sfr.", "laposte.", "icloud.")
LINK_HINT = re.compile(r"contact|mention|legal|propos|joindre|equipe|societe", re.I)
DEFAULT_PATHS = ("/contact", "/nous-contacter", "/mentions-legales", "/contactez-nous", "/contact/", "/mentions-legales/",
                 "/a-propos", "/qui-sommes-nous", "/contact.html", "/mentions-legales.html")
MAX_PAGES, MAX_BYTES, TIMEOUT = 7, 400_000, 8


def _is_public_host(host: str) -> bool:
    """Refuse localhost et réseaux privés (évite d'interroger le réseau interne du garage)."""
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
    return bool(infos)


def normalize_url(site: str) -> str | None:
    site = (site or "").strip()
    if not site:
        return None
    if not re.match(r"^https?://", site, re.I):
        site = "https://" + site
    p = urlparse(site)
    return site if p.scheme in ("http", "https") and p.hostname else None


def fetch(url: str) -> str:
    """Télécharge une page HTML (redirections contrôlées, taille limitée). Retourne '' en cas de problème."""
    try:
        with httpx.Client(timeout=TIMEOUT, follow_redirects=False,
                          headers={"User-Agent": "Mozilla/5.0 (compatible; GarageCRM-contact-finder)"}) as c:
            for _ in range(4):
                host = urlparse(url).hostname or ""
                if not _is_public_host(host):
                    return ""
                r = c.get(url)
                if r.status_code in (301, 302, 303, 307, 308) and r.headers.get("location"):
                    url = urljoin(url, r.headers["location"])
                    continue
                if r.status_code != 200 or "html" not in r.headers.get("content-type", "").lower() + "html":
                    return ""
                return r.text[:MAX_BYTES]
    except Exception:
        return ""
    return ""


def _decode_cfemail(hexstr: str) -> str:
    try:
        b = bytes.fromhex(hexstr)
        return bytes(x ^ b[0] for x in b[1:]).decode()
    except Exception:
        return ""


def extract_emails(page: str) -> list[str]:
    text = htmllib.unescape(page)
    text = re.sub(r"\s*[\[\(]\s*(?:at|arobase)\s*[\]\)]\s*", "@", text, flags=re.I)
    found = [_decode_cfemail(m) for m in re.findall(r'data-cfemail="([0-9a-fA-F]+)"', page)]
    found += re.findall(r"mailto:([^\"'?>\s]+)", text, flags=re.I)
    found += EMAIL_RE.findall(text)
    out, seen = [], set()
    for e in found:
        e = e.strip().strip(".,;:()<>").lower()
        if not EMAIL_RE.fullmatch(e or ""):
            continue
        local, _, domain = e.partition("@")
        if domain.rsplit(".", 1)[-1] in BAD_TLD or any(b in domain for b in BAD_DOMAINS) or any(local.startswith(b) for b in BAD_LOCALS):
            continue
        if e not in seen:
            seen.add(e)
            out.append(e)
    return out


def _score(email: str, site_host: str) -> int:
    local, _, domain = email.partition("@")
    host = (site_host or "").lower().removeprefix("www.")
    s = 0
    if host and (domain == host or domain.endswith("." + host) or host.endswith("." + domain)
                 or domain.split(".")[0] == host.split(".")[0]):
        s += 3
    if any(local.startswith(g) for g in GENERIC):
        s += 2
    if any(domain.startswith(f) for f in FREEMAIL):
        s -= 1
    return s


def candidate_pages(home_url: str, home_html: str) -> list[str]:
    host = (urlparse(home_url).hostname or "").removeprefix("www.")
    urls: list[str] = []
    for href, label in re.findall(r'<a[^>]+href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', home_html, flags=re.I | re.S):
        if LINK_HINT.search(href) or LINK_HINT.search(re.sub(r"<[^>]+>", " ", label)):
            u = urljoin(home_url, href.strip())
            h = (urlparse(u).hostname or "").removeprefix("www.")
            if urlparse(u).scheme in ("http", "https") and h == host and u not in urls:
                urls.append(u.split("#")[0])
    for p in DEFAULT_PATHS:
        u = urljoin(home_url, p)
        if u not in urls:
            urls.append(u)
    return urls[: MAX_PAGES - 1]


def find_email(website: str, fetcher=None) -> dict | None:
    """Retourne {'email', 'source'} ou None. `fetcher` permet de tester sans réseau."""
    fetcher = fetcher or fetch
    home = normalize_url(website)
    if not home:
        return None
    host = urlparse(home).hostname or ""
    home_html = fetcher(home)
    pages = {home: home_html}
    best: tuple[int, str, str] | None = None

    def consider(url: str, page: str):
        nonlocal best
        for e in extract_emails(page):
            sc = _score(e, host)
            if best is None or sc > best[0]:
                best = (sc, e, url)

    consider(home, home_html)
    if best and best[0] >= 5:           # adresse générique du même domaine : inutile d'aller plus loin
        return {"email": best[1], "source": best[2]}
    for u in candidate_pages(home, home_html):
        pages[u] = fetcher(u)
        consider(u, pages[u])
        if best and best[0] >= 5:
            break
    return {"email": best[1], "source": best[2]} if best else None
