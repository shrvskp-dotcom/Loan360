import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { getDict } from "@/i18n";
import { requireBankUser } from "@/lib/auth";
import { listMyCases } from "@/lib/cases";
import { daysSince } from "@/lib/format";
import { CaseTable, filterByTab, parseTab, TabBar } from "./CaseTable";

export default async function Overview({ searchParams }: { searchParams: Promise<{ fane?: string }> }) {
  const user = await requireBankUser();
  const { t } = await getDict();
  const tab = parseTab((await searchParams).fane);
  const items = await listMyCases(user);

  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Copenhagen" }));
  const greet = hour < 10 ? t.home.morning : hour < 17 ? t.home.afternoon : t.home.evening;
  const count = (f: (s: string) => boolean) => items.filter((c) => f(c.status)).length;
  const closed30 = items.filter((c) => c.status === "CLOSED" && daysSince(c.latest?.at ?? c.createdAt) <= 30).length;

  const kpis: [IconName, number, string, string][] = [
    ["home", count((s) => s !== "CLOSED"), t.home.kpiActive, "/raadgiver/sager"],
    ["user", count((s) => s === "AWAITING_CUSTOMER" || s === "INVITED"), t.home.kpiAwaiting, "/raadgiver/sager?fane=awaiting"],
    ["doc", count((s) => s === "READY"), t.home.kpiReady, "/raadgiver/sager?fane=ready"],
    ["check", closed30, t.home.kpiClosed, "/raadgiver/sager?fane=closed"],
  ];

  const tasks = items
    .flatMap((c) => {
      const name = c.applicants.map((a) => `${a.firstName} ${a.lastName}`).join(" & ");
      if (c.status === "READY") return [{ c, title: t.home.taskReview + name, sub: t.home.taskReviewSub }];
      if (c.status === "AWAITING_CUSTOMER")
        return [{ c, title: t.home.taskFollow + name, sub: t.home.taskFollowSub + (c.firstMissing ? t.doc[c.firstMissing] : "") }];
      if (c.status === "INVITED" && daysSince(c.createdAt) >= 3)
        return [{ c, title: t.home.taskRemind + name, sub: t.home.taskRemindSub(daysSince(c.createdAt)) }];
      return [];
    })
    .slice(0, 5);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row between">
        <div>
          <h1>
            {greet}, {user.name.split(" ")[0]}
          </h1>
          <p className="muted">{t.home.lead}</p>
        </div>
        <span className="btn pri" aria-disabled="true" title={t.common.comingSoon}>
          <Icon name="plus" /> {t.home.newCase}
        </span>
      </div>
      <div className="home-grid">
        <div className="stack" style={{ gap: 20 }}>
          <div className="kpis">
            {kpis.map(([icon, n, label, href]) => (
              <Link key={label} className="card kpi" href={href}>
                <span className={`ic-circle ${icon === "check" ? "ok" : ""}`}>
                  <Icon name={icon} />
                </span>
                <span>
                  <b className="num">{n}</b>
                  <span className="small muted">{label}</span>
                </span>
              </Link>
            ))}
          </div>
          <section className="card stack">
            <h2>{t.home.myCases}</h2>
            <TabBar t={t} items={items} current={tab} base="/raadgiver" />
            <CaseTable t={t} items={filterByTab(items, tab)} />
          </section>
        </div>
        <aside className="card">
          <h2 style={{ marginBottom: 6 }}>{t.home.tasks}</h2>
          {tasks.length ? (
            tasks.map((x) => (
              <div className="task" key={x.c.id}>
                <span className="ic-circle" style={{ width: 28, height: 28 }}>
                  <Icon name="doc" />
                </span>
                <div>
                  <Link href={`/raadgiver/sager/${x.c.id}`} style={{ fontWeight: 700, color: "var(--ink)" }}>
                    {x.title}
                  </Link>
                  <div className="small muted">{x.sub}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="small muted">{t.home.noTasks}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
