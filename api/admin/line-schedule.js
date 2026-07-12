import { db, readBody, setCors } from "../_db.js";
import { requireRole } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token, id, first_departure, last_departure, frequency_min } = readBody(req);
    requireRole(token, "direction");
    await db().execute({
      sql: "UPDATE lines SET first_departure=:fd, last_departure=:ld, frequency_min=:freq WHERE id=:id",
      args: { fd: first_departure || null, ld: last_departure || null, freq: frequency_min ?? null, id },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
