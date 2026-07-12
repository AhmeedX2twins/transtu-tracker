import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { hashCredential, signSession, requireRole } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

const LINE_SELECT = `SELECT l.id, l.mode, l.operator, l.train_kind, l.code, l.destination,
  l.terminal_id, t.name AS terminal_name, l.route_summary,
  l.first_departure, l.last_departure, l.frequency_min
  FROM lines l LEFT JOIN terminals t ON t.id = l.terminal_id WHERE l.active = 1`;

function asyncRoute(fn) {
  return (req, res) => {
    try {
      fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Error" });
    }
  };
}

// ── Network / search / alerts (public, guest-first) ─────────────────────────
app.get(
  "/api/network",
  asyncRoute((req, res) => {
    const terminals = db.prepare("SELECT id, slug, name, mode, sort FROM terminals ORDER BY sort").all();
    const lines = db.prepare(`${LINE_SELECT} ORDER BY l.mode, t.sort, l.code`).all();
    res.json({ terminals, lines });
  }),
);

app.get(
  "/api/search",
  asyncRoute((req, res) => {
    const query = String(req.query.q ?? "").trim().slice(0, 80);
    if (!query) return res.json([]);
    const like = `%${query.replace(/[%_]/g, "")}%`;
    // Named params, not repeated numbered "?1" placeholders — better-sqlite3
    // rejects the latter with "Too many parameter values were provided" as
    // soon as a numbered placeholder is reused more than once in the string.
    const rows = db
      .prepare(
        `${LINE_SELECT} AND (l.code LIKE @like OR l.destination LIKE @like OR t.name LIKE @like OR l.route_summary LIKE @like)
         ORDER BY CASE WHEN l.code = @query THEN 0 WHEN l.code LIKE @prefix THEN 1 ELSE 2 END, l.code LIMIT 40`,
      )
      .all({ like, query, prefix: `${query}%` });
    res.json(rows);
  }),
);

app.get(
  "/api/alerts",
  asyncRoute((req, res) => {
    const rows = db
      .prepare(
        `SELECT id, template, line_code, created_at FROM driver_alerts
         WHERE active = 1 AND created_at > datetime('now', '-3 hours')
         ORDER BY created_at DESC LIMIT 20`,
      )
      .all();
    res.json(rows);
  }),
);

// ── Passenger reports (anonymous) ────────────────────────────────────────────
app.post(
  "/api/reports",
  asyncRoute((req, res) => {
    const data = req.body ?? {};
    const title = String(data.title ?? "").trim().slice(0, 120);
    if (!title) return res.status(400).json({ error: "Title required" });

    let photoKey = null;
    if (data.photo_data_url) {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data.photo_data_url);
      if (m) {
        const bytes = Buffer.from(m[2], "base64");
        if (bytes.byteLength <= 2_500_000) {
          const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
          photoKey = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
          fs.writeFileSync(path.join(UPLOADS_DIR, photoKey), bytes);
        }
      }
    }
    const ref = `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO reports (ref_code, title, category, description, photo_key, line_code, contact, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      ref,
      title,
      data.category?.slice(0, 40) ?? null,
      data.description?.slice(0, 1000) ?? null,
      photoKey,
      data.line_code?.slice(0, 20) ?? null,
      data.contact?.slice(0, 120) ?? null,
      data.lat ?? null,
      data.lng ?? null,
    );
    res.json({ ref_code: ref });
  }),
);

app.post(
  "/api/report-statuses",
  asyncRoute((req, res) => {
    const refs = Array.isArray(req.body?.refs) ? req.body.refs.slice(0, 30).map(String) : [];
    if (!refs.length) return res.json([]);
    const placeholders = refs.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT ref_code, title, status, created_at FROM reports WHERE ref_code IN (${placeholders})
         ORDER BY created_at DESC`,
      )
      .all(...refs);
    res.json(rows);
  }),
);

// ── Staff auth ────────────────────────────────────────────────────────────
app.post(
  "/api/auth/driver",
  asyncRoute((req, res) => {
    const { employee_id, pin } = req.body ?? {};
    const hash = hashCredential(String(pin ?? ""));
    const row = db
      .prepare("SELECT id, name, on_duty FROM staff_users WHERE role='driver' AND employee_id=? AND pin_hash=?")
      .get(String(employee_id ?? "").trim(), hash);
    if (!row) return res.json({ ok: false });
    const token = signSession({ id: row.id, role: "driver", name: row.name });
    res.json({ ok: true, token, name: row.name, on_duty: !!row.on_duty });
  }),
);

