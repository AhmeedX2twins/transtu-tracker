import { db, readBody, setCors } from "../_db.js";
import { requireRole } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token } = readBody(req);
    requireRole(token, "direction");
    const reports = (
      await db().execute(
        `SELECT id, ref_code, title, category, description, photo_data_url, line_code, contact, status, created_at
         FROM reports ORDER BY created_at DESC LIMIT 100`,
      )
    ).rows;
    const alerts = (
      await db().execute(
        `SELECT a.id, a.template, a.line_code, a.vehicle_id, a.active, a.created_at, s.name AS driver_name
         FROM driver_alerts a LEFT JOIN staff_users s ON s.id = a.driver_id
         ORDER BY a.created_at DESC LIMIT 100`,
      )
    ).rows;
    const stats = (
      await db().execute(
        `SELECT
          (SELECT COUNT(*) FROM reports WHERE status != 'resolved') AS open_reports,
          (SELECT COUNT(*) FROM driver_alerts WHERE active = 1 AND created_at > datetime('now','-3 hours')) AS active_alerts,
          (SELECT COUNT(*) FROM lines WHERE active = 1) AS line_count`,
      )
    ).rows[0];
    res.status(200).json({ reports, alerts, stats });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
