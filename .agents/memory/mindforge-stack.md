---
name: MindForge stack & PRD constants
description: Critical PRD values that must never be approximated — XP amounts, level thresholds, pricing, field names, and schema details
---

## PRD Constants (use exactly)
- Pro pricing: $12/month, $89/year | Elite: $29/month, $219/year
- Cookie jar title max: 80 chars (NOT 100)
- XP: habit=20, checkin=30, cookie_jar=25, environment=50, onboarding=200
- Level thresholds: Raw(0) / Tempered(500) / Forged(1500) / Hardened(3500) / Unbreakable(7500) / Legendary(15000)
- Forge Score uses floor() always (not Math.round())
- mood_signal values: 'excusing' | 'deflecting' | 'owning' | 'crushing'
- 40% Rule modal heading: "YOUR MIND IS LYING TO YOU"
- Cron batch size: 50 users
- Score animation duration: 500ms
- 6 badges: identity_locked, mirror_gazer, cookie_jar_founder, forty_percent_survivor, cold_mind, tempered

## Auth
- Replit OIDC custom PKCE, JWT via jose, cookie name `mf_session`
- getSession() in lib/auth.ts

## Stack
- Next.js 14 App Router, tRPC v11, Drizzle ORM + pg, Replit PostgreSQL
- Tailwind forge.* color tokens: orange=#FF6B2B, base=#0A0908, subtle=#111110, border=#2A2927
- Port 5000 (allowedDevOrigins set for *.replit.dev)

**Why:** These values appear throughout 9 phases of development. Getting any one wrong breaks PRD compliance.
