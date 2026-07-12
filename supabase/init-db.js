import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Please set the SUPABASE_DATABASE_URL environment variable.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

function translateSql(content) {
  return content
    // SQLite primary key auto-increment to Postgres SERIAL
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY")
    // SQLite datetime('now') DEFAULT values to Postgres CURRENT_TIMESTAMP
    .replace(/DEFAULT\s+\(datetime\('now'\)\)/gi, "DEFAULT CURRENT_TIMESTAMP")
    .replace(/created_at\s+TEXT/gi, "created_at TIMESTAMP WITH TIME ZONE");
}

async function init() {
  try {
    console.log("Translating and loading schema...");
    const schemaSql = translateSql(fs.readFileSync(path.join(__dirname, "../turso/schema.sql"), "utf8"));
    // Run schema commands
    await sql.unsafe(schemaSql);
    console.log("Schema created.");

    console.log("Loading seed data...");
    const seedSql = fs.readFileSync(path.join(__dirname, "../turso/seed.sql"), "utf8");
    // Run seed commands
    await sql.unsafe(seedSql);
    console.log("Seed data imported.");

    console.log("Adjusting serial sequences...");
    const tables = ["terminals", "lines", "reports", "driver_alerts", "staff_users"];
    for (const table of tables) {
      // In Postgres, if a table is populated with explicit IDs, the sequence must be synced
      await sql.unsafe(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), coalesce(max(id), 1)) FROM ${table}`);
    }
    console.log("Sequences synchronized successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    process.exit(1);
  }
}

init();
