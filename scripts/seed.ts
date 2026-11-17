/**
 * Fiktive demodata, der spejler prototypen (docs/prototype/prototype.html).
 * Alle personer, CPR-numre, banker og adresser er opdigtede.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as s from "../src/db/schema";
import { encrypt } from "../src/lib/crypto";
import {
  caseRequirements,
  type DocKey,
  type DocStatus,
  type Employment,
  type OptionalExtra,
  type Purpose,
  maskCpr,
} from "../src/domain/rules";

const DEMO_PASSWORD = "Demo1234!";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: s });

const daysAgo = (d: number, hour = 10, minute = 0) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(hour, minute, 0, 0);
  return x;
};

/** Hvor langt en ansøger er nået i kundeflowet. */
type Progress = "none" | "started" | "full";

const AUTO: DocKey[] = ["D02_ACCOUNT_OVERVIEW", "D03_STATEMENTS_12M", "D04_PENSION", "D06_TAX_ASSESSMENT", "D07_TAX_INFO", "D08_DEBT", "D09_ID"];
const SOURCE: Partial<Record<DocKey, string>> = {
  D01_PERSONAL: "CPR_MITID_CUSTOMER",
  D02_ACCOUNT_OVERVIEW: "OPEN_BANKING",
  D03_STATEMENTS_12M: "OPEN_BANKING",
  D04_PENSION: "PENSIONSINFO",
  D05_PAYSLIPS_3: "CUSTOMER_UPLOAD",
  D06_TAX_ASSESSMENT: "SKAT",
  D07_TAX_INFO: "SKAT",
  D08_DEBT: "SKAT",
  D09_ID: "MITID",
  D10_BUDGET: "CUSTOMER_FORM",
  D11_ACCOUNTS_2Y: "CUSTOMER_UPLOAD_CVR",
  X_BBR: "BBR",
  X_PURCHASE_AGREEMENT: "CUSTOMER_UPLOAD",
  X_GIFT_LETTER: "CUSTOMER_UPLOAD",
  X_OTHER: "CUSTOMER_UPLOAD",
};

function statusFor(doc: DocKey, p: Progress): DocStatus {
  if (p === "none") return "AWAITING_CUSTOMER";
  if (AUTO.includes(doc)) return "AUTO_FETCHED";
  if (p === "full") return doc === "D01_PERSONAL" ? "FILLED" : "UPLOADED";
  return "MISSING";
}

interface ApplicantSeed {
  first: string;
  last: string;
  cpr: string;
  employment: Employment;
  progress: Progress;
  company?: string;
  cvr?: string;
  relation?: string;
  doneDaysAgo?: number;
}

interface CaseSeed {
  advisor: string;
  created: number;
  purpose: Purpose;
  propertyType: (typeof s.propertyTypeEnum.enumValues)[number];
  price?: number;
  downPayment?: number;
  loanAmount?: number;
  address?: [string, string, string];
  takeover?: string;
  notes?: string;
  summary?: string;
  broker?: [string, string, string];
  extras?: OptionalExtra[];
  stage?: "OPEN" | "CREDIT" | "CLOSED";
  applicants: ApplicantSeed[];
  rejected?: { applicant: number; doc: DocKey; reason: string };
  home: [string, string, string];
}

let caseSeq = 7840;

