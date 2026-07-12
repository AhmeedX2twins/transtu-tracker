import { db, readBody, setCors } from "../_db.js";
import { requireRole } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token, on_duty } = readBody(req);
    const session = requireRole(token, "driver");
    await db().execute({
      sql: "UPDATE staff_users SET on_duty=:on_duty WHERE id=:id",
      args: { on_duty: on_duty ? 1 : 0, id: session.id },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
