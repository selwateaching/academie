const express = require('express');
const { pool } = require('../db');
const { signAdminToken, requireAdmin } = require('../auth');

const router = express.Router();
const AI_QUOTA = Number(process.env.AI_MONTHLY_QUOTA || 200);

function currentMonthKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

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
            is_active, payment_status, payment_date, payment_notes,
            ai_calls_count, ai_calls_month, created_at
     FROM professors ORDER BY created_at DESC`
  );
  const month = currentMonthKey();
  const professors = result.rows.map((p) => ({
    ...p,
    ai_calls_count: p.ai_calls_month === month ? p.ai_calls_count : 0,
  }));
  res.json({ professors, ai_quota: AI_QUOTA });
});

router.put('/professors/:id', requireAdmin, async (req, res) => {
  const { is_active, payment_status, payment_notes, reset_ai_quota } = req.body || {};
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });

  const result = await pool.query(
    `UPDATE professors SET
       is_active = COALESCE($1, is_active),
       payment_status = COALESCE($2, payment_status),
       payment_notes = COALESCE($3, payment_notes),
       payment_date = CASE WHEN $2 = 'payé' THEN NOW() ELSE payment_date END,
       ai_calls_count = CASE WHEN $4 THEN 0 ELSE ai_calls_count END
     WHERE id = $5 RETURNING id, email, nom_complet, etablissement, logo_base64, specialty,
                              is_active, payment_status, payment_date, payment_notes,
                              ai_calls_count, ai_calls_month, created_at`,
    [is_active ?? null, payment_status ?? null, payment_notes ?? null, !!reset_ai_quota, id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Professeur introuvable' });
  res.json({ professor: result.rows[0] });
});

module.exports = router;
