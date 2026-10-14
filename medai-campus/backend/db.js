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
      ai_calls_count INTEGER NOT NULL DEFAULT 0,
      ai_calls_month TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE professors ADD COLUMN IF NOT EXISTS ai_calls_count INTEGER NOT NULL DEFAULT 0;`);
  await pool.query(`ALTER TABLE professors ADD COLUMN IF NOT EXISTS ai_calls_month TEXT NOT NULL DEFAULT '';`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
      access_code TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      promo TEXT NOT NULL DEFAULT '',
      moyenne TEXT NOT NULL DEFAULT '—',
      statut TEXT NOT NULL DEFAULT 'En cours',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_results (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      exam_title TEXT NOT NULL DEFAULT '',
      note NUMERIC NOT NULL DEFAULT 0,
      total NUMERIC NOT NULL DEFAULT 20,
      mention TEXT NOT NULL DEFAULT '',
      appreciation TEXT NOT NULL DEFAULT '',
      commentaire TEXT NOT NULL DEFAULT '',
      result_date TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS published_courses (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      promo TEXT NOT NULL DEFAULT '',
      content_html TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initSchema };
