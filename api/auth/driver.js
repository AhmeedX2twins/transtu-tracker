import { db, readBody, setCors } from "../_db.js";
import { hashCredential, signSession } from "../_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { employee_id, pin } = readBody(req);
    const hash = hashCredential(String(pin ?? ""));
    const result = await db().execute({
      sql: "SELECT id, name, on_duty FROM staff_users WHERE role='driver' AND employee_id=:eid AND pin_hash=:hash",
      args: { eid: String(employee_id ?? "").trim(), hash },
    });
    const row = result.rows[0];
    if (!row) return res.status(200).json({ ok: false });
    const token = signSession({ id: row.id, role: "driver", name: row.name });
    res.status(200).json({ ok: true, token, name: row.name, on_duty: !!row.on_duty });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
