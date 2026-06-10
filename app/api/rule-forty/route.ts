import { createClient } from "@/lib/supabase/server";
import { awardXP, XP_AMOUNTS } from "@/lib/xp";
import { checkFortyPercentSurvivor } from "@/lib/badges";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

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

  // Insert event
  const { error: insertError } = await supabase.from("rule_forty_events").insert({
    user_id: user.id,
    triggered_by,
    habit_id: habit_id ?? null,
    choice,
  });

  if (insertError) return new Response(insertError.message, { status: 500 });

  let xpResult = null;

  if (choice === "took_step") {
    // Award 15 XP — fire badge check in parallel
    const [xp] = await Promise.all([
      awardXP(
        supabase,
        user.id,
        XP_AMOUNTS.forty_percent,
        "40% Rule: took the step",
        "forty_percent"
      ),
      checkFortyPercentSurvivor(supabase, user.id),
    ]);
    xpResult = xp;
  }

  return Response.json({ ok: true, xp: xpResult });
}
