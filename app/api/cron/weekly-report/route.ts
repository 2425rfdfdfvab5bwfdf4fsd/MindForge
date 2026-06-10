import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WeeklyNeuralReport } from "@/emails/WeeklyNeuralReport";

const BATCH_SIZE = 50;

function getWeekRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    label: `${fmt(start)} — ${fmt(end)}`,
  };
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = getWeekRange();
  const cutoff = new Date(week.start + "T00:00:00");

  const eligibleSnap = await adminDb
    .collection("users")
    .where("onboardingComplete", "==", true)
    .where("isDeleted", "==", false)
    .get();

  const eligibleUsers = eligibleSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as {
      id: string;
      email: string;
      displayName?: string | null;
      whyStatement?: string | null;
      identityDeclaration?: string | null;
      forgeScore: number;
      tier: string;
    }))
    .filter((u) => u.tier === "pro" || u.tier === "elite");

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
    const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

    for (const user of batch) {
      try {
        await processUser(user, week, cutoff);
        processed++;
      } catch (err) {
        console.error(`Weekly report failed for user ${user.id}:`, err);
        failed++;
      }

      if (batch.indexOf(user) < batch.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  return NextResponse.json({ processed, failed });
}

async function processUser(
  user: {
    id: string;
    email: string;
    displayName?: string | null;
    whyStatement?: string | null;
    identityDeclaration?: string | null;
    forgeScore: number;
  },
  week: { start: string; end: string; label: string },
  cutoff: Date
) {
  const weekCutoffStr = week.start;

  const [checkinSnap, completionSnap, xpSnap, scoreSnap, jarSnap, habitSnap, streakSnap] =
    await Promise.all([
      adminDb
        .collection("daily_checkins")
        .where("userId", "==", user.id)
        .where("onboardingMirror", "==", false)
        .where("localDate", ">=", weekCutoffStr)
        .get(),

      adminDb
        .collection("habit_completions")
        .where("userId", "==", user.id)
        .where("localDate", ">=", weekCutoffStr)
        .where("completed", "==", true)
        .get(),

      adminDb
        .collection("xp_events")
        .where("userId", "==", user.id)
        .where("createdAt", ">=", cutoff.toISOString())
        .get(),

      adminDb
        .collection("forge_score_history")
        .where("userId", "==", user.id)
        .where("recordedAt", ">=", cutoff.toISOString())
        .orderBy("recordedAt")
        .limit(1)
        .get(),

      adminDb
        .collection("cookie_jar_entries")
        .where("userId", "==", user.id)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get(),

      adminDb
        .collection("habits")
        .where("userId", "==", user.id)
        .where("isActive", "==", true)
        .get(),

      adminDb
        .collection("habit_streaks")
        .where("userId", "==", user.id)
        .get(),
    ]);

  const checkinCount = checkinSnap.size;
  const habitsCompleted = completionSnap.size;
  const xpEarned = xpSnap.docs.reduce(
    (sum, d) => sum + (d.data().xpAmount as number ?? 0),
    0
  );

  const weekStartScore = scoreSnap.docs[0]?.data().score ?? user.forgeScore;
  const forgeScoreChange = user.forgeScore - weekStartScore;

  const habitRows = habitSnap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
  const habitCompletionRate = Math.round(
    (habitsCompleted / Math.max(habitRows.length * 7, 1)) * 100
  );

  const streakRows = streakSnap.docs.map((d) => ({
    habitId: d.data().habitId as string,
    currentStreak: d.data().currentStreak as number,
  }));
  const topStreak = [...streakRows].sort((a, b) => b.currentStreak - a.currentStreak)[0];
  const topHabit = habitRows.find((h) => h.id === topStreak?.habitId);
  const bestStreakThisWeek = topHabit
    ? `${topHabit.name} — ${topStreak?.currentStreak ?? 0} days`
    : "";

  const jarRows = jarSnap.docs.map((d) => ({ title: d.data().title as string }));
  const randomJarEntry =
    jarRows.length > 0
      ? jarRows[Math.floor(Math.random() * jarRows.length)]
      : null;

  const weekData = {
    checkinCount,
    habitsCompleted,
    xpEarned,
    forgeScoreChange,
    habitCompletionRate,
    bestStreak: bestStreakThisWeek,
    currentForgeScore: user.forgeScore,
  };

  let reportContent = {
    behavioral_arc:
      "This week you showed up. That's the foundation. Consistency across small moments compounds into the person you're trying to become.",
    key_insight:
      "Every check-in is a vote for the identity you're building. You cast those votes this week.",
    next_week_challenge:
      "Pick your hardest habit and complete it first every day next week, before anything else.",
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const prompt = `Generate a weekly neural report for this MindForge user based on their week's data.

Week Data: ${JSON.stringify(weekData)}
Why Statement: ${user.whyStatement ?? "Not set"}
Identity Declaration: ${user.identityDeclaration ?? "Not set"}

Return only valid JSON (no markdown):
{
  "behavioral_arc": "2-3 sentence AI-generated narrative of the week's behavioral pattern. Honest. Specific. No fluff.",
  "key_insight": "One specific honest observation about this week. Bold truth.",
  "next_week_challenge": "One specific action challenge for next week. Concrete and uncomfortable."
}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
      });
      const parsed = JSON.parse(result.response.text().trim());
      reportContent = {
        behavioral_arc: parsed.behavioral_arc ?? reportContent.behavioral_arc,
        key_insight: parsed.key_insight ?? reportContent.key_insight,
        next_week_challenge:
          parsed.next_week_challenge ?? reportContent.next_week_challenge,
      };
    } catch {
      // use fallback content
    }
  }

  const reportRef = await adminDb.collection("weekly_reports").add({
    userId: user.id,
    weekStartDate: week.start,
    forgeScoreChange,
    habitCompletionRate,
    bestStreakThisWeek,
    behavioralArc: reportContent.behavioral_arc,
    keyInsight: reportContent.key_insight,
    nextWeekChallenge: reportContent.next_week_challenge,
    emailSent: false,
    createdAt: new Date().toISOString(),
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindforge.app";

  const html = await render(
    WeeklyNeuralReport({
      displayName: user.displayName ?? undefined,
      weekRange: week.label,
      forgeScore: user.forgeScore,
      forgeScoreChange,
      checkinCount,
      habitsCompleted,
      xpEarned,
      behavioralArc: reportContent.behavioral_arc,
      keyInsight: reportContent.key_insight,
      bestStreakThisWeek,
      nextWeekChallenge: reportContent.next_week_challenge,
      cookieJarTitle: randomJarEntry?.title,
      appUrl: `${appUrl}/dashboard`,
      unsubscribeUrl: `${appUrl}/settings`,
    })
  );

  await resend.emails.send({
    from: "MindForge <forge@mindforge.app>",
    to: user.email,
    subject: `Your Weekly Neural Report — ${week.label}`,
    html,
  });

  await reportRef.update({ emailSent: true });
}
