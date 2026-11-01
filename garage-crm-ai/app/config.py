import os
from dataclasses import dataclass


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
    )
