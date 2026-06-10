import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, COOKIE_NAME } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await adminDb.collection("users").doc(session.id).update({
    isDeleted: true,
    email: `deleted-${session.id}@deleted.mindforge`,
    displayName: "Deleted User",
    updatedAt: new Date().toISOString(),
  });

  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ deleted: true });
}
