import { describe, expect, it } from "vitest";
import { type Actor, canViewCase } from "./access";

const theCase = { bankId: "bank-a", departmentId: "dept-1", advisorId: "advisor-1" };
const actor = (o: Partial<Actor>): Actor => ({ id: "x", role: "ADVISOR", bankId: "bank-a", departmentId: "dept-1", ...o });

describe("adgang til sager", () => {
  it("rådgiveren ser sin egen sag", () => {
    expect(canViewCase(actor({ id: "advisor-1", departmentId: "dept-2" }), theCase)).toBe(true);
  });

  it("kollega i samme afdeling ser sagen", () => {
    expect(canViewCase(actor({ id: "advisor-2" }), theCase)).toBe(true);
  });

  it("rådgiver i anden afdeling ser ikke sagen", () => {
    expect(canViewCase(actor({ id: "advisor-3", departmentId: "dept-2" }), theCase)).toBe(false);
  });

  it("bankadministrator ser alle bankens sager", () => {
    expect(canViewCase(actor({ role: "BANK_ADMIN", departmentId: null }), theCase)).toBe(true);
  });

  it("ingen ser sager i en anden bank", () => {
    expect(canViewCase(actor({ id: "advisor-1", bankId: "bank-b" }), theCase)).toBe(false);
    expect(canViewCase(actor({ role: "BANK_ADMIN", bankId: "bank-b" }), theCase)).toBe(false);
  });

  it("Lån360-administratorer ser aldrig sagsindhold", () => {
    expect(canViewCase(actor({ role: "PLATFORM_ADMIN", bankId: null, departmentId: null }), theCase)).toBe(false);
  });
});
