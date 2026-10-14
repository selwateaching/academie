const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { signProfessorToken, requireProfessor } = require('../auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicProfessor(row) {
  return {
    id: row.id,
    email: row.email,
    nom_complet: row.nom_complet,
    etablissement: row.etablissement,
    logo_base64: row.logo_base64,
    specialty: row.specialty,
    is_active: row.is_active,
    payment_status: row.payment_status
  };
}

router.post('/register', async (req, res) => {
  const { email, password, nom_complet, etablissement, specialty } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email invalide' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' });
  if (!nom_complet || !nom_complet.trim()) return res.status(400).json({ error: 'Nom complet requis' });

  const password_hash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      `INSERT INTO professors (email, password_hash, nom_complet, etablissement, specialty)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.toLowerCase().trim(), password_hash, nom_complet.trim(), (etablissement || '').trim(), (specialty || '').trim()]
    );
    res.status(201).json({
      professor: publicProfessor(result.rows[0]),
      message: 'Inscription reçue. Votre compte sera activé après validation du paiement par l\'administrateur.'
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cet email est déjà inscrit' });
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const result = await pool.query('SELECT * FROM professors WHERE email = $1', [email.toLowerCase().trim()]);
  const professor = result.rows[0];
  if (!professor) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, professor.password_hash);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  if (!professor.is_active) {
    return res.status(403).json({ error: 'Compte en attente d\'activation. Contactez l\'administrateur après paiement.' });
  }

  const token = signProfessorToken(professor);
  res.json({ token, professor: publicProfessor(professor) });
});

router.get('/me', requireProfessor, async (req, res) => {
  const result = await pool.query('SELECT * FROM professors WHERE id = $1', [req.professorId]);
  const professor = result.rows[0];
  if (!professor) return res.status(404).json({ error: 'Professeur introuvable' });
  res.json({ professor: publicProfessor(professor) });
});

router.put('/me', requireProfessor, async (req, res) => {
  const { etablissement, logo_base64 } = req.body || {};
  if (logo_base64 && logo_base64.length > 2_000_000) {
    return res.status(400).json({ error: 'Logo trop volumineux' });
  }
  const result = await pool.query(
    `UPDATE professors SET
       etablissement = COALESCE($1, etablissement),
       logo_base64 = COALESCE($2, logo_base64)
     WHERE id = $3 RETURNING *`,
    [etablissement ?? null, logo_base64 ?? null, req.professorId]
  );
  res.json({ professor: publicProfessor(result.rows[0]) });
});

module.exports = router;
