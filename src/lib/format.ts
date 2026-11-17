import type { Dict } from "@/i18n";

export function kr(t: Dict, n: number | null | undefined): string {
  if (n === null || n === undefined) return t.common.none;
  const v = new Intl.NumberFormat(t.locale).format(Math.round(n));
  return t.locale.startsWith("da") ? `${v} kr.` : `DKK ${v}`;
}

export function percent(t: Dict, x: number | null): string {
  if (x === null || !isFinite(x)) return t.common.none;
  return new Intl.NumberFormat(t.locale, { style: "percent", maximumFractionDigits: 1 }).format(x);
}

const TZ = "Europe/Copenhagen";

export function date(t: Dict, d: Date): string {
  return d.toLocaleDateString(t.locale, { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function time(t: Dict, d: Date): string {
  return d.toLocaleTimeString(t.locale, { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

function dayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "i dag kl. 10:24", "i går kl. 09:17" eller en dato. */
export function relative(t: Dict, d: Date, now = new Date()): string {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return `${t.common.today} ${t.common.at} ${time(t, d)}`;
  if (dayKey(d) === dayKey(y)) return `${t.common.yesterday} ${t.common.at} ${time(t, d)}`;
  return date(t, d);
}

export function daysSince(d: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
