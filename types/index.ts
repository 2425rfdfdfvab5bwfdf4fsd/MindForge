// MindForge — Firestore data model types
// All collections use camelCase field names in Firestore documents

export type UserTier = "free" | "pro" | "elite";
export type MoodSignal = "excusing" | "deflecting" | "owning" | "crushing";
export type HabitCategory = "health" | "mind" | "avoid" | "perform";
export type HabitType = "build" | "avoid";
export type ChallengeCategory = "cold" | "screen" | "physical" | "fast" | "social";
export type XPEventType =
  | "habit_complete"
  | "checkin"
  | "checkin_bonus"
  | "challenge"
  | "forty_percent"
  | "cookie_jar"
  | "environment"
  | "onboarding";
export type BadgeKey =
  | "identity_locked"
  | "mirror_gazer"
  | "cookie_jar_founder"
  | "forty_percent_survivor"
  | "cold_mind"
  | "tempered";
export type SessionType =
  | "onboarding_mirror"
  | "why_excavation"
  | "daily_checkin"
  | "forty_percent_rule"
  | "direct_chat";
export type RuleFortyChoice = "took_step" | "declined";
export type RuleFortyTrigger = "auto_habit" | "auto_checkin" | "manual";
export type MemoryType = "preference" | "trigger" | "victory" | "fear" | "identity" | "pattern";

export interface EnvironmentAuditItem {
  id: string;
  item: string;
  category: string;
  done: boolean;
}

// ── Firestore Collections ──────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string | null;
  tier: UserTier;
  onboardingComplete: boolean;
  onboardingStep?: "mirror" | "why" | "environment" | "complete" | null;
  coachIntensity?: "hard" | "firm" | null;
  timezone?: string | null;
  whyStatement?: string | null;
  identityDeclaration?: string | null;
  forgeScore: number;
  xp: number;
  level: number;
  lsSubscriptionId?: string | null;
  lsVariantId?: string | null;
  lsCurrentPeriodEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  habitType: HabitType;
  targetFrequency: number;
  targetDays: number[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  localDate: string;
  completed: boolean;
  notes?: string | null;
  completionTime: string;
}

export interface HabitStreak {
  habitId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  updatedAt: string;
}

export interface DailyCheckin {
  id: string;
  userId: string;
  localDate: string;
  rawReflection: string;
  honestyScore: number | null;
  moodSignal: MoodSignal | null;
  aiResponse: string | null;
  forgeScoreDelta: number;
  onboardingMirror: boolean;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: ChallengeCategory;
  durationMinutes: number;
  xpReward: number;
  isActive: boolean;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  status: "active" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  reflection: string | null;
}

export interface CookieJarEntry {
  id: string;
  userId: string;
  title: string;
  description: string;
  dateOfVictory?: string | null;
  createdAt: string;
}

export interface ForgeScoreRecord {
  userId: string;
  score: number;
  recordedAt: string;
}

export interface XPEvent {
  id: string;
  userId: string;
  xpAmount: number;
  reason: string;
  eventType: XPEventType;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  badgeKey: BadgeKey;
  earnedAt: string;
}

export interface RuleFortyEvent {
  id: string;
  userId: string;
  triggeredBy: RuleFortyTrigger;
  habitId: string | null;
  choice: RuleFortyChoice;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CoachingSession {
  id: string;
  userId: string;
  sessionType: SessionType;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface UserMemory {
  id: string;
  userId: string;
  content: string;
  memoryType: MemoryType;
  sourceSessionId: string | null;
  createdAt: string;
}

// ── UI / Component helpers ─────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  name: string;
  currentLevelMin: number;
  nextLevelMin: number | null;
  progressPct: number;
}

export interface ForgeScoreBreakdown {
  streakConsistency: number;
  checkinHonesty: number;
  challengeCompletion: number;
  cookieJarGrowth: number;
  environmentImprovements: number;
  total: number;
}
