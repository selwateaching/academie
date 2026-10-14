const express = require('express');
const { pool } = require('../db');
const { requireProfessor } = require('../auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

function publicCourse(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    promo: row.promo,
    content_html: row.content_html,
    created_at: row.created_at,
  };
}

router.get('/', requireProfessor, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM published_courses WHERE professor_id = $1 ORDER BY created_at DESC',
    [req.professorId]
  );
  res.json({ courses: result.rows.map(publicCourse) });
}));

router.post('/', requireProfessor, asyncHandler(async (req, res) => {
  const { title, subject, promo, content_html } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'Titre requis' });
  if (!content_html || !content_html.trim()) return res.status(400).json({ error: 'Contenu vide' });
  if (content_html.length > 200_000) return res.status(400).json({ error: 'Contenu trop volumineux' });
  const result = await pool.query(
    `INSERT INTO published_courses (professor_id, title, subject, promo, content_html)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.professorId, title.trim(), (subject || '').trim(), (promo || '').trim(), content_html]
  );
  res.status(201).json({ course: publicCourse(result.rows[0]) });
}));

router.delete('/:id', requireProfessor, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });
  const result = await pool.query(
    'DELETE FROM published_courses WHERE id = $1 AND professor_id = $2 RETURNING id',
    [id, req.professorId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Cours introuvable' });
  res.json({ ok: true });
}));

module.exports = router;
