const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS professors (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nom_complet TEXT NOT NULL,
      etablissement TEXT NOT NULL DEFAULT '',
      logo_base64 TEXT NOT NULL DEFAULT '',
      specialty TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT FALSE,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_date TIMESTAMPTZ,
      payment_notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initSchema };