async function main() {
  console.log("Opretter demobanker …");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const bankRows = await db
    .insert(s.banks)
    .values([{ name: "Nordvig Bank" }, { name: "Sydkyst Sparekasse" }, { name: "Realkredit Fyn" }])
    .returning();
  const bank = Object.fromEntries(bankRows.map((b) => [b.name, b.id]));

  const deptRows = await db
    .insert(s.departments)
    .values([
      { bankId: bank["Nordvig Bank"], name: "Roskilde" },
      { bankId: bank["Nordvig Bank"], name: "Køge" },
      { bankId: bank["Sydkyst Sparekasse"], name: "Aarhus C" },
      { bankId: bank["Sydkyst Sparekasse"], name: "Odense" },
      { bankId: bank["Realkredit Fyn"], name: "København K" },
    ])
    .returning();
  const dept = Object.fromEntries(deptRows.map((d) => [d.name, d]));

  const advisorSeeds = [
    ["Mette Lund", "mette.lund@nordvigbank.example", "Roskilde", "+45 70 10 20 31"],
    ["Jonas Krogh", "jonas.krogh@nordvigbank.example", "Roskilde", "+45 70 10 20 32"],
    ["Sara Holm", "sara.holm@nordvigbank.example", "Køge", "+45 70 10 20 41"],
    ["Ali Demir", "ali.demir@sydkyst.example", "Aarhus C", "+45 70 20 30 11"],
    ["Line Bech", "line.bech@sydkyst.example", "Odense", "+45 70 20 30 21"],
    ["Peter Vang", "peter.vang@realkreditfyn.example", "København K", "+45 70 30 40 11"],
    ["Nadia Rask", "nadia.rask@realkreditfyn.example", "København K", "+45 70 30 40 12"],
  ] as const;
  const userRows = await db
    .insert(s.users)
    .values(
      advisorSeeds.map(([name, email, d, phone]) => ({
        name,
        email,
        phone,
        title: "Privatrådgiver",
        departmentId: dept[d].id,
        bankId: dept[d].bankId,
        role: "ADVISOR" as const,
        passwordHash,
      })),
    )
    .returning();
  await db.insert(s.users).values([
    { name: "Bente Admin", email: "admin@nordvigbank.example", title: "Kreditchef", bankId: bank["Nordvig Bank"], role: "BANK_ADMIN", passwordHash },
    { name: "Lån360 Support", email: "support@laan360.example", title: "Support", role: "PLATFORM_ADMIN", passwordHash },
  ]);
  const advisor = Object.fromEntries(userRows.map((u) => [u.name, u]));

  const seeds: CaseSeed[] = [
    {
      advisor: "Mette Lund", created: 6, purpose: "BUY", propertyType: "TERRACED", price: 3_495_000, downPayment: 300_000,
      address: ["Solvænget 12", "2000", "Frederiksberg"], takeover: "2026-12-01", notes: "Standardkøb. Ingen særlige forhold.",
      broker: ["Byens Bolig", "Peter Hansen", "+45 33 12 34 56"], extras: ["X_PURCHASE_AGREEMENT"],
      home: ["Frederiksberg Allé 125", "2000", "Frederiksberg"],
      applicants: [
        { first: "Ali", last: "Khan", cpr: "030185-1111", employment: "EMPLOYEE", progress: "full", doneDaysAgo: 0 },
        { first: "Aisha", last: "Khan", cpr: "040288-2222", employment: "EMPLOYEE", progress: "started", relation: "SPOUSE", doneDaysAgo: 1 },
      ],
    },
    {
      advisor: "Mette Lund", created: 9, purpose: "COOP", propertyType: "COOP", price: 1_150_000, downPayment: 120_000,
      address: ["Roskildevej 32, 2. th.", "4000", "Roskilde"], extras: ["X_PURCHASE_AGREEMENT"], home: ["Hestetorvet 4", "4000", "Roskilde"],
      applicants: [{ first: "Sara", last: "Nielsen", cpr: "120791-3333", employment: "SELF_EMPLOYED", company: "Nielsen Design ApS", cvr: "41234567", progress: "full", doneDaysAgo: 2 }],
      rejected: { applicant: 0, doc: "D11_ACCOUNTS_2Y", reason: "Saldobalancen er fra 2025. Upload venligst saldobalance for 2026." },
    },
    {
      advisor: "Mette Lund", created: 12, purpose: "BUY", propertyType: "APARTMENT", price: 2_850_000, downPayment: 285_000,
      address: ["Østerbrogade 18, 3. tv.", "2100", "København Ø"], extras: ["X_PURCHASE_AGREEMENT", "X_GIFT_LETTER"], home: ["Jagtvej 88", "2200", "København N"],
      applicants: [{ first: "Jonas", last: "Mikkelsen", cpr: "220594-4444", employment: "EMPLOYEE", progress: "full", doneDaysAgo: 1 }],
    },
    {
      advisor: "Mette Lund", created: 16, purpose: "BUY", propertyType: "HOUSE", price: 5_250_000, downPayment: 600_000, stage: "CREDIT",
      address: ["Kastrupvej 101", "2300", "København S"], extras: ["X_PURCHASE_AGREEMENT"], home: ["Englandsvej 40", "2300", "København S"],
      summary: "Stabil indtjening i klinikken de seneste tre år. Solid egenkapital og lav gæld.",
      applicants: [
        { first: "Fatima", last: "Rahman", cpr: "170382-5555", employment: "SELF_EMPLOYED", company: "Rahman Tandklinik ApS", cvr: "38765432", progress: "full", doneDaysAgo: 4 },
        { first: "Mads", last: "Rahman", cpr: "090880-6666", employment: "EMPLOYEE", progress: "full", relation: "SPOUSE", doneDaysAgo: 4 },
      ],
    },
    {
      advisor: "Mette Lund", created: 4, purpose: "PRE_APPROVAL", propertyType: "APARTMENT", price: 2_400_000, downPayment: 250_000, home: ["Vanløse Allé 7", "2720", "Vanløse"],
      applicants: [{ first: "Thomas", last: "Larsen", cpr: "250697-7777", employment: "EMPLOYEE", progress: "none" }],
    },
    {
      advisor: "Mette Lund", created: 10, purpose: "REFINANCE", propertyType: "HOUSE", price: 7_800_000, loanAmount: 4_200_000,
      address: ["Hellerupvej 45", "2900", "Hellerup"], home: ["Hellerupvej 45", "2900", "Hellerup"],
      applicants: [
        { first: "Emma", last: "Jensen", cpr: "300379-8888", employment: "SELF_EMPLOYED", company: "Jensen Advokatfirma", cvr: "29887766", progress: "full", doneDaysAgo: 3 },
        { first: "Oscar", last: "Jensen", cpr: "141177-9999", employment: "SELF_EMPLOYED", company: "OJ Arkitekter ApS", cvr: "35544332", progress: "started", relation: "SPOUSE", doneDaysAgo: 2 },
      ],
    },
    {
      advisor: "Mette Lund", created: 14, purpose: "BUY", propertyType: "HOLIDAY", price: 1_995_000, downPayment: 400_000,
      address: ["Klitvej 7", "3210", "Vejby"], extras: ["X_PURCHASE_AGREEMENT"], home: ["Rungstedvej 12", "2960", "Rungsted Kyst"],
      applicants: [{ first: "Kasper", last: "Holm", cpr: "080688-1212", employment: "EMPLOYEE", progress: "full", doneDaysAgo: 3 }],
    },
    {
      advisor: "Mette Lund", created: 25, purpose: "BUY", propertyType: "APARTMENT", price: 2_600_000, downPayment: 300_000, stage: "CLOSED",
      address: ["Algade 3", "4000", "Roskilde"], home: ["Algade 3", "4000", "Roskilde"],
      applicants: [{ first: "Line", last: "Berg", cpr: "110292-1313", employment: "EMPLOYEE", progress: "full", doneDaysAgo: 22 }],
    },
    {
      advisor: "Jonas Krogh", created: 7, purpose: "BUY", propertyType: "HOUSE", price: 3_900_000, downPayment: 400_000,
      address: ["Bakkevej 9", "4000", "Roskilde"], home: ["Ringstedvej 20", "4000", "Roskilde"],
      applicants: [
        { first: "Sofie", last: "Dahl", cpr: "050593-1414", employment: "EMPLOYEE", progress: "started", doneDaysAgo: 3 },
        { first: "Jens", last: "Dahl", cpr: "060791-1515", employment: "SELF_EMPLOYED", company: "Dahl VVS ApS", cvr: "40112233", progress: "none", relation: "SPOUSE" },
      ],
    },
    {
      advisor: "Sara Holm", created: 21, purpose: "BUY", propertyType: "TERRACED", price: 2_200_000, downPayment: 220_000,
      address: ["Torvet 2", "4600", "Køge"], home: ["Nørregade 8", "4600", "Køge"],
      applicants: [{ first: "Oliver", last: "Kirk", cpr: "151189-1616", employment: "SELF_EMPLOYED", company: "Kirk Tømrer ApS", cvr: "37788990", progress: "none" }],
    },
    {
      advisor: "Ali Demir", created: 8, purpose: "BUY", propertyType: "APARTMENT", price: 2_950_000, downPayment: 300_000, stage: "CREDIT",
      address: ["Åboulevarden 50", "8000", "Aarhus C"], home: ["Vestergade 3", "8000", "Aarhus C"],
      applicants: [
        { first: "Noah", last: "Friis", cpr: "070790-1717", employment: "EMPLOYEE", progress: "full", doneDaysAgo: 2 },
        { first: "Alma", last: "Friis", cpr: "080892-1818", employment: "SELF_EMPLOYED", company: "Friis Studio", cvr: "41556677", progress: "full", relation: "SPOUSE", doneDaysAgo: 2 },
      ],
    },
    {
      advisor: "Line Bech", created: 11, purpose: "REFINANCE", propertyType: "HOUSE", price: 4_100_000, loanAmount: 2_600_000,
      address: ["Hunderupvej 12", "5000", "Odense C"], home: ["Hunderupvej 12", "5000", "Odense C"],
      applicants: [{ first: "William", last: "Dam", cpr: "090984-1919", employment: "SELF_EMPLOYED", company: "Dam Rådgivning", cvr: "36655443", progress: "started", doneDaysAgo: 4 }],
    },
    {
      advisor: "Peter Vang", created: 2, purpose: "BUY", propertyType: "APARTMENT", price: 3_300_000, downPayment: 330_000,
      address: ["Vesterbrogade 99", "1620", "København V"], home: ["Istedgade 10", "1650", "København V"],
      applicants: [{ first: "Karla", last: "Winther", cpr: "101095-2020", employment: "EMPLOYEE", progress: "started", doneDaysAgo: 1 }],
    },
    {
      advisor: "Nadia Rask", created: 16, purpose: "BUY", propertyType: "HOUSE", price: 4_800_000, downPayment: 500_000,
      address: ["Strandvejen 200", "2900", "Hellerup"], home: ["Østerbrogade 1", "2100", "København Ø"],
      applicants: [
        { first: "Arthur", last: "Skov", cpr: "121288-2121", employment: "EMPLOYEE", progress: "none" },
        { first: "Olivia", last: "Skov", cpr: "131289-2222", employment: "EMPLOYEE", progress: "none", relation: "SPOUSE" },
      ],
    },
  ];

  console.log(`Opretter ${seeds.length} sager …`);
  for (const c of seeds) await createCase(c, advisor[c.advisor]);
  await pool.end();
  console.log(`Færdig. Log ind som mette.lund@nordvigbank.example med adgangskoden ${DEMO_PASSWORD}`);
}

