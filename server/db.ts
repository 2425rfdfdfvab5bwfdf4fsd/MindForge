import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/shared/schema";

const rawUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("No database connection string found. Set SUPABASE_DATABASE_URL or DATABASE_URL.");
}

/**
 * Supabase passwords can contain special characters (e.g. "@") that break
 * standard URL parsers. This function re-encodes the password segment so the
 * pg driver can handle it correctly.
 */
function sanitizePostgresUrl(url: string): string {
  // Only attempt sanitisation for postgresql/postgres URLs
  const proto = url.match(/^(postgresql|postgres):\/\//i)?.[0];
  if (!proto) return url;

  const rest = url.slice(proto.length); // everything after "postgresql://"

  // Find the last "@" — everything before it is "user:password", everything
  // after is "host:port/db". This correctly handles "@" inside passwords.
  const atIdx = rest.lastIndexOf("@");
  if (atIdx === -1) return url;

  const credentials = rest.slice(0, atIdx);       // "user:password"
  const hostPart   = rest.slice(atIdx + 1);        // "host:port/db"

  const colonIdx = credentials.indexOf(":");
  if (colonIdx === -1) return url;

  const user     = credentials.slice(0, colonIdx);
  const password = credentials.slice(colonIdx + 1);

  // Re-encode the password (encode everything except already-encoded sequences)
  const encodedPassword = encodeURIComponent(decodeURIComponent(password));

  return `${proto}${user}:${encodedPassword}@${hostPart}`;
}

const connectionString = sanitizePostgresUrl(rawUrl);
const isSupabase = Boolean(process.env.SUPABASE_DATABASE_URL);

const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
