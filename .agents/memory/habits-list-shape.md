---
name: Habits list query output shape
description: The habits.list tRPC procedure intentionally returns snake_case field names; consumer code must use those, not Drizzle camelCase
---

The `habits.list` procedure maps Drizzle camelCase fields to snake_case in its return:
- `habit_type` (not `habitType`)
- `target_frequency` (not `targetFrequency`)
- `target_days` (not `targetDays`)
- `sort_order` (not `sortOrder`)
- `current_streak`, `longest_streak`, `today_status` (computed)

**Why:** The list procedure was built to expose a flattened shape combining habit + streak data. Changing it to camelCase would break all consumers (HabitCard, habits/[id]/page).

**How to apply:** When using `api.habits.list` query results, use snake_case field names. The HabitGrid component was updated to use `localDate` (camelCase) because it gets its data from `habits.getCompletionHistory` which returns Drizzle camelCase directly.
