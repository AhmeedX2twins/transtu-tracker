import { db, readBody, setCors } from "../_db.js";
import { requireRole } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token, id, status } = readBody(req);
    requireRole(token, "direction");
    if (status === "delete") {
      await db().execute({ sql: "DELETE FROM reports WHERE id=:id", args: { id } });
    } else {
      await db().execute({ sql: "UPDATE reports SET status=:status WHERE id=:id", args: { status, id } });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
