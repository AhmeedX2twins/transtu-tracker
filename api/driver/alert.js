import { db, readBody, setCors } from "../_db.js";
import { requireRole } from "../_auth.js";

const ALLOWED_TEMPLATES = ["alert.breakdown", "alert.accident", "alert.delay", "alert.full", "alert.detour", "alert.traffic"];

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token, template, line_code, lat, lng } = readBody(req);
    const session = requireRole(token, "driver");
    if (!ALLOWED_TEMPLATES.includes(template)) throw new Error("Unknown template");
    await db().execute({
      sql: `INSERT INTO driver_alerts (template, line_code, vehicle_id, driver_id, lat, lng)
            VALUES (:template, :line_code, 'V-DEMO-1', :driver_id, :lat, :lng)`,
      args: {
        template,
        line_code: line_code?.slice(0, 20) ?? null,
        driver_id: session.id,
        lat: lat ?? null,
        lng: lng ?? null,
      },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
