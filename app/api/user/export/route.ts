import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = session.id;

  const [checkins, jarEntries, userHabits, completions, memories, badgesSnap] =
    await Promise.all([
      adminDb.collection("daily_checkins").where("userId", "==", uid).get(),
      adminDb.collection("cookie_jar_entries").where("userId", "==", uid).get(),
      adminDb.collection("habits").where("userId", "==", uid).get(),
      adminDb.collection("habit_completions").where("userId", "==", uid).get(),
      adminDb.collection("user_memories").where("userId", "==", uid).get(),
      adminDb.collection("users").doc(uid).collection("badges").get(),
    ]);

  function stripEmbedding(data: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { embedding: _emb, ...rest } = data;
    return rest;
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: uid,
    checkins: checkins.docs.map((d) => ({ id: d.id, ...d.data() })),
    cookieJar: jarEntries.docs.map((d) => ({ id: d.id, ...stripEmbedding(d.data()) })),
    habits: userHabits.docs.map((d) => ({ id: d.id, ...d.data() })),
    habitCompletions: completions.docs.map((d) => ({ id: d.id, ...d.data() })),
    memories: memories.docs.map((d) => ({ id: d.id, ...stripEmbedding(d.data()) })),
    badges: badgesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mindforge-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