app.post(
  "/api/auth/direction",
  asyncRoute((req, res) => {
    const { email, password } = req.body ?? {};
    const hash = hashCredential(String(password ?? ""));
    const row = db
      .prepare("SELECT id, name FROM staff_users WHERE role='direction' AND email=? AND password_hash=?")
      .get(String(email ?? "").trim().toLowerCase(), hash);
    if (!row) return res.json({ ok: false });
    const token = signSession({ id: row.id, role: "direction", name: row.name });
    res.json({ ok: true, token, name: row.name });
  }),
);

// ── Driver actions ────────────────────────────────────────────────────────
const ALLOWED_TEMPLATES = [
  "alert.breakdown",
  "alert.accident",
  "alert.delay",
  "alert.full",
  "alert.detour",
  "alert.traffic",
];

app.post(
  "/api/driver/alert",
  asyncRoute((req, res) => {
    const { token, template, line_code, lat, lng } = req.body ?? {};
    const session = requireRole(token, "driver");
    if (!ALLOWED_TEMPLATES.includes(template)) throw new Error("Unknown template");
    db.prepare(
      `INSERT INTO driver_alerts (template, line_code, vehicle_id, driver_id, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(template, line_code?.slice(0, 20) ?? null, "V-DEMO-1", session.id, lat ?? null, lng ?? null);
    res.json({ ok: true });
  }),
);

app.post(
  "/api/driver/duty",
  asyncRoute((req, res) => {
    const { token, on_duty } = req.body ?? {};
    const session = requireRole(token, "driver");
    db.prepare("UPDATE staff_users SET on_duty=? WHERE id=?").run(on_duty ? 1 : 0, session.id);
    res.json({ ok: true });
  }),
);

// ── Direction / admin ────────────────────────────────────────────────────
app.post(
  "/api/admin/overview",
  asyncRoute((req, res) => {
    requireRole(req.body?.token, "direction");
    const reports = db
      .prepare(
        `SELECT id, ref_code, title, category, description, photo_key, line_code, contact, status, created_at
         FROM reports ORDER BY created_at DESC LIMIT 100`,
      )
      .all();
    const alerts = db
      .prepare(
        `SELECT a.id, a.template, a.line_code, a.vehicle_id, a.active, a.created_at, s.name AS driver_name
         FROM driver_alerts a LEFT JOIN staff_users s ON s.id = a.driver_id
         ORDER BY a.created_at DESC LIMIT 100`,
      )
      .all();
    const stats = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM reports WHERE status != 'resolved') AS open_reports,
          (SELECT COUNT(*) FROM driver_alerts WHERE active = 1 AND created_at > datetime('now','-3 hours')) AS active_alerts,
          (SELECT COUNT(*) FROM lines WHERE active = 1) AS line_count`,
      )
      .get();
    res.json({ reports, alerts, stats });
  }),
);

app.post(
  "/api/admin/report-status",
  asyncRoute((req, res) => {
    const { token, id, status } = req.body ?? {};
    requireRole(token, "direction");
    if (status === "delete") {
      db.prepare("DELETE FROM reports WHERE id=?").run(id);
    } else {
      db.prepare("UPDATE reports SET status=? WHERE id=?").run(status, id);
    }
    res.json({ ok: true });
  }),
);

app.post(
  "/api/admin/alert-resolve",
  asyncRoute((req, res) => {
    const { token, id } = req.body ?? {};
    requireRole(token, "direction");
    db.prepare("UPDATE driver_alerts SET active=0 WHERE id=?").run(id);
    res.json({ ok: true });
  }),
);

app.post(
  "/api/admin/line-schedule",
  asyncRoute((req, res) => {
    const { token, id, first_departure, last_departure, frequency_min } = req.body ?? {};
    requireRole(token, "direction");
    db.prepare("UPDATE lines SET first_departure=?, last_departure=?, frequency_min=? WHERE id=?").run(
      first_departure || null,
      last_departure || null,
      frequency_min ?? null,
      id,
    );
    res.json({ ok: true });
  }),
);

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`[api] TRANSTU Tracker API running on http://localhost:${PORT}`);
});
