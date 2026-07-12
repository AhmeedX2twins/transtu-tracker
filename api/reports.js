import { db, readBody, setCors } from "./_db.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const data = readBody(req);
    const title = String(data.title ?? "").trim().slice(0, 120);
    if (!title) return res.status(400).json({ error: "Title required" });

    // No persistent disk on Vercel serverless, so the (already client-side
    // downscaled, ~<300KB) photo is stored as a data URL string directly in
    // the row rather than as a separate file — fine at this app's scale.
    let photo = null;
    if (typeof data.photo_data_url === "string" && data.photo_data_url.startsWith("data:image/")) {
      if (data.photo_data_url.length <= 2_500_000) photo = data.photo_data_url;
    }
    const ref = `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await db().execute({
      sql: `INSERT INTO reports (ref_code, title, category, description, photo_data_url, line_code, contact, lat, lng)
            VALUES (:ref, :title, :category, :description, :photo, :line_code, :contact, :lat, :lng)`,
      args: {
        ref,
        title,
        category: data.category?.slice(0, 40) ?? null,
        description: data.description?.slice(0, 1000) ?? null,
        photo,
        line_code: data.line_code?.slice(0, 20) ?? null,
        contact: data.contact?.slice(0, 120) ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
      },
    });
    res.status(200).json({ ref_code: ref });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
