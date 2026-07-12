-- TRANSTU Tracker — D1 schema
-- Matches every query in api/transit.functions.ts exactly (columns, types, defaults).

CREATE TABLE IF NOT EXISTS terminals (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  mode  TEXT NOT NULL CHECK (mode IN ('bus','metro','train')),
  sort  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lines (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  mode            TEXT NOT NULL CHECK (mode IN ('bus','metro','train')),
  operator        TEXT NOT NULL DEFAULT 'TRANSTU', -- 'TRANSTU' | 'SNCFT'
  train_kind      TEXT,                            -- 'tgm' | 'grandes_lignes' | 'banlieue' | NULL
  code            TEXT NOT NULL,
  destination     TEXT NOT NULL,
  terminal_id     INTEGER REFERENCES terminals(id),
  route_summary   TEXT,
  first_departure TEXT, -- 'HH:MM', entered via admin back-office
  last_departure  TEXT,
  frequency_min   INTEGER,
  active          INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_lines_mode ON lines(mode);
CREATE INDEX IF NOT EXISTS idx_lines_terminal ON lines(terminal_id);
CREATE INDEX IF NOT EXISTS idx_lines_code ON lines(code);

-- Anonymous passenger reports (guest-first: no user_id column, ever).
CREATE TABLE IF NOT EXISTS reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_code     TEXT NOT NULL UNIQUE,       -- e.g. TR-AB12CD, shown to the reporter for status lookup
  title        TEXT NOT NULL,
  category     TEXT,
  description  TEXT,
  photo_key    TEXT,                       -- R2 object key, nullable
  line_code    TEXT,
  contact      TEXT,                       -- optional, reporter-supplied
  lat          REAL,
  lng          REAL,
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','processing','resolved')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_ref ON reports(ref_code);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS driver_alerts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  template    TEXT NOT NULL, -- one of the 'alert.*' i18n keys — validated server-side
  line_code   TEXT,
  vehicle_id  TEXT,
  driver_id   INTEGER REFERENCES staff_users(id),
  lat         REAL,
  lng         REAL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON driver_alerts(active, created_at);

CREATE TABLE IF NOT EXISTS staff_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  role          TEXT NOT NULL CHECK (role IN ('driver','direction')),
  name          TEXT NOT NULL,
  -- driver credentials
  employee_id   TEXT UNIQUE,
  pin_hash      TEXT,
  on_duty       INTEGER NOT NULL DEFAULT 0,
  -- direction credentials
  email         TEXT UNIQUE,
  password_hash TEXT
);

-- ── Dev/demo staff accounts ──────────────────────────────────────────────────
-- Replace pin_hash/password_hash with real HMAC hashes (hashCredential()) before
-- go-live. These placeholders match PIN "1234" / password "transtu2026" ONLY if
-- SESSION_SECRET is left at its dev default — regenerate for production.
-- INSERT INTO staff_users (role, name, employee_id, pin_hash) VALUES ('driver', 'Chauffeur Démo', 'D-0001', '<hashCredential("1234")>');
-- INSERT INTO staff_users (role, name, email, password_hash) VALUES ('direction', 'Direction Démo', 'direction@transtu.tn', '<hashCredential("transtu2026")>');
