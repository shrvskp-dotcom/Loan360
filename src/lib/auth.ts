import "server-only";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db/client";
import { audit } from "./audit";
import { createSession, getSessionUser, type SessionUser } from "./session";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
// Bruges, når e-mailen ikke findes, så svartiden ikke afslører om en konto eksisterer.
const DUMMY_HASH = "$2b$12$Ma11K7L5VBZQMljWCYaVg.cRPINZK3ggE/e4dWO.tr0nArdF5j.9.";

export type LoginResult = { ok: true } | { ok: false; reason: "invalid" | "locked" };

export async function login(email: string, password: string): Promise<LoginResult> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);

  if (!user || !user.active) {
    await bcrypt.compare(password, DUMMY_HASH);
    await audit({ action: "LOGIN_FAILED", details: { reason: "unknown_or_inactive" } });
    return { ok: false, reason: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ action: "LOGIN_LOCKED", actorUserId: user.id, bankId: user.bankId });
    return { ok: false, reason: "locked" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLogins + 1;
    const lock = failed >= MAX_FAILED;
    await db
      .update(schema.users)
      .set({ failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null })
      .where(eq(schema.users.id, user.id));
    await audit({ action: lock ? "LOGIN_LOCKED" : "LOGIN_FAILED", actorUserId: user.id, bankId: user.bankId, details: { attempt: failed } });
    return { ok: false, reason: lock ? "locked" : "invalid" };
  }

  await db
    .update(schema.users)
    .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await createSession(user.id);
  await audit({ action: "LOGIN_SUCCESS", actorUserId: user.id, bankId: user.bankId });
  return { ok: true };
}

/** Kræver en indlogget bankbruger. Bruges øverst i alle rådgiversider og -handlinger. */
export async function requireBankUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "PLATFORM_ADMIN" || !user.bankId) redirect("/login?fejl=rolle");
  return user;
}
