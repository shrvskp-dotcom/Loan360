import { toggleLanguage } from "@/app/actions";
import type { Dict } from "@/i18n";

export function DemoBar({ t }: { t: Dict }) {
  return (
    <div className="demobar">
      <div className="demobar-in">
        <span className="logo360">
          Lån<b>360</b>
        </span>
        <span className="demotag">{t.common.demo}</span>
        <form action={toggleLanguage}>
          <button className="btn sm" type="submit" aria-label={t.common.switchLangLabel}>
            {t.common.switchLang}
          </button>
        </form>
      </div>
    </div>
  );
}
