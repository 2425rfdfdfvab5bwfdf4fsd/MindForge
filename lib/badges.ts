// All 6 PRD v1 badges — badge_key values must match user_badges.badge_key CHECK constraint

export const BADGE_KEYS = [
  "identity_locked",
  "mirror_gazer",
  "cookie_jar_founder",
  "forty_percent_survivor",
  "cold_mind",
  "tempered",
] as const;

export type BadgeKey = (typeof BADGE_KEYS)[number];

// ---------------------------------------------------------------------------
// Core: idempotent badge award — no XP, no side effects beyond the insert
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAndAwardBadge(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  badgeKey: BadgeKey
): Promise<{ awarded: boolean }> {
  // Check if already awarded
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_key", badgeKey)
    .maybeSingle();

  if (existing) return { awarded: false };

  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_key: badgeKey,
  });

  // Unique constraint violation means race condition — badge was just awarded
  if (error && error.code === "23505") return { awarded: false };
  if (error) throw error;

  return { awarded: true };
}

// ---------------------------------------------------------------------------
// Trigger-site helpers — call these from the relevant router/route
// ---------------------------------------------------------------------------

/**
 * 'mirror_gazer' — 30 consecutive days of daily check-ins.
 * Call from checkins.submit after insert succeeds.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkMirrorGazer(supabase: any, userId: string): Promise<void> {
  // Fetch the last 30 days of non-onboarding checkins
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data } = await supabase
    .from("daily_checkins")
    .select("local_date")
    .eq("user_id", userId)
    .eq("onboarding_mirror", false)
    .gte("local_date", thirtyDaysAgo)
    .order("local_date", { ascending: false });

  if (!data || data.length < 30) return;

  // Verify they are 30 consecutive calendar days
  const dates = new Set((data as Array<{ local_date: string }>).map((r) => r.local_date));
  const today = new Date();
  let consecutive = true;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (!dates.has(key)) { consecutive = false; break; }
  }

  if (consecutive) {
    await checkAndAwardBadge(supabase, userId, "mirror_gazer");
  }
}

/**
 * 'cookie_jar_founder' — 10+ cookie jar entries.
 * Call from cookiejar.add after insert succeeds.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkCookieJarFounder(supabase: any, userId: string): Promise<void> {
  const { count } = await supabase
    .from("cookie_jar_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= 10) {
    await checkAndAwardBadge(supabase, userId, "cookie_jar_founder");
  }
}

/**
 * 'forty_percent_survivor' — selected "I'll take that step" 5+ times.
 * Call from rule_forty_events insert when choice='took_step'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkFortyPercentSurvivor(supabase: any, userId: string): Promise<void> {
  const { count } = await supabase
    .from("rule_forty_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("choice", "took_step");

  if ((count ?? 0) >= 5) {
    await checkAndAwardBadge(supabase, userId, "forty_percent_survivor");
  }
}

/**
 * 'cold_mind' — 7+ cold-category challenges completed (lifetime).
 * Call from challenges.complete after status='completed'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkColdMind(supabase: any, userId: string): Promise<void> {
  const { count } = await supabase
    .from("user_challenges")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .in(
      "challenge_id",
      (
        await supabase
          .from("challenges")
          .select("id")
          .eq("category", "cold")
          .eq("is_active", true)
      ).data?.map((c: { id: string }) => c.id) ?? []
    );

  if ((count ?? 0) >= 7) {
    await checkAndAwardBadge(supabase, userId, "cold_mind");
  }
}
