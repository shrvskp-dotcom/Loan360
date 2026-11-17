import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { CaseStatusPill, DocStatusPill, ProgressBar } from "@/components/ui";
import { isPurchase, type DocStatus, progress } from "@/domain/rules";
import { getDict, type Dict } from "@/i18n";
import { requireBankUser } from "@/lib/auth";
import { type CaseDetail, getCaseForUser } from "@/lib/cases";
import { date, kr, percent, relative } from "@/lib/format";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireBankUser();
  const { t } = await getDict();
  const c = await getCaseForUser(user, (await params).id);
  // Samme svar for "findes ikke" og "ingen adgang", så sagsnumre i andre banker ikke kan gættes.
  if (!c) notFound();

  const names = c.applicants.map((a) => `${a.firstName} ${a.lastName}`).join(" & ");
  const loanNeed = c.loanAmount ?? (c.price !== null && c.downPayment !== null ? c.price - c.downPayment : null);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Link href="/raadgiver/sager" className="row small" style={{ gap: 6 }}>
        <Icon name="arrowLeft" /> {t.caseView.back}
      </Link>

      <header className="row between" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 8 }}>
          <div className="row">
            <h1>
              {t.caseView.case}: {names}
            </h1>
            <CaseStatusPill t={t} status={c.status} />
          </div>
          <div className="row muted small">
            <b style={{ color: "var(--ink)" }}>{t.purpose[c.purpose]}</b>
            {c.propertyAddress && (
              <span>
                {c.propertyAddress}, {c.propertyZip} {c.propertyCity}
              </span>
            )}
            <span className="tiny">{c.caseNumber}</span>
          </div>
        </div>
        <div className="row" style={{ gap: 24 }}>
          {c.applicants.map((a) => (
            <div key={a.id}>
              <div className="eyebrow">{a.position === 1 ? t.caseView.mainApplicant : t.caseView.coApplicant}</div>
              <b style={{ color: "var(--ink)" }}>
                {a.firstName} {a.lastName}
              </b>
              <div className="small muted">
                {a.cprMasked} · {t.employment[a.employment]}
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="case-grid">
        <div className="stack" style={{ gap: 18 }}>
          <Documents t={t} c={c} />
          <Property t={t} c={c} loanNeed={loanNeed} />
          <section className="card stack">
            <h2>{t.caseView.summary}</h2>
            <p className={c.advisorSummary ? "" : "muted"}>{c.advisorSummary ?? t.caseView.noSummary}</p>
          </section>
          <Contacts t={t} c={c} />
        </div>
        <aside className="stack" style={{ gap: 18 }}>
          <section className="card stack">
            <div className="eyebrow">{t.caseView.nextStep}</div>
            <b style={{ color: "var(--ink)" }}>{nextStep(t, c)}</b>
            <ProgressBar p={c.progress} />
            <p className="small muted">{t.caseView.received(c.progress.received, c.progress.total)}</p>
          </section>
          <section className="card stack">
            <h3>{t.caseView.history}</h3>
            <ol className="timeline">
              {c.history.map((h, i) => (
                <li key={i}>
                  <span className="tl-dot">
                    <Icon name="check" />
                  </span>
                  <div className="small">
                    <div>
                      {t.audit[h.action] ?? h.action}
                      {h.action === "DOCUMENT_REJECTED" && h.details?.docKey ? `: ${t.doc[String(h.details.docKey)]}` : ""}
                    </div>
                    <div className="muted">{relative(t, h.at)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function nextStep(t: Dict, c: CaseDetail): string {
  const n = t.caseView.next;
  switch (c.status) {
    case "CREDIT":
      return n.credit;
    case "CLOSED":
      return n.closed;
    case "READY":
      return n.ready;
    case "INVITED":
      return n.invited;
  }
  if (c.documents.some((d) => d.status === "REJECTED")) return n.rejected;
  if (c.applicants.some((a) => a.identifiedAt && !a.submittedAt)) return n.submitting;
  if (c.applicants.some((a) => !a.identifiedAt)) return n.coApplicant;
  return n.docs;
}

function DocTable({ t, docs }: { t: Dict; docs: CaseDetail["documents"] }) {
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.caseView.document}</th>
            <th>{t.caseView.source}</th>
            <th>{t.caseView.status}</th>
            <th>{t.caseView.receivedAt}</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>
                <div className="doc-name">{t.doc[d.docKey] ?? d.docKey}</div>
                {d.rejectionReason && <div className="tiny" style={{ color: "var(--bad)" }}>{d.rejectionReason}</div>}
                {d.fileCount > 0 && <div className="tiny muted">{t.caseView.files(d.fileCount)}</div>}
              </td>
              <td className="small">{d.source ? (t.source[d.source] ?? d.source) : t.common.none}</td>
              <td>
                <DocStatusPill t={t} status={d.status as DocStatus} />
              </td>
              <td className="small num">{d.receivedAt ? date(t, d.receivedAt) : t.common.none}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Documents({ t, c }: { t: Dict; c: CaseDetail }) {
  const groups = [
    ...c.applicants.map((a) => ({
      key: a.id,
      title: `${a.firstName} ${a.lastName}`,
      sub: t.employment[a.employment],
      state: a.submittedAt ? t.caseView.submitted : a.identifiedAt ? t.caseView.inProgress : t.caseView.notOpened,
      docs: c.documents.filter((d) => d.applicantId === a.id),
    })),
    { key: "shared", title: t.caseView.shared, sub: "", state: "", docs: c.sharedDocuments },
  ];
  return (
    <section className="card stack" style={{ gap: 22 }}>
      <h2>{t.caseView.documents}</h2>
      {groups.map((g) => {
        const p = progress(g.docs.map((d) => d.status as DocStatus));
        return (
          <div key={g.key} className="stack" style={{ gap: 8 }}>
            <div className="row between">
              <h3 className="section-title">
                {g.title} {g.sub && <span className="small muted" style={{ fontWeight: 500 }}>· {g.sub}</span>}
              </h3>
              <span className="small muted">
                {g.state && `${g.state} · `}
                {p.received} {t.common.of} {p.total}
              </span>
            </div>
            <DocTable t={t} docs={g.docs} />
          </div>
        );
      })}
    </section>
  );
}

function Property({ t, c, loanNeed }: { t: Dict; c: CaseDetail; loanNeed: number | null }) {
  const purchase = isPurchase(c.purpose);
  return (
    <section className="card stack">
      <h2>{t.caseView.property}</h2>
      <dl className="kv">
        {c.price !== null && (
          <>
            <dt>{purchase ? t.caseView.price : t.caseView.value}</dt>
            <dd className="num">{kr(t, c.price)}</dd>
          </>
        )}
        {purchase && c.downPayment !== null && c.price && (
          <>
            <dt>{t.caseView.downPayment}</dt>
            <dd className="num">
              {kr(t, c.downPayment)} ({percent(t, c.downPayment / c.price)})
            </dd>
          </>
        )}
        <dt>{t.caseView.loanNeed}</dt>
        <dd className="num">{kr(t, loanNeed)}</dd>
        <dt>{t.caseView.propertyType}</dt>
        <dd>{t.propertyType[c.propertyType]}</dd>
        {c.takeoverDate && (
          <>
            <dt>{t.caseView.takeover}</dt>
            <dd>{date(t, new Date(c.takeoverDate))}</dd>
          </>
        )}
        {c.brokerFirm && (
          <>
            <dt>{t.caseView.broker}</dt>
            <dd>
              {c.brokerFirm}
              {c.brokerPerson ? `, ${c.brokerPerson}` : ""}
            </dd>
          </>
        )}
        {c.notes && (
          <>
            <dt>{t.caseView.notes}</dt>
            <dd style={{ fontWeight: 500 }}>{c.notes}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

function Contacts({ t, c }: { t: Dict; c: CaseDetail }) {
  return (
    <section className="card stack">
      <h2>{t.caseView.contact}</h2>
      <div className="kpis">
        {c.applicants.map((a) => (
          <dl className="kv" key={a.id}>
            <dt>{a.position === 1 ? t.caseView.mainApplicant : t.caseView.coApplicant}</dt>
            <dd>
              {a.firstName} {a.lastName}
            </dd>
            <dt>CPR</dt>
            <dd>{a.cprMasked}</dd>
            <dt>{t.caseView.email}</dt>
            <dd>{a.email}</dd>
            <dt>{t.caseView.phone}</dt>
            <dd>{a.phone}</dd>
            <dt>{t.caseView.address}</dt>
            <dd>
              {a.address}, {a.zip} {a.city}
            </dd>
            {a.companyName && (
              <>
                <dt>{t.caseView.company}</dt>
                <dd>
                  {a.companyName} (CVR {a.cvr})
                </dd>
              </>
            )}
            {a.relation && (
              <>
                <dt>Relation</dt>
                <dd>{t.relation[a.relation as keyof Dict["relation"]] ?? a.relation}</dd>
              </>
            )}
          </dl>
        ))}
      </div>
    </section>
  );
}
