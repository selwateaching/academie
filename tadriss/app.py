import html
import json
import os
import re
from datetime import datetime
from functools import wraps
from pathlib import Path

from dotenv import load_dotenv
from flask import (
    Flask,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    url_for,
)
from flask_login import LoginManager, current_user, login_required, login_user, logout_user

from ai import generate_document
from models import DEFAULT_STATE, SUBSCRIPTION_DAYS, TRIAL_DAYS, User, UserState, db

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", f"sqlite:///{BASE_DIR / 'tadriss.db'}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["BANK_HOLDER"] = os.environ.get("BANK_HOLDER", "")
app.config["BANK_NAME"] = os.environ.get("BANK_NAME", "")
app.config["BANK_RIB"] = os.environ.get("BANK_RIB", "")

db.init_app(app)

login_manager = LoginManager(app)
login_manager.login_view = "login"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").strip().lower()


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403)
        return fn(*args, **kwargs)

    return wrapper


def subscriber_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user.is_active_subscriber:
            abort(403)
        return fn(*args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        name = request.form.get("name", "").strip()
        if not email or "@" not in email or len(password) < 6:
            return render_template(
                "signup.html",
                error="Email valide et mot de passe d'au moins 6 caractères requis.",
            )
        if User.query.filter_by(email=email).first():
            return render_template(
                "signup.html", error="Un compte existe déjà avec cet email."
            )
        user = User(email=email, name=name, is_admin=(email == ADMIN_EMAIL))
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        db.session.add(
            UserState(user_id=user.id, data=json.dumps(DEFAULT_STATE, ensure_ascii=False))
        )
        db.session.commit()
        login_user(user)
        return redirect(url_for("index"))
    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user, remember=True)
            return redirect(url_for("index"))
        return render_template("login.html", error="Email ou mot de passe incorrect.")
    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


@app.route("/billing")
@login_required
def billing():
    return render_template("billing.html", user=current_user)


# ---------------------------------------------------------------------------
# App shell
# ---------------------------------------------------------------------------


@app.route("/")
@login_required
def index():
    if not current_user.is_active_subscriber:
        return redirect(url_for("billing"))
    return render_template("index.html", user=current_user)


# ---------------------------------------------------------------------------
# API : état de l'abonné (remplace le localStorage du navigateur)
# ---------------------------------------------------------------------------


@app.route("/api/state", methods=["GET"])
@login_required
def get_state():
    state = current_user.state
    if not state:
        return jsonify(DEFAULT_STATE)
    try:
        return jsonify(json.loads(state.data))
    except (TypeError, ValueError):
        return jsonify(DEFAULT_STATE)


@app.route("/api/state", methods=["POST"])
@login_required
@subscriber_required
def save_state():
    payload = request.get_json(force=True, silent=True)
    if not isinstance(payload, dict):
        abort(400)
    state = current_user.state
    if not state:
        state = UserState(user_id=current_user.id)
        db.session.add(state)
    state.data = json.dumps(payload, ensure_ascii=False)
    state.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# API : génération IA
# ---------------------------------------------------------------------------


@app.route("/api/ai/generate", methods=["POST"])
@login_required
@subscriber_required
def api_ai_generate():
    payload = request.get_json(force=True, silent=True) or {}
    document = generate_document(
        payload.get("type", "sheet"),
        payload.get("level", ""),
        payload.get("subject", ""),
        payload.get("lang", "auto"),
        payload.get("prompt", ""),
    )
    return jsonify({"ok": True, "document": document})


# ---------------------------------------------------------------------------
# Export PDF / Word / HTML (par abonné)
# ---------------------------------------------------------------------------


def safe_name(s):
    s = re.sub(r"[^\w\-]+", "_", s or "", flags=re.UNICODE).strip("_")[:70]
    return s or "tadriss_document"


