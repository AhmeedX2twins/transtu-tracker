// Staff auth — Node's built-in crypto instead of Cloudflare's bindings-based
// Web Crypto setup. Same HMAC-SHA256 scheme, same token shape.
import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h shift-length token

export function hashCredential(raw) {
  return crypto.createHmac("sha256", SECRET).update(String(raw)).digest("base64url");
}

export function signSession(payload) {
  const full = { ...payload, iat: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function requireRole(token, role) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    throw new Error("Invalid session");
  }
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (expected !== sig) throw new Error("Invalid session signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (Date.now() - payload.iat > MAX_AGE_MS) throw new Error("Session expired");
  if (payload.role !== role) throw new Error("Wrong role for this action");
  return payload;
}
