---
name: Firestore tRPC type pattern
description: How to get correct TypeScript inference from Firestore doc spreads in tRPC routers
---

## Rule
Any tRPC router that returns `{ id: snap.id, ...snap.data() }` MUST add an explicit `as TypeName` cast, otherwise TypeScript infers the return as `{ id: string }` and every client component using that procedure gets type errors for all data fields.

## Why
`snap.data()` returns `FirebaseFirestore.DocumentData | undefined`, which is essentially `Record<string, any>`. TypeScript widens the spread to nothing — only the literal properties (just `id`) survive in the inferred type. tRPC propagates this inferred return type to the client, so client code can't access `profile.tier`, `checkin.honestyScore`, etc.

## How to apply
- Import the relevant type: `import type { UserProfile } from "@/types";`
- Cast the return: `return { id: snap.id, ...snap.data() } as UserProfile;`
- For arrays: `return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserBadge[];`
- For complex computed objects, destructure and cast each field explicitly (see challenges.ts list procedure)
- For inline types (e.g. subscription), use an inline `as { status: ...; ... }` cast directly on the return

## Routers already fixed
All four primary data routers (user, checkins, cookiejar, challenges) have correct casts as of the last type audit. Any new procedure added to these routers must follow the same pattern.
