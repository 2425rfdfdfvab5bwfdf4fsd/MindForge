import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(users)
    .set({
      isDeleted: true,
      email: `deleted-${session.id}@deleted.mindforge`,
      displayName: "Deleted User",
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.id));

  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ deleted: true });
}
