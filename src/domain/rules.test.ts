import { describe, expect, it } from "vitest";
import {
  canSendToCredit,
  caseRequirements,
  caseStatus,
  type DocStatus,
  type Employment,
  maskCpr,
  meetsDownPaymentRequirement,
  normalizeCpr,
  progress,
  requiredForApplicant,
} from "./rules";

const keysFor = (applicants: Employment[], extra: Partial<Parameters<typeof caseRequirements>[0]> = {}) =>
  caseRequirements({
    purpose: "BUY",
    propertyAddress: "Bakkevej 9",
    extras: [],
    applicants: applicants.map((employment) => ({ employment })),
    ...extra,
  });

describe("dokumentkrav per ansøger", () => {
  it("lønmodtager får lønsedler og aldrig regnskaber", () => {
    const r = requiredForApplicant("EMPLOYEE");
    expect(r).toContain("D05_PAYSLIPS_3");
    expect(r).not.toContain("D11_ACCOUNTS_2Y");
    expect(r).toHaveLength(9);
  });

  it("selvstændig får regnskaber og aldrig lønsedler", () => {
    const r = requiredForApplicant("SELF_EMPLOYED");
    expect(r).toContain("D11_ACCOUNTS_2Y");
    expect(r).not.toContain("D05_PAYSLIPS_3");
    expect(r).toHaveLength(9);
  });

  it("kontoudtog (12 mdr.) kræves altid", () => {
    expect(requiredForApplicant("EMPLOYEE")).toContain("D03_STATEMENTS_12M");
    expect(requiredForApplicant("SELF_EMPLOYED")).toContain("D03_STATEMENTS_12M");
  });
});

describe("alle fem ansøgerkombinationer", () => {
  const combos: [string, Employment[]][] = [
    ["lønmodtager alene", ["EMPLOYEE"]],
    ["selvstændig alene", ["SELF_EMPLOYED"]],
    ["to lønmodtagere", ["EMPLOYEE", "EMPLOYEE"]],
    ["selvstændig + lønmodtager", ["SELF_EMPLOYED", "EMPLOYEE"]],
    ["to selvstændige", ["SELF_EMPLOYED", "SELF_EMPLOYED"]],
  ];

  it.each(combos)("%s: punkt 5 og 11 følger hver ansøgers type", (_name, types) => {
    const reqs = keysFor(types);
    types.forEach((t, i) => {
      const mine = reqs.filter((r) => r.applicantIndex === i).map((r) => r.docKey);
      expect(mine.includes("D05_PAYSLIPS_3")).toBe(t === "EMPLOYEE");
      expect(mine.includes("D11_ACCOUNTS_2Y")).toBe(t === "SELF_EMPLOYED");
      expect(mine).toHaveLength(9);
    });
  });

  it.each(combos)("%s: budget og BBR kræves én gang for sagen", (_name, types) => {
    const shared = keysFor(types).filter((r) => r.applicantIndex === null).map((r) => r.docKey);
    expect(shared).toEqual(["D10_BUDGET", "X_BBR"]);
  });

  it("afviser 0 og 3 ansøgere", () => {
    expect(() => keysFor([])).toThrow();
    expect(() => keysFor(["EMPLOYEE", "EMPLOYEE", "EMPLOYEE"])).toThrow();
  });
});

describe("fælles punkter", () => {
  it("ingen BBR ved købsbevis eller uden adresse", () => {
    expect(keysFor(["EMPLOYEE"], { purpose: "PRE_APPROVAL" }).some((r) => r.docKey === "X_BBR")).toBe(false);
    expect(keysFor(["EMPLOYEE"], { propertyAddress: "  " }).some((r) => r.docKey === "X_BBR")).toBe(false);
  });

  it("valgfrie ekstra punkter tilføjes én gang i katalogrækkefølge", () => {
    const shared = keysFor(["EMPLOYEE"], { extras: ["X_GIFT_LETTER", "X_PURCHASE_AGREEMENT", "X_GIFT_LETTER"] })
      .filter((r) => r.applicantIndex === null)
      .map((r) => r.docKey);
    expect(shared).toEqual(["D10_BUDGET", "X_BBR", "X_PURCHASE_AGREEMENT", "X_GIFT_LETTER"]);
  });
});

describe("fremdrift og status", () => {
  const applicants = [{ identifiedAt: new Date(), submittedAt: null }];

  it("tæller kun hentet, uploadet og udfyldt som modtaget", () => {
    const p = progress(["AUTO_FETCHED", "UPLOADED", "FILLED", "MISSING", "REJECTED", "AWAITING_CONSENT"]);
    expect(p).toEqual({ received: 3, total: 6, missing: 3, percent: 50 });
  });

  it("invitation sendt, når ingen har logget ind", () => {
    expect(
      caseStatus({ stage: "OPEN", documentStatuses: ["AWAITING_CUSTOMER"], applicants: [{ identifiedAt: null, submittedAt: null }] }),
    ).toBe("INVITED");
  });

  it("indsamler data, når kunden er i gang", () => {
    expect(caseStatus({ stage: "OPEN", documentStatuses: ["AUTO_FETCHED", "MISSING"], applicants })).toBe("COLLECTING");
  });

  it("afventer kunde ved afvist dokument", () => {
    expect(caseStatus({ stage: "OPEN", documentStatuses: ["AUTO_FETCHED", "REJECTED"], applicants })).toBe("AWAITING_CUSTOMER");
  });

  it("klar til vurdering, når alt er modtaget", () => {
    expect(caseStatus({ stage: "OPEN", documentStatuses: ["AUTO_FETCHED", "UPLOADED"], applicants })).toBe("READY");
  });

  it("kreditvurdering og afsluttet vinder over dokumentstatus", () => {
    expect(caseStatus({ stage: "CREDIT", documentStatuses: ["MISSING"], applicants })).toBe("CREDIT");
    expect(caseStatus({ stage: "CLOSED", documentStatuses: ["MISSING"], applicants })).toBe("CLOSED");
  });

  it("kan kun sendes til kreditvurdering, når alt er modtaget", () => {
    const all: DocStatus[] = ["AUTO_FETCHED", "FILLED"];
    expect(canSendToCredit("OPEN", all)).toBe(true);
    expect(canSendToCredit("OPEN", [...all, "MISSING"])).toBe(false);
    expect(canSendToCredit("CREDIT", all)).toBe(false);
    expect(canSendToCredit("OPEN", [])).toBe(false);
  });
});

describe("lovkrav og formater", () => {
  it("udbetaling mindst 5 %", () => {
    expect(meetsDownPaymentRequirement(3_000_000, 150_000)).toBe(true);
    expect(meetsDownPaymentRequirement(3_000_000, 149_999)).toBe(false);
    expect(meetsDownPaymentRequirement(0, 0)).toBe(false);
  });

  it("CPR normaliseres og maskeres", () => {
    expect(normalizeCpr("0301851234")).toBe("030185-1234");
    expect(normalizeCpr("030185-1234")).toBe("030185-1234");
    expect(normalizeCpr("320185-1234")).toBeNull();
    expect(normalizeCpr("12345")).toBeNull();
    expect(maskCpr("030185-1234")).toBe("030185-XXXX");
  });
});
