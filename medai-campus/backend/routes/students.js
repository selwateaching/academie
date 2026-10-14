const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { requireProfessor } = require('../auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

async function generateUniqueAccessCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(crypto.randomInt(100000, 1000000));
    const existing = await pool.query('SELECT id FROM students WHERE access_code = $1', [code]);
    if (!existing.rows.length) return code;
  }
  throw new Error('Impossible de générer un code unique');
}

function publicStudent(row) {
  return {
    id: row.id,
    access_code: row.access_code,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    promo: row.promo,
    moyenne: row.moyenne,
    statut: row.statut,
  };
}

router.get('/', requireProfessor, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM students WHERE professor_id = $1 ORDER BY created_at DESC',
    [req.professorId]
  );
  res.json({ students: result.rows.map(publicStudent) });
}));

router.post('/', requireProfessor, asyncHandler(async (req, res) => {
  const { nom, prenom, email, promo } = req.body || {};
  if (!nom || !nom.trim()) return res.status(400).json({ error: 'Nom requis' });
  const code = await generateUniqueAccessCode();
  const result = await pool.query(
    `INSERT INTO students (professor_id, access_code, nom, prenom, email, promo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.professorId, code, nom.trim(), (prenom || '').trim(), (email || '').trim(), (promo || '').trim()]
  );
  res.status(201).json({ student: publicStudent(result.rows[0]) });
}));

router.post('/import', requireProfessor, asyncHandler(async (req, res) => {
  const { students } = req.body || {};
  if (!Array.isArray(students) || !students.length) return res.status(400).json({ error: 'Liste vide' });
  const created = [];
  for (const s of students.slice(0, 500)) {
    if (!s || !s.nom || !String(s.nom).trim()) continue;
    const code = await generateUniqueAccessCode();
    const result = await pool.query(
      `INSERT INTO students (professor_id, access_code, nom, prenom, email, promo, moyenne, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.professorId, code,
        String(s.nom).trim(), String(s.prenom || '').trim(), String(s.email || '').trim(), String(s.promo || '').trim(),
        String(s.moyenne || '—'), String(s.statut || 'En cours'),
      ]
    );
    created.push(publicStudent(result.rows[0]));
  }
  res.status(201).json({ students: created });
}));

const loadOwnStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });
  const result = await pool.query('SELECT * FROM students WHERE id = $1 AND professor_id = $2', [id, req.professorId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Étudiant introuvable' });
  req.student = result.rows[0];
  next();
});

router.put('/:id', requireProfessor, loadOwnStudent, asyncHandler(async (req, res) => {
  const { nom, prenom, email, promo, moyenne, statut } = req.body || {};
  const result = await pool.query(
    `UPDATE students SET
       nom = COALESCE($1, nom), prenom = COALESCE($2, prenom), email = COALESCE($3, email),
       promo = COALESCE($4, promo), moyenne = COALESCE($5, moyenne), statut = COALESCE($6, statut)
     WHERE id = $7 RETURNING *`,
    [nom ?? null, prenom ?? null, email ?? null, promo ?? null, moyenne ?? null, statut ?? null, req.student.id]
  );
  res.json({ student: publicStudent(result.rows[0]) });
}));

router.delete('/:id', requireProfessor, loadOwnStudent, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM students WHERE id = $1', [req.student.id]);
  res.json({ ok: true });
}));

router.post('/:id/results', requireProfessor, loadOwnStudent, asyncHandler(async (req, res) => {
  const { exam_title, note, total, mention, appreciation, commentaire, result_date } = req.body || {};
  if (note === undefined || note === null || isNaN(Number(note))) {
    return res.status(400).json({ error: 'Note invalide' });
  }
  const result = await pool.query(
    `INSERT INTO student_results (professor_id, student_id, exam_title, note, total, mention, appreciation, commentaire, result_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      req.professorId, req.student.id,
      (exam_title || '').trim(), Number(note), Number(total) || 20,
      (mention || '').trim(), (appreciation || '').trim(), (commentaire || '').trim(),
      (result_date || '').trim(),
    ]
  );
  res.status(201).json({ result: result.rows[0] });
}));

module.exports = router;
