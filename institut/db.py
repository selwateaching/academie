"""Accès SQLite et schéma de la base de l'institut."""

import json
import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.environ.get("INSTITUT_INSTANCE", os.path.join(BASE_DIR, "instance"))
DB_PATH = os.environ.get("INSTITUT_DB", os.path.join(INSTANCE_DIR, "institut.db"))
UPLOAD_DIR = os.environ.get("INSTITUT_UPLOADS", os.path.join(INSTANCE_DIR, "uploads"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL DEFAULT 'client',            -- client | pro
  email TEXT UNIQUE,
  pw_hash TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  birth_date TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',                          -- notes privées de la professionnelle
  preferences TEXT DEFAULT '',
  consent_data INTEGER NOT NULL DEFAULT 0,        -- traitement des données (RGPD)
  consent_marketing INTEGER NOT NULL DEFAULT 0,   -- communications commerciales
  consent_photos INTEGER NOT NULL DEFAULT 0,      -- utilisation marketing des photos
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 60,           -- minutes
  prep_time INTEGER NOT NULL DEFAULT 0,
  cleanup_time INTEGER NOT NULL DEFAULT 0,
  deposit REAL NOT NULL DEFAULT 0,
  conditions TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  diagnostic_id INTEGER REFERENCES diagnostics(id) ON DELETE SET NULL,
  diagnostic_required INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  online_bookable INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sku TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'unité',
  cost_price REAL NOT NULL DEFAULT 0,             -- prix d'achat
  sale_price REAL NOT NULL DEFAULT 0,             -- prix de vente (0 = usage cabine)
  sellable INTEGER NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  expiry_date TEXT DEFAULT '',
  location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS service_products (
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty REAL NOT NULL DEFAULT 1,
  PRIMARY KEY (service_id, product_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta REAL NOT NULL,
  reason TEXT NOT NULL,       -- reception | usage | sale | inventory | loss | return
  ref TEXT DEFAULT '',
  note TEXT DEFAULT '',
  unit_cost REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  intro TEXT DEFAULT '',
  questions TEXT NOT NULL DEFAULT '[]',
  photo_slots TEXT NOT NULL DEFAULT '[]',
  verdict_texts TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS diagnostic_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnostic_id INTEGER NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT '{}',
  action TEXT NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  diagnostic_id INTEGER NOT NULL REFERENCES diagnostics(id),
  service_id INTEGER REFERENCES services(id),
  answers TEXT NOT NULL DEFAULT '{}',
  photos TEXT NOT NULL DEFAULT '[]',
  result TEXT NOT NULL DEFAULT '{}',
  validation TEXT NOT NULL DEFAULT 'none',   -- none | pending | approved | declined
  pro_comment TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES users(id),
  submission_id INTEGER REFERENCES submissions(id),
  items TEXT NOT NULL DEFAULT '[]',
  steps TEXT NOT NULL DEFAULT '[]',
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | sent | accepted | refused | converted
  valid_until TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  sent_at TEXT,
  answered_at TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  prep INTEGER NOT NULL DEFAULT 0,
  cleanup INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirme',
  price REAL NOT NULL DEFAULT 0,
  deposit REAL NOT NULL DEFAULT 0,
  deposit_paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  quote_id INTEGER REFERENCES quotes(id),
  submission_id INTEGER REFERENCES submissions(id),
  source TEXT NOT NULL DEFAULT 'online',  -- online | manual
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appt_start ON appointments(start);
CREATE INDEX IF NOT EXISTS idx_appt_client ON appointments(client_id);

CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,             -- block | leave | open (horaires exceptionnels)
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  label TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES users(id),
  appointment_id INTEGER REFERENCES appointments(id),
  items TEXT NOT NULL DEFAULT '[]',
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'due',     -- due | partial | paid | void
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  invoice_id INTEGER REFERENCES invoices(id),
  appointment_id INTEGER REFERENCES appointments(id),
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'carte',
  kind TEXT NOT NULL DEFAULT 'payment',   -- deposit | payment | refund
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ba_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,                -- before | after
  file TEXT NOT NULL,
  taken_on TEXT NOT NULL,
  comment TEXT DEFAULT '',
  marketing_ok INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty REAL NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0,
  kind TEXT NOT NULL,                -- used | sold
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id),
  appointment_id INTEGER UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',     -- pending | published | hidden
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES users(id),
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,       -- confirmation | reminder_48h | reminder_24h | thanks | quote | custom
  channel TEXT NOT NULL DEFAULT 'email',
  to_addr TEXT DEFAULT '',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  send_at TEXT NOT NULL,
  sent_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | sent | simulated | failed | cancelled
  error TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_outbox_due ON outbox(status, send_at);
"""


def now_iso():
    return datetime.now().replace(microsecond=0).isoformat()


def connect(path=None):
    path = path or DB_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db(conn):
    conn.executescript(SCHEMA)
    conn.commit()


def rows(conn, sql, args=()):
    return [dict(r) for r in conn.execute(sql, args).fetchall()]


def row(conn, sql, args=()):
    r = conn.execute(sql, args).fetchone()
    return dict(r) if r else None


def jload(value, default=None):
    if value is None or value == "":
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def jdump(value):
    return json.dumps(value, ensure_ascii=False)
