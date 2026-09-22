import os


def _database_uri():
    url = os.environ.get("DATABASE_URL", "sqlite:///carrosserie.db")
    # Render (et Heroku) fournissent des URL Postgres préfixées "postgres://",
    # que SQLAlchemy 1.4+ n'accepte plus : il faut "postgresql://".
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = True
