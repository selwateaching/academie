import os
from datetime import date, datetime, timedelta

from flask import Flask, abort, jsonify, redirect, render_template, request, url_for

from content import LEVELS, all_lessons, get_lesson, get_level_for_lesson, lesson_max_stars
from models import AVATARS, LessonProgress, Student, db

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "speakia-dev-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "speakia.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()


# ──────────────────────────────────────────────────────────────────────────
# Aides
# ──────────────────────────────────────────────────────────────────────────
def _get_student_or_404(student_id):
    student = db.session.get(Student, student_id)
    if not student:
        abort(404)
    return student


def _is_level_unlocked(student, level_number):
    return level_number <= student.unlocked_level


def _maybe_unlock_next_level(student, lesson):
    """Débloque le niveau suivant si toutes les leçons du niveau courant ont au
    moins 1 étoile."""
    level = get_level_for_lesson(lesson["id"])
    if not level:
        return
    lesson_ids = [l["id"] for l in level["lessons"]]
    all_done = all(student.stars_for(lid) > 0 for lid in lesson_ids)
    if all_done and student.unlocked_level == level["level"]:
        student.unlocked_level = level["level"] + 1


def _update_streak(student):
    today = date.today()
    if student.streak > 0 and student.last_active == today:
        return
    if student.streak > 0 and student.last_active == today - timedelta(days=1):
        student.streak += 1
    else:
        student.streak = 1
    student.last_active = today


# ──────────────────────────────────────────────────────────────────────────
# Routes : accueil / profils
# ──────────────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    students = Student.query.order_by(Student.created_at.asc()).all()
    return render_template("home.html", students=students, avatars=AVATARS)


@app.route("/profiles", methods=["POST"])
def create_profile():
    name = (request.form.get("name") or "").strip()
    avatar = request.form.get("avatar") or AVATARS[0]
    if not name:
        return redirect(url_for("home"))
    if avatar not in AVATARS:
        avatar = AVATARS[0]
    student = Student(name=name[:60], avatar=avatar, unlocked_level=1)
    db.session.add(student)
    db.session.commit()
    return redirect(url_for("world", student_id=student.id))


@app.route("/profiles/<int:student_id>/delete", methods=["POST"])
def delete_profile(student_id):
    student = _get_student_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return redirect(url_for("home"))


# ──────────────────────────────────────────────────────────────────────────
# Routes : carte du monde (choix du niveau / de la leçon)
# ──────────────────────────────────────────────────────────────────────────
@app.route("/world/<int:student_id>")
def world(student_id):
    student = _get_student_or_404(student_id)
    levels_view = []
    for level in LEVELS:
        lessons_view = []
        for lesson in level["lessons"]:
            lessons_view.append(
                {
                    "lesson": lesson,
                    "stars": student.stars_for(lesson["id"]),
                    "max_stars": lesson_max_stars(lesson),
                    "completed": student.stars_for(lesson["id"]) > 0,
                }
            )
        levels_view.append(
            {
                "level": level,
                "lessons": lessons_view,
                "unlocked": _is_level_unlocked(student, level["level"]),
            }
        )
    return render_template("world.html", student=student, levels_view=levels_view)


# ──────────────────────────────────────────────────────────────────────────
# Routes : leçon interactive
# ──────────────────────────────────────────────────────────────────────────
@app.route("/lesson/<int:student_id>/<lesson_id>")
def lesson(student_id, lesson_id):
    student = _get_student_or_404(student_id)
    lesson_data = get_lesson(lesson_id)
    if not lesson_data:
        abort(404)
    level = get_level_for_lesson(lesson_id)
    if not _is_level_unlocked(student, level["level"]):
        return redirect(url_for("world", student_id=student.id))
    return render_template(
        "lesson.html",
        student=student,
        lesson=lesson_data,
        level=level,
        max_stars=lesson_max_stars(lesson_data),
    )


@app.route("/api/lesson/<int:student_id>/<lesson_id>/complete", methods=["POST"])
def complete_lesson(student_id, lesson_id):
    student = _get_student_or_404(student_id)
    lesson_data = get_lesson(lesson_id)
    if not lesson_data:
        abort(404)

    payload = request.get_json(silent=True) or {}
    correct = int(payload.get("correct", 0))
    total = int(payload.get("total", lesson_max_stars(lesson_data)) or 1)
    pct = max(0, min(100, round((correct / total) * 100))) if total else 0

    if pct >= 90:
        stars = 3
    elif pct >= 70:
        stars = 2
    elif pct >= 1:
        stars = 1
    else:
        stars = 0
    stars = max(stars, 1)  # toute leçon terminée rapporte au moins une étoile

    progress = student.progress_for(lesson_id)
    previous_stars = progress.stars if progress else 0
    if not progress:
        progress = LessonProgress(lesson_id=lesson_id, stars=0, attempts=0, best_score_pct=0)
        student.progress.append(progress)  # garde la relation en mémoire à jour (pas juste student_id)

    progress.attempts += 1
    progress.stars = max(progress.stars, stars)
    progress.best_score_pct = max(progress.best_score_pct, pct)
    progress.completed_at = datetime.utcnow()

    student.total_stars += max(0, progress.stars - previous_stars)
    _update_streak(student)
    _maybe_unlock_next_level(student, lesson_data)

    db.session.commit()

    level = get_level_for_lesson(lesson_id)
    next_level_unlocked = student.unlocked_level > level["level"]

    return jsonify(
        {
            "stars": progress.stars,
            "score_pct": pct,
            "total_stars": student.total_stars,
            "streak": student.streak,
            "level_unlocked": next_level_unlocked,
            "unlocked_level": student.unlocked_level,
        }
    )


# ──────────────────────────────────────────────────────────────────────────
# Routes : espace parent
# ──────────────────────────────────────────────────────────────────────────
@app.route("/parent/<int:student_id>")
def parent(student_id):
    student = _get_student_or_404(student_id)
    rows = []
    for level in LEVELS:
        for lesson_data in level["lessons"]:
            progress = student.progress_for(lesson_data["id"])
            rows.append(
                {
                    "level": level["level"],
                    "title_fr": lesson_data["title_fr"],
                    "icon": lesson_data["icon"],
                    "stars": progress.stars if progress else 0,
                    "attempts": progress.attempts if progress else 0,
                    "best_score_pct": progress.best_score_pct if progress else 0,
                    "completed_at": progress.completed_at if progress else None,
                }
            )
    lessons_completed = sum(1 for r in rows if r["stars"] > 0)
    return render_template(
        "parent.html",
        student=student,
        rows=rows,
        lessons_completed=lessons_completed,
        total_lessons=len(rows),
    )


if __name__ == "__main__":
    app.run(debug=True, port=5050)
