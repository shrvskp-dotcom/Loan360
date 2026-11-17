/**
 * Dataadgang for sager. Alle funktioner tager den indloggede bruger som argument og
 * håndhæver adgangsreglerne i domain/access.ts tæt på databasen.
 */
import "server-only";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/db/client";
import { canViewCase } from "@/domain/access";
import { byCatalogOrder, caseStatus, type CaseStatus, type DocKey, type DocStatus, progress } from "@/domain/rules";
import { audit } from "./audit";
import type { SessionUser } from "./session";

export interface CaseListItem {
  id: string;
  caseNumber: string;
  purpose: (typeof s.purposeEnum.enumValues)[number];
  stage: (typeof s.stageEnum.enumValues)[number];
  propertyAddress: string | null;
  createdAt: Date;
  applicants: { firstName: string; lastName: string; employment: "EMPLOYEE" | "SELF_EMPLOYED"; address: string }[];
  status: CaseStatus;
  progress: ReturnType<typeof progress>;
  firstMissing: DocKey | null;
  latest: { action: string; at: Date } | null;
}

/** Rådgiverens egne sager (som i prototypens "Mine boligsager"). */
export async function listMyCases(user: SessionUser, query?: string): Promise<CaseListItem[]> {
  const q = query?.trim();
  const caseRows = await db
    .select()
    .from(s.cases)
    .where(
      and(
        eq(s.cases.advisorId, user.id),
        eq(s.cases.bankId, user.bankId!),
        q
          ? or(
              sql`${s.cases.caseNumber} ilike ${"%" + q + "%"}`,
              sql`exists (select 1 from applicants a where a.case_id = ${s.cases.id} and (a.first_name || ' ' || a.last_name) ilike ${"%" + q + "%"})`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(s.cases.updatedAt));
  if (!caseRows.length) return [];
  const ids = caseRows.map((c) => c.id);

  const [apps, docs, latest] = await Promise.all([
    db.select().from(s.applicants).where(inArray(s.applicants.caseId, ids)).orderBy(asc(s.applicants.position)),
    db
      .select({ caseId: s.caseDocuments.caseId, docKey: s.caseDocuments.docKey, status: s.caseDocuments.status })
      .from(s.caseDocuments)
      .where(inArray(s.caseDocuments.caseId, ids)),
    db
      .selectDistinctOn([s.auditLog.caseId], { caseId: s.auditLog.caseId, action: s.auditLog.action, at: s.auditLog.at })
      .from(s.auditLog)
      .where(and(inArray(s.auditLog.caseId, ids), sql`${s.auditLog.action} <> 'CASE_VIEWED'`))
      .orderBy(s.auditLog.caseId, desc(s.auditLog.at)),
  ]);

  return caseRows.map((c) => {
    const a = apps.filter((x) => x.caseId === c.id);
    const d = docs.filter((x) => x.caseId === c.id).sort((x, y) => byCatalogOrder(x.docKey as DocKey, y.docKey as DocKey));
    const statuses = d.map((x) => x.status as DocStatus);
    const l = latest.find((x) => x.caseId === c.id);
    return {
      id: c.id,
      caseNumber: c.caseNumber,
      purpose: c.purpose,
      stage: c.stage,
      propertyAddress: c.propertyAddress,
      createdAt: c.createdAt,
      applicants: a.map((x) => ({ firstName: x.firstName, lastName: x.lastName, employment: x.employment, address: x.address })),
      status: caseStatus({ stage: c.stage, documentStatuses: statuses, applicants: a }),
      progress: progress(statuses),
      firstMissing: (d.find((x) => !["AUTO_FETCHED", "UPLOADED", "FILLED"].includes(x.status))?.docKey as DocKey) ?? null,
      latest: l ? { action: l.action, at: l.at } : null,
    };
  });
}

/** Henter én sag, hvis brugeren må se den, og logger visningen i revisionsloggen. */
export async function getCaseForUser(user: SessionUser, caseId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(caseId)) return null;
  const [c] = await db.select().from(s.cases).where(eq(s.cases.id, caseId)).limit(1);
  if (!c || !canViewCase(user, c)) return null;

  const [apps, docs, history, advisor] = await Promise.all([
    db
      .select({
        id: s.applicants.id,
        position: s.applicants.position,
        firstName: s.applicants.firstName,
        lastName: s.applicants.lastName,
        cprMasked: s.applicants.cprMasked, // CPR i klartekst forlader aldrig databasen her
        email: s.applicants.email,
        phone: s.applicants.phone,
        address: s.applicants.address,
        zip: s.applicants.zip,
        city: s.applicants.city,
        employment: s.applicants.employment,
        companyName: s.applicants.companyName,
        cvr: s.applicants.cvr,
        relation: s.applicants.relation,
        identifiedAt: s.applicants.identifiedAt,
        submittedAt: s.applicants.submittedAt,
      })
      .from(s.applicants)
      .where(eq(s.applicants.caseId, c.id))
      .orderBy(asc(s.applicants.position)),
    db.select().from(s.caseDocuments).where(eq(s.caseDocuments.caseId, c.id)),
    db
      .select({ action: s.auditLog.action, at: s.auditLog.at, actorType: s.auditLog.actorType, details: s.auditLog.details })
      .from(s.auditLog)
      .where(and(eq(s.auditLog.caseId, c.id), sql`${s.auditLog.action} <> 'CASE_VIEWED'`))
      .orderBy(desc(s.auditLog.at))
      .limit(50),
    db.select({ name: s.users.name }).from(s.users).where(eq(s.users.id, c.advisorId)).limit(1),
  ]);

  await audit({ action: "CASE_VIEWED", actorUserId: user.id, bankId: c.bankId, caseId: c.id });

  const sorted = docs.sort((x, y) => byCatalogOrder(x.docKey as DocKey, y.docKey as DocKey));
  const statuses = sorted.map((d) => d.status as DocStatus);
  return {
    ...c,
    advisorName: advisor[0]?.name ?? "",
    applicants: apps,
    documents: sorted,
    sharedDocuments: sorted.filter((d) => d.applicantId === null),
    history,
    status: caseStatus({ stage: c.stage, documentStatuses: statuses, applicants: apps }),
    progress: progress(statuses),
  };
}

export type CaseDetail = NonNullable<Awaited<ReturnType<typeof getCaseForUser>>>;
