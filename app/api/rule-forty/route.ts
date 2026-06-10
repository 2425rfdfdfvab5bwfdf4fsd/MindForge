import { getSessionFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { awardXP, XP_AMOUNTS } from "@/lib/gamification/xp";
import { checkFortyPercentSurvivor } from "@/lib/gamification/badges";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: {
    choice: "took_step" | "declined";
    triggered_by: "auto_habit" | "auto_checkin" | "manual";
    habit_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { choice, triggered_by, habit_id } = body;

  if (choice !== "took_step" && choice !== "declined") {
    return new Response("Invalid choice", { status: 400 });
  }
  if (!["auto_habit", "auto_checkin", "manual"].includes(triggered_by)) {
    return new Response("Invalid triggered_by", { status: 400 });
  }

  await adminDb.collection("rule_forty_events").add({
    userId: session.id,
    triggeredBy: triggered_by,
    habitId: habit_id ?? null,
    choice,
    createdAt: new Date().toISOString(),
  });

  let xpResult = null;
  if (choice === "took_step") {
    const [xp] = await Promise.all([
      awardXP(
        session.id,
        XP_AMOUNTS.forty_percent,
        "40% Rule: took the step",
        "forty_percent"
      ),
      checkFortyPercentSurvivor(session.id),
    ]);
    xpResult = xp;
  }

  return Response.json({ ok: true, xp: xpResult });
}
