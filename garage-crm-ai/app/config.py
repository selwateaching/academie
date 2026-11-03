import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv() -> None:
    """Charge le fichier .env (à la racine du projet) sans écraser les variables déjà définies."""
    path = Path(__file__).resolve().parent.parent / ".env"
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv()


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


@dataclass
class Settings:
    secret_key: str = ""
    database_url: str = ""
    admin_email: str = ""
    admin_password: str = ""
    garage_name: str = ""
    garage_city: str = ""
    garage_phone: str = ""
    garage_services: str = ""
    openai_api_key: str = ""
    openai_model: str = ""
    places_api_key: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    relance_days: int = 5
    imap_host: str = ""
    review_note: str = ""
    review_count: str = ""
    review_url: str = ""
    max_no_answer: int = 3
    sans_suite_days: int = 7
    report_email: str = ""


def get_settings() -> Settings:
    """Lit l'environnement à chaque appel (pratique pour les tests)."""
    return Settings(
        secret_key=_env("SECRET_KEY", "dev-secret-change-me"),
        database_url=_env("DATABASE_URL", "sqlite:///./garage.db"),
        admin_email=_env("ADMIN_EMAIL", "admin@garage.local"),
        admin_password=_env("ADMIN_PASSWORD", ""),
        garage_name=_env("GARAGE_NAME", "Notre garage"),
        garage_city=_env("GARAGE_CITY", ""),
        garage_phone=_env("GARAGE_PHONE", ""),
        garage_services=_env("GARAGE_SERVICES", "carrosserie, peinture, mécanique, entretien"),
        openai_api_key=_env("OPENAI_API_KEY"),
        openai_model=_env("OPENAI_MODEL", "gpt-4o-mini"),
        places_api_key=_env("GOOGLE_PLACES_API_KEY"),
        smtp_host=_env("SMTP_HOST"),
        smtp_port=int(_env("SMTP_PORT", "587") or 587),
        smtp_user=_env("SMTP_USER"),
        smtp_password=_env("SMTP_PASSWORD"),
        smtp_from=_env("SMTP_FROM"),
        relance_days=int(_env("RELANCE_DAYS", "5") or 5),
        max_no_answer=int(_env("MAX_NO_ANSWER", "3") or 3),
        sans_suite_days=int(_env("SANS_SUITE_DAYS", "7") or 7),
        report_email=_env("REPORT_EMAIL").strip(),
        review_note=_env("GARAGE_REVIEW_NOTE").strip(),
        review_count=_env("GARAGE_REVIEW_COUNT").strip(),
        review_url=_env("GARAGE_REVIEW_URL").strip(),
        imap_host=_env("IMAP_HOST") or (_env("SMTP_HOST").replace("smtp.", "imap.", 1) if _env("SMTP_HOST") else ""),
    )