def make_html_doc(c):
    rtl = bool(c.get("rtl", False))
    direction = "rtl" if rtl else "ltr"
    lang = "ar" if rtl else "fr"
    sections = "".join(
        f"<section><h2>{html.escape(a)}</h2><p>{html.escape(b)}</p></section>"
        for a, b in c.get("sections", [])
    )
    title = html.escape(c.get("title", "Document pédagogique"))
    meta = html.escape(c.get("meta", ""))
    prompt_text = html.escape(c.get("prompt", ""))
    return f"""<!doctype html><html lang="{lang}" dir="{direction}"><head><meta charset="utf-8">
<title>{html.escape(c.get("title", "TADRISS"))}</title>
<style>@page{{size:A4;margin:18mm}}body{{font-family:"DejaVu Sans",Arial,sans-serif;color:#17203f;
line-height:1.7;font-size:11pt}}h1{{font-size:25pt;color:#101b4d;margin-bottom:4pt}}
.meta{{color:#75809d}}h2{{font-size:15pt;color:#101b4d;border-bottom:2px solid #ff8351;
padding-bottom:5pt;margin-top:20pt}}.rtl{{direction:rtl;text-align:right}}</style></head>
<body class="{'rtl' if rtl else ''}"><h1>{title}</h1><p class="meta">{meta}</p>
<p>{prompt_text}</p>{sections}<hr><small>Généré par TADRISS</small></body></html>"""


def make_docx_doc(c, path):
    from docx import Document
    from docx.shared import Pt

    d = Document()
    sec = d.sections[0]
    sec.top_margin = sec.bottom_margin = Pt(45)
    sec.left_margin = sec.right_margin = Pt(45)
    d.add_heading(c.get("title", "Document pédagogique"), 0)
    d.add_paragraph(c.get("meta", ""))
    d.add_paragraph(c.get("prompt", ""))
    for a, b in c.get("sections", []):
        d.add_heading(a, 1)
        d.add_paragraph(b)
    d.add_paragraph("Généré par TADRISS")
    d.save(path)


@app.route("/api/generate", methods=["POST"])
@login_required
@subscriber_required
def api_generate():
    c = request.get_json(force=True, silent=True) or {}
    user_dir = GENERATED_DIR / str(current_user.id)
    user_dir.mkdir(exist_ok=True)
    stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    base = safe_name(c.get("title", "document")) + "_" + stamp
    html_path = user_dir / f"{base}.html"
    pdf_path = user_dir / f"{base}.pdf"
    docx_path = user_dir / f"{base}.docx"
    try:
        from weasyprint import HTML

        html_content = make_html_doc(c)
        html_path.write_text(html_content, encoding="utf-8")
        HTML(string=html_content, base_url=str(BASE_DIR)).write_pdf(str(pdf_path))
        make_docx_doc(c, str(docx_path))
    except Exception as exc:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(exc)}), 500
    return jsonify(
        {
            "ok": True,
            "files": {
                "html": url_for(
                    "generated_file", user_id=current_user.id, filename=html_path.name
                ),
                "pdf": url_for(
                    "generated_file", user_id=current_user.id, filename=pdf_path.name
                ),
                "docx": url_for(
                    "generated_file", user_id=current_user.id, filename=docx_path.name
                ),
            },
        }
    )


@app.route("/generated/<int:user_id>/<path:filename>")
@login_required
def generated_file(user_id, filename):
    if current_user.id != user_id and not current_user.is_admin:
        abort(403)
    return send_from_directory(GENERATED_DIR / str(user_id), filename)


# ---------------------------------------------------------------------------
# Admin : suivi des abonnés et paiements par virement
# ---------------------------------------------------------------------------


@app.route("/admin")
@login_required
@admin_required
def admin_panel():
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template("admin.html", users=users, now=datetime.utcnow())


@app.route("/admin/mark_paid/<int:user_id>", methods=["POST"])
@login_required
@admin_required
def admin_mark_paid(user_id):
    user = User.query.get_or_404(user_id)
    days = int(request.form.get("days", SUBSCRIPTION_DAYS))
    user.mark_paid(days=days)
    db.session.commit()
    return redirect(url_for("admin_panel"))


@app.context_processor
def inject_globals():
    return {"trial_days": TRIAL_DAYS}


with app.app_context():
    db.create_all()
    if ADMIN_EMAIL:
        admin_user = User.query.filter_by(email=ADMIN_EMAIL).first()
        if admin_user and not admin_user.is_admin:
            admin_user.is_admin = True
            db.session.commit()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        debug=bool(os.environ.get("FLASK_DEBUG")),
    )
