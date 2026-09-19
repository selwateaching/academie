from datetime import date, datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

AVATARS = ["🦊", "🐼", "🦁", "🐨", "🐸", "🦄", "🐵", "🐯"]


class Student(db.Model):
    __tablename__ = "student"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), nullable=False)
    avatar = db.Column(db.String(8), default="🦊", nullable=False)
    unlocked_level = db.Column(db.Integer, default=1, nullable=False)
    total_stars = db.Column(db.Integer, default=0, nullable=False)
    streak = db.Column(db.Integer, default=0, nullable=False)
    last_active = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    progress = db.relationship(
        "LessonProgress", backref="student", lazy=True, cascade="all, delete-orphan"
    )

    def progress_for(self, lesson_id):
        for p in self.progress:
            if p.lesson_id == lesson_id:
                return p
        return None

    def stars_for(self, lesson_id):
        p = self.progress_for(lesson_id)
        return p.stars if p else 0


class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    lesson_id = db.Column(db.String(60), nullable=False)
    stars = db.Column(db.Integer, default=0, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    best_score_pct = db.Column(db.Integer, default=0, nullable=False)
    completed_at = db.Column(db.DateTime)

    __table_args__ = (db.UniqueConstraint("student_id", "lesson_id", name="uq_student_lesson"),)
