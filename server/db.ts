import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/shared/schema";

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("No database connection string found. Set SUPABASE_DATABASE_URL or DATABASE_URL.");
}

const pool = new Pool({
  connectionString,
  ssl: process.env.SUPABASE_DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
