import "server-only";
import { db, schema } from "@/db/client";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_LOCKED"
  | "LOGOUT"
  | "CASE_CREATED"
  | "CASE_VIEWED"
  | "INVITATION_SENT"
  | "MITID_IDENTIFIED"
  | "CONSENT_GIVEN"
  | "DOCUMENTS_UPLOADED"
  | "CUSTOMER_SUBMITTED"
  | "DOCUMENT_REJECTED"
  | "SENT_TO_CREDIT"
  | "CASE_CLOSED";

interface AuditEntry {
  action: AuditAction;
  actorUserId?: string | null;
  bankId?: string | null;
  caseId?: string | null;
  /** Kun id'er og koder – aldrig navne, CPR, e-mail eller andre persondata. */
  details?: Record<string, string | number | boolean | null>;
}

export async function audit(entry: AuditEntry): Promise<void> {
  await db.insert(schema.auditLog).values({
    actorType: entry.actorUserId ? "USER" : "SYSTEM",
    actorUserId: entry.actorUserId ?? null,
    bankId: entry.bankId ?? null,
    caseId: entry.caseId ?? null,
    action: entry.action,
    details: entry.details ?? null,
  });
}
