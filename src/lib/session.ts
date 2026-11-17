import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db/client";
import type { Actor, Role } from "@/domain/access";
import { randomToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "l360_session";
/** En arbejdsdag. Herefter skal rådgiveren logge ind igen. */
const SESSION_HOURS = 8;

export interface SessionUser extends Actor {
  name: string;
  email: string;
  title: string | null;
  role: Role;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await db.insert(schema.sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      title: schema.users.title,
      role: schema.users.role,
      bankId: schema.users.bankId,
      departmentId: schema.users.departmentId,
      active: schema.users.active,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  return row;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha256(token)));
  store.delete(SESSION_COOKIE);
}
