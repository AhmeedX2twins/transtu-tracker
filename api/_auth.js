// Same HMAC-SHA256 session scheme as server/auth.js, duplicated here (not
// imported from server/) because Vercel bundles each /api file's dependency
// graph separately and server/ isn't meant to ship in the serverless bundle.
import crypto from "node:crypto";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET not set — add it in Vercel project settings.");
  return s;
}

export function hashCredential(raw) {
  return crypto.createHmac("sha256", secret()).update(String(raw)).digest("base64url");
}

export function signSession(payload) {
  const full = { ...payload, iat: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function requireRole(token, role) {
  if (!token || typeof token !== "string" || !token.includes(".")) throw new Error("Invalid session");
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (expected !== sig) throw new Error("Invalid session signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (Date.now() - payload.iat > MAX_AGE_MS) throw new Error("Session expired");
  if (payload.role !== role) throw new Error("Wrong role for this action");
  return payload;
}
