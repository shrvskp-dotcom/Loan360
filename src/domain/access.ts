/**
 * Adgangsregler: hvem må se hvilke sager. Rent modul, testet i access.test.ts.
 *
 * - Rådgivere ser egne sager og kollegers sager i samme afdeling (så de kan dække for hinanden).
 * - Bankadministratorer ser alle sager i egen bank.
 * - Lån360-administratorer ser aldrig sagsindhold med persondata (kun driftsdata andre steder).
 * - Ingen ser sager på tværs af banker.
 */

export type Role = "ADVISOR" | "BANK_ADMIN" | "PLATFORM_ADMIN";

export interface Actor {
  id: string;
  role: Role;
  bankId: string | null;
  departmentId: string | null;
}

export interface CaseScope {
  bankId: string;
  departmentId: string;
  advisorId: string;
}

export function canViewCase(actor: Actor, c: CaseScope): boolean {
  if (actor.role === "PLATFORM_ADMIN") return false;
  if (!actor.bankId || actor.bankId !== c.bankId) return false;
  if (actor.role === "BANK_ADMIN") return true;
  return c.advisorId === actor.id || (actor.departmentId !== null && actor.departmentId === c.departmentId);
}

export function canEditCase(actor: Actor, c: CaseScope): boolean {
  return canViewCase(actor, c);
}
