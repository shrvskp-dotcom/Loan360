/**
 * Databasemodel for Lån360.
 *
 * Principper:
 * - Beløb gemmes i hele kroner som heltal.
 * - CPR gemmes kun krypteret (cpr_encrypted) og maskeret (cpr_masked) – aldrig i klartekst.
 * - Revisionsloggen indeholder handlinger og id'er, ikke persondata.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const kroner = (name: string) => bigint(name, { mode: "number" });

export const roleEnum = pgEnum("role", ["ADVISOR", "BANK_ADMIN", "PLATFORM_ADMIN"]);
export const employmentEnum = pgEnum("employment", ["EMPLOYEE", "SELF_EMPLOYED"]);
export const purposeEnum = pgEnum("purpose", ["BUY", "COOP", "PRE_APPROVAL", "REFINANCE", "RENOVATION", "EQUITY", "OTHER"]);
export const propertyTypeEnum = pgEnum("property_type", ["HOUSE", "TERRACED", "APARTMENT", "HOLIDAY", "COOP"]);
export const stageEnum = pgEnum("case_stage", ["OPEN", "CREDIT", "CLOSED"]);
export const docStatusEnum = pgEnum("doc_status", [
  "AUTO_FETCHED",
  "UPLOADED",
  "FILLED",
  "AWAITING_CONSENT",
  "MISSING",
  "AWAITING_CUSTOMER",
  "REJECTED",
]);
export const actorTypeEnum = pgEnum("actor_type", ["USER", "CUSTOMER", "SYSTEM"]);

export const banks = pgTable("banks", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const departments = pgTable(
  "departments",
  {
    id: id(),
    bankId: uuid("bank_id").notNull().references(() => banks.id),
    name: text("name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("departments_bank_idx").on(t.bankId)],
);

export const users = pgTable(
  "users",
  {
    id: id(),
    bankId: uuid("bank_id").references(() => banks.id),
    departmentId: uuid("department_id").references(() => departments.id),
    email: text("email").notNull(),
    name: text("name").notNull(),
    title: text("title"),
    phone: text("phone"),
    role: roleEnum("role").notNull().default("ADVISOR"),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").notNull().default(true),
    failedLogins: smallint("failed_logins").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`), index("users_bank_idx").on(t.bankId)],
);

/** Sessioner: kun en hash af tokenet gemmes, så et læk af databasen ikke giver adgang. */
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const cases = pgTable(
  "cases",
  {
    id: id(),
    caseNumber: text("case_number").notNull(),
    bankId: uuid("bank_id").notNull().references(() => banks.id),
    departmentId: uuid("department_id").notNull().references(() => departments.id),
    advisorId: uuid("advisor_id").notNull().references(() => users.id),
    purpose: purposeEnum("purpose").notNull(),
    stage: stageEnum("stage").notNull().default("OPEN"),
    propertyType: propertyTypeEnum("property_type").notNull(),
    price: kroner("price"),
    downPayment: kroner("down_payment"),
    loanAmount: kroner("loan_amount"),
    propertyAddress: text("property_address"),
    propertyZip: text("property_zip"),
    propertyCity: text("property_city"),
    takeoverDate: date("takeover_date"),
    notes: text("notes"),
    advisorSummary: text("advisor_summary"),
    brokerFirm: text("broker_firm"),
    brokerPerson: text("broker_person"),
    brokerPhone: text("broker_phone"),
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cases_number_uq").on(t.caseNumber),
    index("cases_advisor_idx").on(t.advisorId),
    index("cases_dept_idx").on(t.departmentId),
    index("cases_bank_idx").on(t.bankId),
  ],
);

export const applicants = pgTable(
  "applicants",
  {
    id: id(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(), // 1 = hovedansøger, 2 = medansøger
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    cprEncrypted: text("cpr_encrypted").notNull(),
    cprMasked: text("cpr_masked").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    zip: text("zip").notNull(),
    city: text("city").notNull(),
    employment: employmentEnum("employment").notNull(),
    companyName: text("company_name"),
    cvr: text("cvr"),
    relation: text("relation"),
    identifiedAt: timestamp("identified_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("applicants_case_pos_uq").on(t.caseId, t.position)],
);

export const caseDocuments = pgTable(
  "case_documents",
  {
    id: id(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id").references(() => applicants.id, { onDelete: "cascade" }),
    docKey: text("doc_key").notNull(),
    status: docStatusEnum("status").notNull(),
    source: text("source"),
    rejectionReason: text("rejection_reason"),
    fileCount: integer("file_count").notNull().default(0),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("case_documents_uq").on(t.caseId, sql`coalesce(${t.applicantId}, '00000000-0000-0000-0000-000000000000'::uuid)`, t.docKey),
    index("case_documents_case_idx").on(t.caseId),
  ],
);

/**
 * Revisionslog. Én række per handling (login, visning, ændring). Ingen persondata i details –
 * kun id'er og koder, så loggen kan udleveres til bankens revision.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorType: actorTypeEnum("actor_type").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    actorApplicantId: uuid("actor_applicant_id").references(() => applicants.id, { onDelete: "set null" }),
    bankId: uuid("bank_id").references(() => banks.id),
    caseId: uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    details: jsonb("details").$type<Record<string, string | number | boolean | null>>(),
  },
  (t) => [index("audit_case_idx").on(t.caseId, t.at), index("audit_actor_idx").on(t.actorUserId, t.at)],
);
