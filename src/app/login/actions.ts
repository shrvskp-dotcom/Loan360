"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login } from "@/lib/auth";

export type LoginState = { error?: "invalid" | "locked" | "missing" } | undefined;

const Schema = z.object({
  email: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(200),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = Schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "missing" };
  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.reason };
  redirect("/raadgiver");
}
