import { db, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const result = await db().execute(
      `SELECT id, template, line_code, created_at FROM driver_alerts
       WHERE active = 1 AND created_at > datetime('now', '-3 hours')
       ORDER BY created_at DESC LIMIT 20`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
