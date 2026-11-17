import "server-only";
import { cookies } from "next/headers";
import { da } from "./da";
import { en } from "./en";

export type Lang = "da" | "en";
export const LANG_COOKIE = "l360_lang";
export type Dict = typeof da;

export async function getLang(): Promise<Lang> {
  return (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "da";
}

export async function getDict(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: lang === "en" ? en : da };
}
