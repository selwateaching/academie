const express = require('express');
const { pool } = require('../db');
const { signAdminToken, requireAdmin } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  res.json({ token: signAdminToken() });
});

router.get('/professors', requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, email, nom_complet, etablissement, logo_base64, specialty,
            is_active, payment_status, payment_date, payment_notes, created_at
     FROM professors ORDER BY created_at DESC`
  );
  res.json({ professors: result.rows });
});

router.put('/professors/:id', requireAdmin, async (req, res) => {
  const { is_active, payment_status, payment_notes } = req.body || {};
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });

  const result = await pool.query(
    `UPDATE professors SET
       is_active = COALESCE($1, is_active),
       payment_status = COALESCE($2, payment_status),
       payment_notes = COALESCE($3, payment_notes),
       payment_date = CASE WHEN $2 = 'payé' THEN NOW() ELSE payment_date END
     WHERE id = $4 RETURNING id, email, nom_complet, etablissement, logo_base64, specialty,
                              is_active, payment_status, payment_date, payment_notes, created_at`,
    [is_active ?? null, payment_status ?? null, payment_notes ?? null, id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Professeur introuvable' });
  res.json({ professor: result.rows[0] });
});

module.exports = router;
