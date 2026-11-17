/**
 * Lån360 – forretningsregler.
 *
 * Alt, der afgør hvilke dokumenter en sag kræver, hvornår et punkt tæller som modtaget,
 * og hvilken status en sag har, ligger her og kun her. Modulet er rent (ingen database,
 * ingen netværk), så reglerne kan testes direkte. Se docs/dokumentkatalog.md.
 */

export type Employment = "EMPLOYEE" | "SELF_EMPLOYED";

export type Purpose = "BUY" | "COOP" | "PRE_APPROVAL" | "REFINANCE" | "RENOVATION" | "EQUITY" | "OTHER";

/** De 11 punkter fra kataloget. */
export type CoreDocKey =
  | "D01_PERSONAL"
  | "D02_ACCOUNT_OVERVIEW"
  | "D03_STATEMENTS_12M"
  | "D04_PENSION"
  | "D05_PAYSLIPS_3"
  | "D06_TAX_ASSESSMENT"
  | "D07_TAX_INFO"
  | "D08_DEBT"
  | "D09_ID"
  | "D10_BUDGET"
  | "D11_ACCOUNTS_2Y";

/** Ekstra punkter for sagen. */
export type ExtraDocKey = "X_BBR" | "X_PURCHASE_AGREEMENT" | "X_GIFT_LETTER" | "X_OTHER";

export type DocKey = CoreDocKey | ExtraDocKey;

export type OptionalExtra = "X_PURCHASE_AGREEMENT" | "X_GIFT_LETTER" | "X_OTHER";

export type DocStatus =
  | "AUTO_FETCHED"
  | "UPLOADED"
  | "FILLED"
  | "AWAITING_CONSENT"
  | "MISSING"
  | "AWAITING_CUSTOMER"
  | "REJECTED";

export type CaseStage = "OPEN" | "CREDIT" | "CLOSED";

export type CaseStatus = "INVITED" | "COLLECTING" | "AWAITING_CUSTOMER" | "READY" | "CREDIT" | "CLOSED";

const PER_APPLICANT_COMMON: CoreDocKey[] = [
  "D01_PERSONAL",
  "D02_ACCOUNT_OVERVIEW",
  "D03_STATEMENTS_12M",
  "D04_PENSION",
  "D06_TAX_ASSESSMENT",
  "D07_TAX_INFO",
  "D08_DEBT",
  "D09_ID",
];

/**
 * Punkter, der kræves for én ansøger. Lønmodtagere får lønsedler (5) og aldrig regnskaber (11);
 * selvstændige får regnskaber (11) og aldrig lønsedler (5). Rækkefølgen følger kataloget.
 */
export function requiredForApplicant(employment: Employment): CoreDocKey[] {
  const extra: CoreDocKey = employment === "EMPLOYEE" ? "D05_PAYSLIPS_3" : "D11_ACCOUNTS_2Y";
  return [...PER_APPLICANT_COMMON, extra].sort(byCatalogOrder);
}

const ORDER: DocKey[] = [
  "D01_PERSONAL",
  "D02_ACCOUNT_OVERVIEW",
  "D03_STATEMENTS_12M",
  "D04_PENSION",
  "D05_PAYSLIPS_3",
  "D06_TAX_ASSESSMENT",
  "D07_TAX_INFO",
  "D08_DEBT",
  "D09_ID",
  "D10_BUDGET",
  "D11_ACCOUNTS_2Y",
  "X_BBR",
  "X_PURCHASE_AGREEMENT",
  "X_GIFT_LETTER",
  "X_OTHER",
];

export function byCatalogOrder(a: DocKey, b: DocKey): number {
  return ORDER.indexOf(a) - ORDER.indexOf(b);
}

/** Formål, hvor der er en konkret ejendom (og dermed BBR-data). */
export function purposeHasProperty(purpose: Purpose): boolean {
  return purpose !== "PRE_APPROVAL" && purpose !== "OTHER";
}

/** Formål, hvor kunden køber, og der derfor er købspris og udbetaling. */
export function isPurchase(purpose: Purpose): boolean {
  return purpose === "BUY" || purpose === "COOP" || purpose === "PRE_APPROVAL";
}

