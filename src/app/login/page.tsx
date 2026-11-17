import { redirect } from "next/navigation";
import { DemoBar } from "@/components/DemoBar";
import { Icon } from "@/components/Icon";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fejl?: string }> }) {
  const { t } = await getDict();
  const { fejl } = await searchParams;
  const user = await getSessionUser();
  if (user && user.role !== "PLATFORM_ADMIN") redirect("/raadgiver");

  return (
    <>
      <DemoBar t={t} />
      <main className="login-wrap">
        <div className="card login stack">
          <span className="logo360" style={{ fontSize: "1.4rem" }}>
            Lån<b>360</b>
          </span>
          <div className="stack" style={{ gap: 6 }}>
            <h1>{t.login.title}</h1>
            <p className="muted">{t.login.lead}</p>
          </div>
          {fejl === "rolle" && (
            <p className="error" role="alert">
              {t.login.wrongRole}
            </p>
          )}
          <LoginForm
            labels={{
              email: t.login.email,
              password: t.login.password,
              submit: t.login.submit,
              submitting: t.login.submitting,
              invalid: t.login.invalid,
              locked: t.login.locked,
              missing: t.login.missing,
            }}
          />
          <p className="note">
            <Icon name="lock" />
            <span>{t.login.secure}</span>
          </p>
          {process.env.NODE_ENV !== "production" && <p className="tiny muted">{t.login.demoHint}</p>}
        </div>
      </main>
    </>
  );
}
