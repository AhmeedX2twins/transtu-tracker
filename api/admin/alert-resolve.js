import { db, readBody, setCors } from "../_db.js";
import { requireRole } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token, id } = readBody(req);
    requireRole(token, "direction");
    await db().execute({ sql: "UPDATE driver_alerts SET active=0 WHERE id=:id", args: { id } });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
