// Run locally once, after creating the Turso DB and loading schema.sql +
// seed.sql, to insert the two demo staff accounts with the correct password
// hash for YOUR SESSION_SECRET (the hash depends on it — see api/_auth.js).
//
// Usage:
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... SESSION_SECRET=... node turso/create-staff.js
import { createClient } from "@libsql/client";
import crypto from "node:crypto";

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, SESSION_SECRET } = process.env;
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN || !SESSION_SECRET) {
  console.error("Set TURSO_DATABASE_URL, TURSO_AUTH_TOKEN and SESSION_SECRET first.");
  process.exit(1);
}

function hashCredential(raw) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(String(raw)).digest("base64url");
}

const db = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

await db.execute({
  sql: "DELETE FROM staff_users WHERE employee_id = 'D-0001' OR email = 'direction@transtu.tn'",
});
await db.execute({
  sql: "INSERT INTO staff_users (role, name, employee_id, pin_hash) VALUES ('driver', 'Chauffeur Démo', 'D-0001', :hash)",
  args: { hash: hashCredential("1234") },
});
await db.execute({
  sql: "INSERT INTO staff_users (role, name, email, password_hash) VALUES ('direction', 'Direction Démo', 'direction@transtu.tn', :hash)",
  args: { hash: hashCredential("transtu2026") },
});

console.log("Demo staff accounts created:");
console.log("  driver    -> D-0001 / 1234");
console.log("  direction -> direction@transtu.tn / transtu2026");
