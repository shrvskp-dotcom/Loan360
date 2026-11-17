import type { Dict } from "@/i18n";
import type { CaseStatus, DocStatus, Progress } from "@/domain/rules";

const CASE_TONE: Record<CaseStatus, string> = {
  INVITED: "p-info",
  COLLECTING: "p-info",
  AWAITING_CUSTOMER: "p-warn",
  READY: "p-ok",
  CREDIT: "p-violet",
  CLOSED: "p-grey",
};

const DOC_TONE: Record<DocStatus, string> = {
  AUTO_FETCHED: "p-ok",
  UPLOADED: "p-ok",
  FILLED: "p-ok",
  AWAITING_CONSENT: "p-info",
  MISSING: "p-warn",
  AWAITING_CUSTOMER: "p-grey",
  REJECTED: "p-bad",
};

export function CaseStatusPill({ t, status }: { t: Dict; status: CaseStatus }) {
  return <span className={`pill ${CASE_TONE[status]}`}>{t.caseStatus[status]}</span>;
}

export function DocStatusPill({ t, status }: { t: Dict; status: DocStatus }) {
  return <span className={`pill ${DOC_TONE[status]}`}>{t.docStatus[status]}</span>;
}

export function ProgressBar({ p }: { p: Progress }) {
  return (
    <div className="prog" role="img" aria-label={`${p.received}/${p.total}`}>
      <div className={`bar ${p.missing ? "" : "full"}`}>
        <i style={{ width: `${p.percent}%` }} />
      </div>
      <span className="num small">
        {p.received}/{p.total}
      </span>
    </div>
  );
}
