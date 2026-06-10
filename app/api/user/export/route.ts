import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import {
  dailyCheckins,
  cookieJarEntries,
  habits,
  habitCompletions,
  userMemories,
  userBadges,
} from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [checkins, jarEntries, userHabits, completions, memories, badges] =
    await Promise.all([
      db.select().from(dailyCheckins).where(eq(dailyCheckins.userId, session.id)),
      db.select().from(cookieJarEntries).where(eq(cookieJarEntries.userId, session.id)),
      db.select().from(habits).where(eq(habits.userId, session.id)),
      db.select().from(habitCompletions).where(eq(habitCompletions.userId, session.id)),
      db.select().from(userMemories).where(eq(userMemories.userId, session.id)),
      db.select().from(userBadges).where(eq(userBadges.userId, session.id)),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: session.id,
    checkins,
    cookieJar: jarEntries,
    habits: userHabits,
    habitCompletions: completions,
    memories,
    badges,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mindforge-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
