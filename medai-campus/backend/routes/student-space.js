const express = require('express');
const { pool } = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const CODE_RE = /^\d{6}$/;

router.get('/:code', asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Code invalide' });

  const studentResult = await pool.query('SELECT * FROM students WHERE access_code = $1', [code]);
  const student = studentResult.rows[0];
  if (!student) return res.status(404).json({ error: 'Code introuvable' });

  const [resultsResult, coursesResult, professorResult] = await Promise.all([
    pool.query(
      'SELECT exam_title, note, total, mention, appreciation, commentaire, result_date, created_at FROM student_results WHERE student_id = $1 ORDER BY created_at DESC',
      [student.id]
    ),
    pool.query(
      'SELECT id, title, subject, promo, content_html, created_at FROM published_courses WHERE professor_id = $1 AND promo = $2 ORDER BY created_at DESC',
      [student.professor_id, student.promo]
    ),
    pool.query('SELECT nom_complet, etablissement, logo_base64 FROM professors WHERE id = $1', [student.professor_id]),
  ]);

  res.json({
    student: { nom: student.nom, prenom: student.prenom, promo: student.promo },
    professor: professorResult.rows[0] || null,
    results: resultsResult.rows,
    courses: coursesResult.rows,
  });
}));

module.exports = router;
