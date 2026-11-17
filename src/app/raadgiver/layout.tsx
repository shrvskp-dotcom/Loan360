import { eq } from "drizzle-orm";
import { logout } from "@/app/actions";
import { DemoBar } from "@/components/DemoBar";
import { Icon } from "@/components/Icon";
import { db, schema } from "@/db/client";
import { getDict } from "@/i18n";
import { requireBankUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { NavLinks } from "./NavLinks";

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireBankUser();
  const { t } = await getDict();
  const [bank] = await db.select({ name: schema.banks.name }).from(schema.banks).where(eq(schema.banks.id, user.bankId!));
  const [dept] = user.departmentId
    ? await db.select({ name: schema.departments.name }).from(schema.departments).where(eq(schema.departments.id, user.departmentId))
    : [];
  const bankInitials = bank.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <>
      <DemoBar t={t} />
      <div className="adv">
        <nav className="side" aria-label="Hovedmenu">
          <span className="bankmark">
            <i>{bankInitials}</i>
            {bank.name}
          </span>
          <NavLinks
            items={[
              { href: "/raadgiver", label: t.nav.overview, icon: "home" },
              { href: "/raadgiver/sager", label: t.nav.cases, icon: "doc" },
              { href: "/raadgiver/ny-sag", label: t.nav.newCase, icon: "plus", disabled: true, soon: t.common.comingSoon },
              { href: "/raadgiver/beskeder", label: t.nav.messages, icon: "chat", disabled: true, soon: t.common.comingSoon },
            ]}
          />
          <span className="spacer" />
          <span className="tiny muted powered" style={{ padding: "8px 12px" }}>
            {t.common.poweredBy} <b>Lån360</b>
          </span>
        </nav>
        <div className="main">
          <header className="topbar">
            <form className="search" action="/raadgiver/sager" role="search">
              <Icon name="search" />
              <input type="search" name="q" placeholder={t.nav.search} aria-label={t.nav.search} />
            </form>
            <div className="me">
              <span className="avatar">{initials(user.name)}</span>
              <span className="who">
                <b style={{ display: "block", color: "var(--ink)" }}>{user.name}</b>
                <span className="small muted">
                  {user.title ?? t.nav.personalAdvisor}
                  {dept ? ` · ${dept.name}` : ""}
                </span>
              </span>
              <form action={logout}>
                <button className="btn sm" type="submit">
                  <Icon name="logout" /> {t.nav.logout}
                </button>
              </form>
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </div>
    </>
  );
}
