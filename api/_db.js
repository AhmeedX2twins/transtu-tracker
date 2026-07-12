// Shared DB client for Vercel serverless functions - Supabase (Postgres)
import postgres from "postgres";

let sql;
export function db() {
  if (!sql) {
    const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("SUPABASE_DATABASE_URL / DATABASE_URL not set - add it in Vercel project settings.");
    }
    sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });
  }

  return {
    async execute(queryObj) {
      let rawSql = "";
      let args = {};

      if (typeof queryObj === "string") {
        rawSql = queryObj;
      } else if (queryObj && typeof queryObj === "object") {
        rawSql = queryObj.sql || "";
        args = queryObj.args || {};
      }

      // SQLite to Postgres query translations
      rawSql = rawSql.replace(/datetime\('now',\s*'-3 hours'\)/gi, "NOW() - INTERVAL '3 hours'");
      rawSql = rawSql.replace(/datetime\('now'\)/gi, "NOW()");

      // Convert named parameters (:param) to positional ($1)
      const values = [];
      const paramMap = {};
      let paramCount = 0;

      const preparedSql = rawSql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
        if (name in args) {
          if (!paramMap[name]) {
            paramCount++;
            paramMap[name] = `$${paramCount}`;
            values.push(args[name]);
          }
          return paramMap[name];
        }
        return match;
      });

      const rows = await sql.unsafe(preparedSql, values);
      return { rows };
    }
  };
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
