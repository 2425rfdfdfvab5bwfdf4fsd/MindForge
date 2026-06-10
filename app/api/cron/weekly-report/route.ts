import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  users,
  weeklyReports,
  dailyCheckins,
  habitCompletions,
  xpEvents,
  forgeScoreHistory,
  cookieJarEntries,
  habits,
  habitStreaks,
} from "@/shared/schema";
import { eq, and, gte, inArray, desc } from "drizzle-orm";
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

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      whyStatement: users.whyStatement,
      identityDeclaration: users.identityDeclaration,
      forgeScore: users.forgeScore,
    })
    .from(users)
    .where(
      and(
        eq(users.onboardingComplete, true),
        eq(users.isDeleted, false),
        inArray(users.tier, ["pro", "elite"])
      )
    );

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
    displayName: string | null;
    whyStatement: string | null;
    identityDeclaration: string | null;
    forgeScore: number;
  },
  week: { start: string; end: string; label: string },
  cutoff: Date
) {
  const weekCutoffStr = week.start;

  const [checkinRows, completionRows, xpRows, scoreRows, jarRows, habitRows, streakRows] =
    await Promise.all([
      db
        .select({ honestyScore: dailyCheckins.honestyScore })
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, user.id),
            eq(dailyCheckins.onboardingMirror, false),
            gte(dailyCheckins.localDate, weekCutoffStr)
          )
        ),

      db
        .select({ completed: habitCompletions.completed })
        .from(habitCompletions)
        .where(
          and(
            eq(habitCompletions.userId, user.id),
            gte(habitCompletions.localDate, weekCutoffStr),
            eq(habitCompletions.completed, true)
          )
        ),

      db
        .select({ xpAmount: xpEvents.xpAmount })
        .from(xpEvents)
        .where(
          and(eq(xpEvents.userId, user.id), gte(xpEvents.createdAt, cutoff))
        ),

      db
        .select({ score: forgeScoreHistory.score })
        .from(forgeScoreHistory)
        .where(
          and(
            eq(forgeScoreHistory.userId, user.id),
            gte(forgeScoreHistory.recordedAt, cutoff)
          )
        )
        .orderBy(forgeScoreHistory.recordedAt)
        .limit(1),

      db
        .select({ title: cookieJarEntries.title })
        .from(cookieJarEntries)
        .where(eq(cookieJarEntries.userId, user.id))
        .orderBy(desc(cookieJarEntries.createdAt))
        .limit(10),

      db
        .select({ id: habits.id, name: habits.name })
        .from(habits)
        .where(and(eq(habits.userId, user.id), eq(habits.isActive, true))),

      db
        .select({
          habitId: habitStreaks.habitId,
          currentStreak: habitStreaks.currentStreak,
        })
        .from(habitStreaks)
        .where(eq(habitStreaks.userId, user.id)),
    ]);

  const checkinCount = checkinRows.length;
  const habitsCompleted = completionRows.length;
  const xpEarned = xpRows.reduce((sum, r) => sum + r.xpAmount, 0);

  const weekStartScore = scoreRows[0]?.score ?? user.forgeScore;
  const forgeScoreChange = user.forgeScore - weekStartScore;
  const habitCompletionRate = Math.round(
    (habitsCompleted / Math.max(habitRows.length * 7, 1)) * 100
  );

  const topStreak = streakRows.sort((a, b) => b.currentStreak - a.currentStreak)[0];
  const topHabit = habitRows.find((h) => h.id === topStreak?.habitId);
  const bestStreakThisWeek = topHabit
    ? `${topHabit.name} — ${topStreak?.currentStreak ?? 0} days`
    : "";

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

  const [reportRow] = await db
    .insert(weeklyReports)
    .values({
      userId: user.id,
      weekStartDate: week.start,
      forgeScoreChange,
      habitCompletionRate,
      bestStreakThisWeek,
      behavioralArc: reportContent.behavioral_arc,
      keyInsight: reportContent.key_insight,
      nextWeekChallenge: reportContent.next_week_challenge,
      emailSent: false,
    })
    .returning();

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

  await db
    .update(weeklyReports)
    .set({ emailSent: true })
    .where(eq(weeklyReports.id, reportRow.id));
}
