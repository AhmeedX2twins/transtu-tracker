import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashCredential } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "transtu.db");
const isNew = !fs.existsSync(DB_PATH);

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

if (isNew) {
  console.log("[db] First run — creating schema, seeding lines, creating demo staff accounts…");
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  db.exec(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));

  // Demo staff accounts — CHANGE these before showing this to anyone else.
  // Driver:    employee ID "D-0001"          / PIN "1234"
  // Direction: email "direction@transtu.tn"  / password "transtu2026"
  db.prepare(
    "INSERT INTO staff_users (role, name, employee_id, pin_hash) VALUES (?, ?, ?, ?)",
  ).run("driver", "Chauffeur Démo", "D-0001", hashCredential("1234"));
  db.prepare(
    "INSERT INTO staff_users (role, name, email, password_hash) VALUES (?, ?, ?, ?)",
  ).run("direction", "Direction Démo", "direction@transtu.tn", hashCredential("transtu2026"));

  console.log("[db] Ready at", DB_PATH);
  console.log("[db] Demo driver login    -> D-0001 / 1234");
  console.log("[db] Demo direction login -> direction@transtu.tn / transtu2026");
}
