import { db, setCors } from "./_db.js";

const LINE_SELECT = `SELECT l.id, l.mode, l.operator, l.train_kind, l.code, l.destination,
  l.terminal_id, t.name AS terminal_name, l.route_summary,
  l.first_departure, l.last_departure, l.frequency_min
  FROM lines l LEFT JOIN terminals t ON t.id = l.terminal_id WHERE l.active = 1`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const terminals = (await db().execute("SELECT id, slug, name, mode, sort FROM terminals ORDER BY sort")).rows;
    const lines = (await db().execute(`${LINE_SELECT} ORDER BY l.mode, t.sort, l.code`)).rows;
    res.status(200).json({ terminals, lines });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
