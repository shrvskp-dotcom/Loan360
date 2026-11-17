"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LANG_COOKIE } from "@/i18n";
import { audit } from "@/lib/audit";
import { destroySession, getSessionUser } from "@/lib/session";

export async function toggleLanguage(): Promise<void> {
  const store = await cookies();
  const next = store.get(LANG_COOKIE)?.value === "en" ? "da" : "en";
  store.set(LANG_COOKIE, next, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  // Bliv på samme side efter sprogskift.
  const referer = (await headers()).get("referer");
  let path = "/";
  try {
    if (referer) path = new URL(referer).pathname + new URL(referer).search;
  } catch {
    /* ugyldig referer – brug forsiden */
  }
  // Kun stier på eget domæne (ikke "//andet-domæne"), så knappen ikke kan misbruges til omdirigering.
  redirect(path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/");
}

export async function logout(): Promise<void> {
  const user = await getSessionUser();
  if (user) await audit({ action: "LOGOUT", actorUserId: user.id, bankId: user.bankId });
  await destroySession();
  redirect("/login");
}
