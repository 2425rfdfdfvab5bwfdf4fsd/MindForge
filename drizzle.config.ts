import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL)!,
    ssl: process.env.SUPABASE_DATABASE_URL ? "require" : undefined,
  },
} satisfies Config;
