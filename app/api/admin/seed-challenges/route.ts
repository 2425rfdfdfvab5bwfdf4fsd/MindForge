import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const CHALLENGES = [
  {
    id: "cold-shower-protocol",
    title: "Cold Shower Protocol",
    description:
      "End every shower with 60 seconds of cold water for 7 days straight. No warming back up. No exceptions. Cold exposure activates the noradrenergic system — this is a measurable intervention, not just discomfort.",
    difficulty: 1,
    category: "cold",
    durationMinutes: 10080,
    xpReward: 75,
    isActive: true,
  },
  {
    id: "phone-free-morning",
    title: "Phone-Free Morning",
    description:
      "No phone for the first 60 minutes after waking. Every day for 7 days. The morning cortisol spike is your highest-focus window. You are currently handing it to an algorithm.",
    difficulty: 1,
    category: "screen",
    durationMinutes: 10080,
    xpReward: 50,
    isActive: true,
  },
  {
    id: "no-complaint-protocol",
    title: "No Complaint Protocol",
    description:
      "Go an entire day without complaining — verbally or mentally. Restart if you slip. The point is not silence — it is rewiring the default toward agency.",
    difficulty: 1,
    category: "social",
    durationMinutes: 1440,
    xpReward: 50,
    isActive: true,
  },
  {
    id: "the-hard-conversation",
    title: "The Hard Conversation",
    description:
      "Have one difficult conversation you have been avoiding. Complete it within 48 hours. Name the conversation before you begin.",
    difficulty: 1,
    category: "social",
    durationMinutes: 2880,
    xpReward: 75,
    isActive: true,
  },
  {
    id: "5am-wake-protocol",
    title: "5AM Wake Protocol",
    description:
      "Wake at 5AM every day for 5 days. No snooze. Get out of bed immediately. You are not a morning person — you are a discipline person.",
    difficulty: 1,
    category: "physical",
    durationMinutes: 7200,
    xpReward: 75,
    isActive: true,
  },
  {
    id: "dopamine-detox-weekend",
    title: "Dopamine Detox Weekend",
    description:
      "No social media, no streaming, no alcohol, no junk food for 48 hours. Only books, exercise, and intentional work. This is a reset, not a punishment.",
    difficulty: 3,
    category: "screen",
    durationMinutes: 2880,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "10k-this-week",
    title: "10K This Week",
    description:
      "Run or walk 10 kilometers total within 7 days. Track every kilometer. No weather excuses — you have legs.",
    difficulty: 3,
    category: "physical",
    durationMinutes: 10080,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "cold-immersion-week",
    title: "Cold Immersion Week",
    description:
      "Cold shower every morning for 7 days. Minimum 90 seconds cold. No warm water beforehand — cold from the start.",
    difficulty: 3,
    category: "cold",
    durationMinutes: 10080,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "public-rejection-training",
    title: "Public Rejection Training",
    description:
      "Ask for something unreasonable in public 3 times this week — a discount, an impossible request. Train yourself to tolerate rejection. The fear is worse than the reality.",
    difficulty: 3,
    category: "social",
    durationMinutes: 10080,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "single-tasking-week",
    title: "Single-Tasking Week",
    description:
      "No multitasking for 7 days. One thing at a time. No phone while eating. No background noise while working. This is harder than it sounds.",
    difficulty: 3,
    category: "screen",
    durationMinutes: 10080,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "social-media-elimination",
    title: "Social Media Elimination",
    description:
      "Delete all social media apps for 14 days. Not muted — deleted. Reinstall after the 14 days if you choose. But experience the two weeks first.",
    difficulty: 3,
    category: "screen",
    durationMinutes: 20160,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "water-only-week",
    title: "Water-Only Week",
    description:
      "No coffee, no alcohol, no juice, no soda for 7 days. Water and herbal tea only. Identify which dependencies are habits vs. choices.",
    difficulty: 3,
    category: "fast",
    durationMinutes: 10080,
    xpReward: 100,
    isActive: true,
  },
  {
    id: "30-day-no-algorithm-feed",
    title: "30-Day No Algorithm Feed",
    description:
      "Delete all social media apps for 30 days. Keep a journal of what you do with the time instead. Most people discover they were using the apps to avoid something.",
    difficulty: 4,
    category: "screen",
    durationMinutes: 43200,
    xpReward: 150,
    isActive: true,
  },
  {
    id: "sleep-discipline-protocol",
    title: "Sleep Discipline Protocol",
    description:
      "In bed by 10:30PM, awake by 5:30AM, every day for 14 days. Non-negotiable. Track your HRV or subjective energy daily.",
    difficulty: 4,
    category: "physical",
    durationMinutes: 20160,
    xpReward: 150,
    isActive: true,
  },
  {
    id: "deliberate-discomfort-daily",
    title: "Deliberate Discomfort Daily",
    description:
      "Every day for 21 days, do one thing that makes you genuinely uncomfortable. Document it in your check-in. Comfort is the enemy of growth.",
    difficulty: 4,
    category: "physical",
    durationMinutes: 30240,
    xpReward: 150,
    isActive: true,
  },
  {
    id: "zero-complaint-month",
    title: "Zero Complaint Month",
    description:
      "30 days without a single complaint. Wear a rubber band on your wrist. Snap it every time you catch yourself complaining. Restart the count.",
    difficulty: 4,
    category: "social",
    durationMinutes: 43200,
    xpReward: 150,
    isActive: true,
  },
  {
    id: "one-meal-a-day-week",
    title: "One-Meal-a-Day Week",
    description:
      "Eat one meal per day for 7 days. This is not about weight — it is about learning that discomfort is not an emergency. Consult a physician if you have health conditions.",
    difficulty: 4,
    category: "fast",
    durationMinutes: 10080,
    xpReward: 150,
    isActive: true,
  },
  {
    id: "the-75-hard-protocol",
    title: "The 75 Hard Protocol",
    description:
      "Follow the Andy Frisella 75 Hard protocol for 75 days: two 45-minute workouts per day (one outdoor), diet, no alcohol, one gallon of water, 10 pages of nonfiction reading, progress photo. Restart from day 1 if you miss anything. This is the benchmark.",
    difficulty: 5,
    category: "physical",
    durationMinutes: 108000,
    xpReward: 200,
    isActive: true,
  },
  {
    id: "no-entertainment-month",
    title: "No Entertainment Month",
    description:
      "Zero passive entertainment for 30 days: no TV, no streaming, no social media, no gaming. Only creation, learning, work, and relationships. Most people discover who they are without the noise.",
    difficulty: 5,
    category: "screen",
    durationMinutes: 43200,
    xpReward: 200,
    isActive: true,
  },
  {
    id: "cold-water-protocol-21-days",
    title: "Cold Water Protocol — 21 Days",
    description:
      "Cold shower every morning, minimum 3 minutes cold, for 21 days. No exceptions for illness (reduce duration if sick, do not skip). Cold adaptation is neurological — you are literally rewiring your stress response.",
    difficulty: 5,
    category: "cold",
    durationMinutes: 30240,
    xpReward: 200,
    isActive: true,
  },
];

const ONE_TIME_TOKEN = "mf-seed-Xk9p2N7qR4mT6vW0";

async function runSeed() {
  const batch = adminDb.batch();
  for (const { id, ...data } of CHALLENGES) {
    batch.set(adminDb.collection("challenges").doc(id), data, { merge: true });
  }
  await batch.commit();
}

/** GET /api/admin/seed-challenges?token=<ONE_TIME_TOKEN>
 *  Visit this URL in a browser once to populate the challenges collection. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await runSeed();
    return NextResponse.json({
      ok: true,
      seeded: CHALLENGES.length,
      message: `Seeded ${CHALLENGES.length} challenges into Firestore.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/admin/seed-challenges  (header: x-seed-secret: <CRON_SECRET>) */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await runSeed();
    return NextResponse.json({
      ok: true,
      seeded: CHALLENGES.length,
      message: `Seeded ${CHALLENGES.length} challenges into Firestore.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
