---
name: TypeScript tsconfig exclusions
description: Two legacy directories are excluded from tsconfig to avoid Zod version conflicts and missing package errors
---

Added to tsconfig.json `exclude` array:
- `server/replit_integrations` — legacy Replit OAuth files using express/passport/openid-client; not used by the active app (uses custom PKCE auth in lib/auth.ts)
- `shared/models` — legacy drizzle-zod schema file (shared/models/chat.ts) with Zod version mismatch; active schema is in shared/schema.ts

**Why:** These files caused `tsc --noEmit` to fail with module-not-found and ZodType constraint errors. They are not imported by any active code.

**How to apply:** If adding new files to these directories, be aware they won't be type-checked. The active app's types are fully covered by the tsconfig include paths.