export interface RequirementInput {
  purpose: Purpose;
  propertyAddress?: string | null;
  applicants: { employment: Employment }[];
  extras: OptionalExtra[];
}

export interface Requirement {
  /** Indeks i ansøgerlisten, eller null for punkter, der er fælles for sagen. */
  applicantIndex: number | null;
  docKey: DocKey;
}

/** Alle punkter en sag kræver: per ansøger + fælles for sagen. */
export function caseRequirements(input: RequirementInput): Requirement[] {
  if (input.applicants.length < 1 || input.applicants.length > 2) {
    throw new Error("En sag skal have 1 eller 2 ansøgere");
  }
  const out: Requirement[] = [];
  input.applicants.forEach((a, i) => {
    for (const docKey of requiredForApplicant(a.employment)) out.push({ applicantIndex: i, docKey });
  });
  out.push({ applicantIndex: null, docKey: "D10_BUDGET" });
  if (purposeHasProperty(input.purpose) && input.propertyAddress?.trim()) {
    out.push({ applicantIndex: null, docKey: "X_BBR" });
  }
  for (const x of [...new Set(input.extras)].sort(byCatalogOrder)) out.push({ applicantIndex: null, docKey: x });
  return out;
}

export function isReceived(status: DocStatus): boolean {
  return status === "AUTO_FETCHED" || status === "UPLOADED" || status === "FILLED";
}

export interface Progress {
  received: number;
  total: number;
  missing: number;
  percent: number;
}

export function progress(statuses: DocStatus[]): Progress {
  const total = statuses.length;
  const received = statuses.filter(isReceived).length;
  return { received, total, missing: total - received, percent: total ? Math.round((received / total) * 100) : 0 };
}

export interface StatusInput {
  stage: CaseStage;
  documentStatuses: DocStatus[];
  applicants: { identifiedAt: Date | null; submittedAt: Date | null }[];
}

/**
 * Sagens status, som rådgiver, kunde og systemejer alle ser den.
 * Rækkefølgen af tjek er vigtig: en sag i kreditvurdering er altid "CREDIT", uanset dokumenter.
 */
export function caseStatus(input: StatusInput): CaseStatus {
  if (input.stage === "CLOSED") return "CLOSED";
  if (input.stage === "CREDIT") return "CREDIT";
  if (progress(input.documentStatuses).missing === 0) return "READY";
  if (!input.applicants.some((a) => a.identifiedAt)) return "INVITED";
  const anyRejected = input.documentStatuses.includes("REJECTED");
  const allSubmitted = input.applicants.every((a) => a.submittedAt);
  if (anyRejected || allSubmitted) return "AWAITING_CUSTOMER";
  return "COLLECTING";
}

/** En sag kan kun sendes til kreditvurdering, når alle krævede punkter er modtaget. */
export function canSendToCredit(stage: CaseStage, statuses: DocStatus[]): boolean {
  return stage === "OPEN" && statuses.length > 0 && progress(statuses).missing === 0;
}

/** Lovkrav: udbetaling på mindst 5 % af købsprisen. Beløb i hele kroner. */
export const MIN_DOWN_PAYMENT_SHARE = 0.05;

export function downPaymentShare(price: number, downPayment: number): number | null {
  if (!(price > 0)) return null;
  return downPayment / price;
}

export function meetsDownPaymentRequirement(price: number, downPayment: number): boolean {
  const share = downPaymentShare(price, downPayment);
  return share !== null && share >= MIN_DOWN_PAYMENT_SHARE;
}

/** Validerer et CPR-nummer i formatet ddmmåå-xxxx eller ddmmååxxxx (format og dato, ikke modulus 11). */
export function normalizeCpr(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 10) return null;
  const dd = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

/** Maskeret CPR til visning: ddmmåå-XXXX. */
export function maskCpr(normalized: string): string {
  return `${normalized.slice(0, 6)}-XXXX`;
}

export function isValidCvr(input: string): boolean {
  return /^\d{8}$/.test(input.trim());
}
