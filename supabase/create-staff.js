import postgres from "postgres";
import crypto from "node:crypto";

const { SUPABASE_DATABASE_URL, DATABASE_URL, SESSION_SECRET } = process.env;
const connectionString = SUPABASE_DATABASE_URL || DATABASE_URL;
if (!connectionString || !SESSION_SECRET) {
  console.error("Set SUPABASE_DATABASE_URL (or DATABASE_URL) and SESSION_SECRET first.");
  process.exit(1);
}

function hashCredential(raw) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(String(raw)).digest("base64url");
}

const sql = postgres(connectionString, { ssl: "require" });

async function run() {
  try {
    await sql`DELETE FROM staff_users WHERE employee_id = 'D-0001' OR email = 'direction@transtu.tn'`;
    
    const driverHash = hashCredential("1234");
    await sql`INSERT INTO staff_users (role, name, employee_id, pin_hash) VALUES ('driver', 'Chauffeur Démo', 'D-0001', ${driverHash})`;

    const dirHash = hashCredential("transtu2026");
    await sql`INSERT INTO staff_users (role, name, email, password_hash) VALUES ('direction', 'Direction Démo', 'direction@transtu.tn', ${dirHash})`;

    console.log("Demo staff accounts created:");
    console.log("  driver    -> D-0001 / 1234");
    console.log("  direction -> direction@transtu.tn / transtu2026");
    process.exit(0);
  } catch (error) {
    console.error("Failed to create demo staff accounts:", error);
    process.exit(1);
  }
}

run();
