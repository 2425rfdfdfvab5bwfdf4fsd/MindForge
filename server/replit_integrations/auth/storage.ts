import { users } from "@/shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export type User = typeof users.$inferSelect;
export type UpsertUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const displayName =
      userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`.trim()
        : userData.firstName ?? userData.lastName ?? null;

    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        displayName,
        avatarUrl: userData.profileImageUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          displayName,
          avatarUrl: userData.profileImageUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
