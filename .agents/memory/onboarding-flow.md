---
name: MindForge Onboarding Flow
description: Full 3-step onboarding sequence — what each step collects, how data is stored, and completion rewards.
---

# MindForge Onboarding Flow

Sequential steps enforced by `onboardingStep` field on the user's Firestore document. Each page checks the current step in a `useEffect` and redirects if out of order.

## Step 1 — Face the Mirror (`/onboarding/mirror`)
- **Purpose**: Honest self-assessment — current failures, excuses, current state.
- **Input**: Long-form reflection, minimum 100 characters.
- **API calls**:
  - `api.checkins.submit` → writes to `daily_checkins` with `onboardingMirror: true`
  - `/api/coach/stream` (session type: `onboarding_mirror`) → streaming AI response
  - `api.checkins.updateMetadata` → saves AI response back to the check-in record
- **Advances**: `onboardingStep` → `"why"`

## Step 2 — Excavate Your Why (`/onboarding/why`)
- **Purpose**: Multi-turn AI conversation (max 8 turns) to surface deep motivation + identity.
- **Input**:
  - **Why Statement**: extracted by AI from conversation (pattern-matched "you want to…")
  - **Identity Declaration**: user types "I am someone who…" statement; can refine up to 2×
- **API calls**:
  - `api.user.updateWhy` → saves `whyStatement` + `identityDeclaration` to `users` doc
  - `api.user.awardBadge` → grants `identity_locked` badge
- **Advances**: `onboardingStep` → `"environment"`

## Step 3 — Environment Audit (`/onboarding/environment`)
- **Purpose**: Identify physical/digital triggers; generate a personalized action plan.
- **Input**: 12 multiple-choice questions (phone location at night, workspace clutter, junk food access, etc.)
- **API calls**:
  - `api.user.submitEnvironmentAudit` → sends answers to Gemini → returns 5–8 action items
  - `api.user.markEnvironmentItemDone` → awards 50 XP per completed task
- **Storage**: `environment_audit_items` Firestore collection
- **Advances**: leads to completion

## Completion
- `api.user.completeOnboarding` → sets `onboardingComplete: true`, `onboardingStep: "complete"`
- **Rewards**: 200 XP + 50 XP per environment task + `identity_locked` badge
- **Redirect**: `/dashboard`

## Key field names (Firestore `users` doc)
- `onboardingStep`: `"mirror"` → `"why"` → `"environment"` → `"complete"`
- `onboardingComplete`: boolean
- `whyStatement`: string
- `identityDeclaration`: string

## Components
- `OnboardingHeader` — step progress indicator
- `useStreamingResponse` — hook for real-time AI coach feedback
- `PulsingDots` / `CoachBubble` / `UserBubble` — chat UI primitives
