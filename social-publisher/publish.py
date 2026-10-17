#!/usr/bin/env python3
"""Publie automatiquement les posts prêts sur Instagram et Facebook (API Graph de Meta).

Chaque dossier de `posts/` contient un `post.yml` et ses images. Un post est publié
quand `status: ready` et que sa date est passée. Le résultat est écrit dans `result.json`
(un identifiant par plateforme), ce qui empêche tout doublon en cas de relance.

Variables d'environnement :
  META_PAGE_TOKEN    jeton de Page (longue durée)
  META_PAGE_ID       identifiant de la Page Facebook
  META_IG_USER_ID    identifiant du compte Instagram professionnel
  MEDIA_BASE_URL     URL publique du dossier posts/ (pour que Meta puisse télécharger les images)
  TZ_NAME            fuseau horaire des dates (défaut : Europe/Paris)
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
import yaml

GRAPH = "https://graph.facebook.com/v21.0"
POSTS_DIR = Path(__file__).parent / "posts"
PLATFORMS = ("instagram", "facebook")
IG_EXTENSIONS = (".jpg", ".jpeg")  # Instagram n'accepte que le JPEG via l'API


class PostError(Exception):
    pass


def load_post(folder: Path) -> dict:
    with open(folder / "post.yml", encoding="utf-8") as f:
        post = yaml.safe_load(f) or {}
    for key in ("date", "platforms", "caption", "images"):
        if not post.get(key):
            raise PostError(f"champ manquant : {key}")
    unknown = set(post["platforms"]) - set(PLATFORMS)
    if unknown:
        raise PostError(f"plateforme inconnue : {', '.join(sorted(unknown))}")
    if len(post["images"]) > 10:
        raise PostError("10 images maximum par carrousel")
    for image in post["images"]:
        if not (folder / image).is_file():
            raise PostError(f"image introuvable : {image}")
        if "instagram" in post["platforms"] and not image.lower().endswith(IG_EXTENSIONS):
            raise PostError(f"{image} : Instagram exige du JPEG (.jpg) — exportez en JPG depuis Canva")
    post["when"] = parse_date(post["date"])
    return post


def parse_date(value) -> datetime:
    tz = ZoneInfo(os.environ.get("TZ_NAME", "Europe/Paris"))
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.strptime(str(value), "%Y-%m-%d %H:%M")
    return dt.replace(tzinfo=tz) if dt.tzinfo is None else dt


def graph(method: str, path: str, **params):
    params["access_token"] = os.environ["META_PAGE_TOKEN"]
    resp = requests.request(method, f"{GRAPH}/{path}", data=params if method == "POST" else None,
                            params=params if method == "GET" else None, timeout=60)
    body = resp.json()
    if resp.status_code >= 400 or "error" in body:
        err = body.get("error", {})
        raise PostError(f"Meta a refusé la requête : {err.get('message', resp.text)}")
    return body


def wait_until_ready(container_id: str):
    for _ in range(30):
        status = graph("GET", container_id, fields="status_code").get("status_code")
        if status == "FINISHED":
            return
        if status in ("ERROR", "EXPIRED"):
            raise PostError(f"Instagram n'a pas pu traiter le média (statut {status})")
        time.sleep(5)
    raise PostError("Instagram met trop de temps à traiter le média")


def publish_instagram(post: dict, urls: list[str]) -> str:
    ig = os.environ["META_IG_USER_ID"]
    if len(urls) == 1:
        container = graph("POST", f"{ig}/media", image_url=urls[0], caption=post["caption"])["id"]
    else:
        children = []
        for url in urls:
            child = graph("POST", f"{ig}/media", image_url=url, is_carousel_item="true")["id"]
            wait_until_ready(child)
            children.append(child)
        container = graph("POST", f"{ig}/media", media_type="CAROUSEL",
                          children=",".join(children), caption=post["caption"])["id"]
    wait_until_ready(container)
    return graph("POST", f"{ig}/media_publish", creation_id=container)["id"]


def publish_facebook(post: dict, urls: list[str]) -> str:
    page = os.environ["META_PAGE_ID"]
    if len(urls) == 1:
        return graph("POST", f"{page}/photos", url=urls[0], message=post["caption"])["post_id"]
    photo_ids = [graph("POST", f"{page}/photos", url=u, published="false")["id"] for u in urls]
    attached = json.dumps([{"media_fbid": pid} for pid in photo_ids])
    return graph("POST", f"{page}/feed", message=post["caption"], attached_media=attached)["id"]


PUBLISHERS = {"instagram": publish_instagram, "facebook": publish_facebook}


def process(folder: Path, now: datetime, dry_run: bool) -> bool:
    """Retourne False si une erreur s'est produite."""
    try:
        post = load_post(folder)
    except PostError as e:
        print(f"[{folder.name}] ignoré — {e}")
        return False
    if post.get("status") != "ready":
        print(f"[{folder.name}] brouillon, non publié")
        return True
    if post["when"] > now:
        print(f"[{folder.name}] prévu pour le {post['when']:%d/%m/%Y %H:%M}, pas encore l'heure")
        return True

    result_file = folder / "result.json"
    result = json.loads(result_file.read_text()) if result_file.exists() else {}
    todo = [p for p in post["platforms"] if p not in result]
    if not todo:
        return True

    base = os.environ.get("MEDIA_BASE_URL", "").rstrip("/")
    urls = [f"{base}/{folder.name}/{img}" for img in post["images"]]
    ok = True
    for platform in todo:
        if dry_run:
            print(f"[{folder.name}] (simulation) publierait sur {platform} : {len(urls)} image(s)")
            continue
        try:
            result[platform] = PUBLISHERS[platform](post, urls)
            print(f"[{folder.name}] publié sur {platform} ✔ ({result[platform]})")
        except PostError as e:
            print(f"[{folder.name}] ÉCHEC {platform} — {e}")
            ok = False
        result_file.write_text(json.dumps(result, indent=2))  # sauvegarde après chaque plateforme
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="simule sans rien publier")
    parser.add_argument("--now", help="forcer l'heure courante (AAAA-MM-JJ HH:MM), pour les tests")
    args = parser.parse_args()

    now = parse_date(args.now) if args.now else datetime.now(ZoneInfo(os.environ.get("TZ_NAME", "Europe/Paris")))
    if not args.dry_run:
        missing = [v for v in ("META_PAGE_TOKEN", "META_PAGE_ID", "META_IG_USER_ID", "MEDIA_BASE_URL")
                   if not os.environ.get(v)]
        if missing:
            print(f"Variables manquantes : {', '.join(missing)}")
            return 2

    folders = sorted(p for p in POSTS_DIR.iterdir() if p.is_dir() and not p.name.startswith("_"))
    results = [process(f, now, args.dry_run) for f in folders]
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
