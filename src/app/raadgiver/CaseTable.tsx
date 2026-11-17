import Link from "next/link";
import { CaseStatusPill, ProgressBar } from "@/components/ui";
import type { Dict } from "@/i18n";
import type { CaseListItem } from "@/lib/cases";
import { relative } from "@/lib/format";

export type ListTab = "all" | "awaiting" | "collecting" | "ready" | "credit" | "closed";
export const LIST_TABS: ListTab[] = ["all", "awaiting", "collecting", "ready", "credit", "closed"];

export function filterByTab(items: CaseListItem[], tab: ListTab): CaseListItem[] {
  switch (tab) {
    case "all":
      return items.filter((c) => c.status !== "CLOSED");
    case "awaiting":
      return items.filter((c) => c.status === "AWAITING_CUSTOMER");
    case "collecting":
      return items.filter((c) => c.status === "INVITED" || c.status === "COLLECTING");
    case "ready":
      return items.filter((c) => c.status === "READY");
    case "credit":
      return items.filter((c) => c.status === "CREDIT");
    case "closed":
      return items.filter((c) => c.status === "CLOSED");
  }
}

export function TabBar({ t, items, current, base, q }: { t: Dict; items: CaseListItem[]; current: ListTab; base: string; q?: string }) {
  return (
    <nav className="tabs" aria-label={t.list.status}>
      {LIST_TABS.map((tab) => {
        const params = new URLSearchParams();
        if (tab !== "all") params.set("fane", tab);
        if (q) params.set("q", q);
        const qs = params.toString();
        return (
          <Link key={tab} href={qs ? `${base}?${qs}` : base} aria-current={current === tab ? "page" : undefined} scroll={false}>
            {t.list.tabs[tab]} ({filterByTab(items, tab).length})
          </Link>
        );
      })}
    </nav>
  );
}

export function CaseTable({ t, items }: { t: Dict; items: CaseListItem[] }) {
  if (!items.length) return <p className="muted" style={{ padding: "16px 4px" }}>{t.list.empty}</p>;
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.list.customer}</th>
            <th>{t.list.applicants}</th>
            <th>{t.list.purpose}</th>
            <th>{t.list.status}</th>
            <th>{t.list.progress}</th>
            <th>{t.list.latest}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="click">
              <td>
                <Link className="row-link" href={`/raadgiver/sager/${c.id}`}>
                  <div className="cell-main">{c.applicants.map((a) => `${a.firstName} ${a.lastName}`).join(" & ")}</div>
                  <div className="small muted">{c.propertyAddress ?? c.applicants[0]?.address}</div>
                </Link>
              </td>
              <td className="small">{c.applicants.map((a) => t.employment[a.employment]).join(" + ")}</td>
              <td className="small">{t.purpose[c.purpose]}</td>
              <td>
                <CaseStatusPill t={t} status={c.status} />
              </td>
              <td>
                <ProgressBar p={c.progress} />
              </td>
              <td className="small">
                {c.latest && (
                  <>
                    <div>{t.audit[c.latest.action] ?? c.latest.action}</div>
                    <div className="muted">{relative(t, c.latest.at)}</div>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function parseTab(v: string | undefined): ListTab {
  return LIST_TABS.includes(v as ListTab) ? (v as ListTab) : "all";
}
