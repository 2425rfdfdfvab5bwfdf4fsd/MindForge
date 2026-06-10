---
name: Level utilities split
description: getLevelFromXP and getLevelName must be imported from lib/level.ts in client components — lib/xp.ts is server-only and will crash the client bundle.
---

## Rule
Client components (any file with `"use client"`) must import `getLevelFromXP` and `getLevelName` from `@/lib/level`, never from `@/lib/xp`.

## Why
`lib/xp.ts` has `import "server-only"` and imports `firebase-admin`. Next.js will refuse to bundle it in client code and throw a build error. The pure level-calculation logic was extracted into `lib/level.ts` which has no server dependencies and is safe for both client and server.

## How to apply
- Any component with `"use client"` that needs level info → `import { getLevelFromXP } from "@/lib/level"`
- Server-side code (API routes, tRPC routers, server components) can import from either `lib/level` or `lib/xp`
- If adding new pure utilities to `lib/xp.ts`, consider whether they belong in `lib/level.ts` instead
