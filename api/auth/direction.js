import { db, readBody, setCors } from "../_db.js";
import { hashCredential, signSession } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, password } = readBody(req);
    const hash = hashCredential(String(password ?? ""));
    const result = await db().execute({
      sql: "SELECT id, name FROM staff_users WHERE role='direction' AND email=:email AND password_hash=:hash",
      args: { email: String(email ?? "").trim().toLowerCase(), hash },
    });
    const row = result.rows[0];
    if (!row) return res.status(200).json({ ok: false });
    const token = signSession({ id: row.id, role: "direction", name: row.name });
    res.status(200).json({ ok: true, token, name: row.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
