import { getDict } from "@/i18n";
import { requireBankUser } from "@/lib/auth";
import { listMyCases } from "@/lib/cases";
import { CaseTable, filterByTab, parseTab, TabBar } from "../CaseTable";

export default async function Cases({ searchParams }: { searchParams: Promise<{ fane?: string; q?: string }> }) {
  const user = await requireBankUser();
  const { t } = await getDict();
  const sp = await searchParams;
  const q = sp.q?.slice(0, 100);
  const tab = parseTab(sp.fane);
  const items = await listMyCases(user, q);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <h1>{q ? t.list.searchResults(q) : t.nav.cases}</h1>
      <section className="card stack">
        <TabBar t={t} items={items} current={tab} base="/raadgiver/sager" q={q} />
        <CaseTable t={t} items={filterByTab(items, tab)} />
      </section>
    </div>
  );
}
