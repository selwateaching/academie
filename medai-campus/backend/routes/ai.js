const express = require('express');
const { pool } = require('../db');
const { requireProfessor } = require('../auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const AI_MODEL = 'claude-sonnet-5-5';
const AI_MAX_TOKENS = 3000;
const MONTHLY_QUOTA = Number(process.env.AI_MONTHLY_QUOTA || 200);

function currentMonthKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

router.post('/generate', requireProfessor, asyncHandler(async (req, res) => {
  const { messages, system } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'Messages manquants' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "Clé IA non configurée côté serveur. Contactez l'administrateur." });
  }

  const month = currentMonthKey();
  const profResult = await pool.query(
    'SELECT id, is_active, ai_calls_count, ai_calls_month FROM professors WHERE id = $1',
    [req.professorId]
  );
  const professor = profResult.rows[0];
  if (!professor) return res.status(404).json({ error: 'Professeur introuvable' });
  if (!professor.is_active) return res.status(403).json({ error: 'Compte désactivé' });

  const inSameMonth = professor.ai_calls_month === month;
  const currentCount = inSameMonth ? professor.ai_calls_count : 0;
  if (currentCount >= MONTHLY_QUOTA) {
    return res.status(429).json({
      error: `Quota IA mensuel atteint (${MONTHLY_QUOTA}/${MONTHLY_QUOTA}). Il sera réinitialisé le mois prochain.`,
      quota: MONTHLY_QUOTA,
      used: currentCount,
    });
  }

  let anthropicRes;
  try {
    anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOKENS,
        output_config: { effort: 'low' },
        messages,
        ...(system ? { system } : {}),
      }),
    });
  } catch (networkErr) {
    return res.status(502).json({ error: 'Erreur réseau vers le service IA' });
  }

  if (!anthropicRes.ok) {
    let errMsg = 'Erreur du service IA (' + anthropicRes.status + ')';
    try {
      const errData = await anthropicRes.json();
      errMsg = errData.error?.message || errMsg;
    } catch {}
    return res.status(502).json({ error: errMsg });
  }

  const data = await anthropicRes.json();
  const text = (data.content || []).map((b) => b.text || '').join('');

  const newCount = currentCount + 1;
  await pool.query(
    'UPDATE professors SET ai_calls_count = $1, ai_calls_month = $2 WHERE id = $3',
    [newCount, month, req.professorId]
  );

  res.json({ text, usage: { used: newCount, quota: MONTHLY_QUOTA } });
}));

module.exports = router;