async function createCase(c: CaseSeed, adv: typeof s.users.$inferSelect) {
  caseSeq += 3;
  const [row] = await db
    .insert(s.cases)
    .values({
      caseNumber: `L360-2026-${String(caseSeq).padStart(6, "0")}`,
      bankId: adv.bankId!,
      departmentId: adv.departmentId!,
      advisorId: adv.id,
      purpose: c.purpose,
      stage: c.stage ?? "OPEN",
      propertyType: c.propertyType,
      price: c.price ?? null,
      downPayment: c.downPayment ?? null,
      loanAmount: c.loanAmount ?? (c.price && c.downPayment !== undefined ? c.price - c.downPayment : null),
      propertyAddress: c.address?.[0] ?? null,
      propertyZip: c.address?.[1] ?? null,
      propertyCity: c.address?.[2] ?? null,
      takeoverDate: c.takeover ?? null,
      notes: c.notes ?? null,
      advisorSummary: c.summary ?? null,
      brokerFirm: c.broker?.[0] ?? null,
      brokerPerson: c.broker?.[1] ?? null,
      brokerPhone: c.broker?.[2] ?? null,
      createdAt: daysAgo(c.created, 9, 0),
      updatedAt: daysAgo(Math.min(...c.applicants.map((a) => a.doneDaysAgo ?? c.created)), 10, 24),
    })
    .returning();

  const apps = await db
    .insert(s.applicants)
    .values(
      c.applicants.map((a, i) => ({
        caseId: row.id,
        position: i + 1,
        firstName: a.first,
        lastName: a.last,
        cprEncrypted: encrypt(a.cpr),
        cprMasked: maskCpr(a.cpr),
        email: `${a.first}.${a.last}@example.dk`.toLowerCase().replace(/[æøå]/g, (m) => ({ æ: "ae", ø: "oe", å: "aa" })[m]!),
        phone: `+45 2${i} ${String(10 + i * 7).padStart(2, "0")} 33 44`,
        address: c.home[0],
        zip: c.home[1],
        city: c.home[2],
        employment: a.employment,
        companyName: a.company ?? null,
        cvr: a.cvr ?? null,
        relation: i ? (a.relation ?? "SPOUSE") : null,
        identifiedAt: a.progress === "none" ? null : daysAgo((a.doneDaysAgo ?? 0) + 1, 9, 17),
        submittedAt: a.progress === "full" ? daysAgo(a.doneDaysAgo ?? 0, 10, 24) : null,
      })),
    )
    .returning();

  const reqs = caseRequirements({
    purpose: c.purpose,
    propertyAddress: c.address?.[0],
    applicants: c.applicants.map((a) => ({ employment: a.employment })),
    extras: c.extras ?? [],
  });
  const main = c.applicants[0];
  await db.insert(s.caseDocuments).values(
    reqs.map((r) => {
      const seedApp = r.applicantIndex === null ? main : c.applicants[r.applicantIndex];
      let status: DocStatus =
        r.docKey === "X_BBR" ? "AUTO_FETCHED" : r.docKey === "D10_BUDGET" ? (main.progress === "full" ? "FILLED" : statusFor(r.docKey, main.progress)) : statusFor(r.docKey, seedApp.progress);
      let reason: string | null = null;
      if (c.rejected && r.applicantIndex === c.rejected.applicant && r.docKey === c.rejected.doc) {
        status = "REJECTED";
        reason = c.rejected.reason;
      }
      const received = status === "AUTO_FETCHED" || status === "UPLOADED" || status === "FILLED";
      return {
        caseId: row.id,
        applicantId: r.applicantIndex === null ? null : apps[r.applicantIndex].id,
        docKey: r.docKey,
        status,
        source: SOURCE[r.docKey] ?? null,
        rejectionReason: reason,
        fileCount: status === "UPLOADED" ? (r.docKey === "D05_PAYSLIPS_3" ? 3 : r.docKey === "D11_ACCOUNTS_2Y" ? 3 : 1) : 0,
        receivedAt: received ? (r.docKey === "X_BBR" ? daysAgo(c.created, 9, 1) : daysAgo(seedApp.doneDaysAgo ?? 0, 10, 20)) : null,
      };
    }),
  );

  // Historik i revisionsloggen (kun koder og id'er).
  const log: (typeof s.auditLog.$inferInsert)[] = [
    { at: daysAgo(c.created, 9, 0), actorType: "USER", actorUserId: adv.id, bankId: adv.bankId, caseId: row.id, action: "CASE_CREATED" },
    { at: daysAgo(c.created, 9, 1), actorType: "USER", actorUserId: adv.id, bankId: adv.bankId, caseId: row.id, action: "INVITATION_SENT", details: { applicants: apps.length } },
  ];
  c.applicants.forEach((a, i) => {
    if (a.progress === "none") return;
    const d = (a.doneDaysAgo ?? 0) + 1;
    log.push({ at: daysAgo(d, 9, 17), actorType: "CUSTOMER", actorApplicantId: apps[i].id, bankId: adv.bankId, caseId: row.id, action: "MITID_IDENTIFIED" });
    log.push({ at: daysAgo(d, 9, 19), actorType: "CUSTOMER", actorApplicantId: apps[i].id, bankId: adv.bankId, caseId: row.id, action: "CONSENT_GIVEN", details: { sources: 3 } });
    if (a.progress === "full") {
      log.push({ at: daysAgo(a.doneDaysAgo ?? 0, 10, 20), actorType: "CUSTOMER", actorApplicantId: apps[i].id, bankId: adv.bankId, caseId: row.id, action: "DOCUMENTS_UPLOADED" });
      log.push({ at: daysAgo(a.doneDaysAgo ?? 0, 10, 24), actorType: "CUSTOMER", actorApplicantId: apps[i].id, bankId: adv.bankId, caseId: row.id, action: "CUSTOMER_SUBMITTED" });
    }
  });
  if (c.rejected) {
    log.push({ at: daysAgo(1, 14, 12), actorType: "USER", actorUserId: adv.id, bankId: adv.bankId, caseId: row.id, action: "DOCUMENT_REJECTED", details: { docKey: c.rejected.doc } });
  }
  if (c.stage === "CREDIT" || c.stage === "CLOSED") {
    log.push({ at: daysAgo(Math.max(0, (main.doneDaysAgo ?? 1) - 1), 12, 0), actorType: "USER", actorUserId: adv.id, bankId: adv.bankId, caseId: row.id, action: "SENT_TO_CREDIT" });
  }
  if (c.stage === "CLOSED") {
    log.push({ at: daysAgo(Math.max(0, (main.doneDaysAgo ?? 1) - 3), 12, 0), actorType: "USER", actorUserId: adv.id, bankId: adv.bankId, caseId: row.id, action: "CASE_CLOSED" });
  }
  await db.insert(s.auditLog).values(log);
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
