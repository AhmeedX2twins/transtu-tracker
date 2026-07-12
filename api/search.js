import { db, setCors } from "./_db.js";

const LINE_SELECT = `SELECT l.id, l.mode, l.operator, l.train_kind, l.code, l.destination,
  l.terminal_id, t.name AS terminal_name, l.route_summary,
  l.first_departure, l.last_departure, l.frequency_min
  FROM lines l LEFT JOIN terminals t ON t.id = l.terminal_id WHERE l.active = 1`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const query = String(req.query.q ?? "").trim().slice(0, 80);
    if (!query) return res.status(200).json([]);
    const like = `%${query.replace(/[%_]/g, "")}%`;
    const result = await db().execute({
      sql: `${LINE_SELECT} AND (l.code LIKE :like OR l.destination LIKE :like OR t.name LIKE :like OR l.route_summary LIKE :like)
            ORDER BY CASE WHEN l.code = :query THEN 0 WHEN l.code LIKE :prefix THEN 1 ELSE 2 END, l.code LIMIT 40`,
      args: { like, query, prefix: `${query}%` },
    });
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
