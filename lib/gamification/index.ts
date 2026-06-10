// Gamification — server-safe barrel export
// Client components: import from "@/lib/gamification/level" (no server-only deps)
// Server components/routers: import from specific files or this barrel

export { checkAndAwardBadge, checkMirrorGazer, checkCookieJarFounder, checkFortyPercentSurvivor, checkColdMind, BADGE_KEYS, type BadgeKey } from "./badges";
export { recalculateForgeScore } from "./forge-score";
export { LEVELS, getLevelFromXP, getLevelName, type LevelInfo } from "./level";
export { recalculateStreak } from "./streak";
export { awardXP, XP_AMOUNTS, type XPEventType, type AwardXPResult } from "./xp";
