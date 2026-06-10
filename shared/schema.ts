import {
  pgTable, text, integer, boolean, date, timestamp,
  jsonb, uuid, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Sessions — required for Replit Auth session storage
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)]
);

// Users — app profile merged with auth identity
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  tier: text("tier").notNull().default("free"),
  onboardingStep: text("onboarding_step").notNull().default("mirror"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  whyStatement: text("why_statement"),
  identityDeclaration: text("identity_declaration"),
  coachIntensity: text("coach_intensity").notNull().default("hard"),
  timezone: text("timezone").notNull().default("UTC"),
  forgeScore: integer("forge_score").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreakDays: integer("current_streak_days").notNull().default(0),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  lemonsqueezyCustomerId: text("lemonsqueezy_customer_id").unique(),
  lemonsqueezySubscriptionId: text("lemonsqueezy_subscription_id").unique(),
  tier: text("tier").notNull().default("free"),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Habits
export const habits = pgTable(
  "habits",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    habitType: text("habit_type").notNull(),
    targetFrequency: text("target_frequency").notNull().default("daily"),
    targetDays: jsonb("target_days").notNull().default([0, 1, 2, 3, 4, 5, 6]),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("habits_user_active_idx").on(t.userId, t.isActive)]
);

// Habit completions
export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    localDate: date("local_date").notNull(),
    completed: boolean("completed").notNull(),
    notes: text("notes"),
    completionTime: timestamp("completion_time").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("habit_completions_habit_date_unique").on(t.habitId, t.localDate),
    index("habit_completions_user_date_idx").on(t.userId, t.localDate),
  ]
);

// Habit streaks (cache)
export const habitStreaks = pgTable("habit_streaks", {
  habitId: uuid("habit_id").primaryKey().references(() => habits.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastCompletedDate: date("last_completed_date"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Daily check-ins
export const dailyCheckins = pgTable(
  "daily_checkins",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    localDate: date("local_date").notNull(),
    rawReflection: text("raw_reflection").notNull(),
    aiResponse: text("ai_response"),
    moodSignal: text("mood_signal"),
    honestyScore: integer("honesty_score"),
    forgeScoreDelta: integer("forge_score_delta").notNull().default(0),
    onboardingMirror: boolean("onboarding_mirror").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("daily_checkins_user_date_idx").on(t.userId, t.localDate)]
);

// Coaching sessions
export const coachingSessions = pgTable("coaching_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checkinId: uuid("checkin_id"),
  sessionType: text("session_type").notNull(),
  messages: jsonb("messages").notNull().default([]),
  sessionSummary: text("session_summary"),
  forgeScoreDelta: integer("forge_score_delta").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User memories (for AI RAG — without vector, falls back to recency)
export const userMemories = pgTable("user_memories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  memoryType: text("memory_type").notNull(),
  lastAccessed: timestamp("last_accessed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cookie jar entries
export const cookieJarEntries = pgTable("cookie_jar_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dateOfVictory: date("date_of_victory"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Challenges (seed data)
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: integer("difficulty").notNull(),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  xpReward: integer("xp_reward").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
});

// User challenges
export const userChallenges = pgTable("user_challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
  status: text("status").notNull().default("active"),
  reflection: text("reflection"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// XP events
export const xpEvents = pgTable("xp_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  xpAmount: integer("xp_amount").notNull(),
  reason: text("reason").notNull(),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User badges
export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeKey: text("badge_key").notNull(),
    earnedAt: timestamp("earned_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_badges_user_badge_unique").on(t.userId, t.badgeKey)]
);

// 40% Rule events
export const ruleFortyEvents = pgTable("rule_forty_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  triggeredBy: text("triggered_by").notNull(),
  habitId: uuid("habit_id"),
  choice: text("choice").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Forge score history
export const forgeScoreHistory = pgTable("forge_score_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

// Weekly reports
export const weeklyReports = pgTable("weekly_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekStartDate: date("week_start_date").notNull(),
  forgeScoreChange: integer("forge_score_change").notNull().default(0),
  habitCompletionRate: integer("habit_completion_rate").notNull().default(0),
  bestStreakThisWeek: text("best_streak_this_week"),
  behavioralArc: text("behavioral_arc"),
  keyInsight: text("key_insight"),
  nextWeekChallenge: text("next_week_challenge"),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Environment audit items
export const environmentAuditItems = pgTable("environment_audit_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
  category: text("category").notNull().default(""),
  done: boolean("done").notNull().default(false),
  doneAt: timestamp("done_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
