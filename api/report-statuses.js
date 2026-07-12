import { db, readBody, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { refs } = readBody(req);
    const list = Array.isArray(refs) ? refs.slice(0, 30).map(String) : [];
    if (!list.length) return res.status(200).json([]);
    const placeholders = list.map((_, i) => `:r${i}`).join(",");
    const args = {};
    list.forEach((r, i) => (args[`r${i}`] = r));
    const result = await db().execute({
      sql: `SELECT ref_code, title, status, created_at FROM reports WHERE ref_code IN (${placeholders}) ORDER BY created_at DESC`,
      args,
    });
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
