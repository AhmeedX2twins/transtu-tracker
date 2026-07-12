import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useI18n, type Lang } from "../lib/i18n";

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const langs: { code: Lang; label: string }[] = [
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
    { code: "en", label: "English" },
  ];
  return (
    <AppShell>
      <div className="tt-fade-in flex flex-col gap-5">
        <h1 className="text-[26px] font-bold text-tt-ink">{t("settings.title")}</h1>
        <section className="tt-card p-5">
          <h2 className="text-base font-bold text-tt-ink">{t("settings.language")}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {langs.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`tt-press min-h-12 rounded-xl border text-base font-semibold ${
                  lang === l.code
                    ? "border-tt-green bg-tt-green-soft text-tt-green"
                    : "border-tt-line bg-white text-tt-ink"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>
        <section className="tt-card p-5">
          <h2 className="text-base font-bold text-tt-ink">{t("settings.about")}</h2>
          <div className="mt-3 flex items-start gap-4">
            <img
              src="/assets/logo-transtu.jpg"
              alt="TRANSTU — نقل تونس"
              className="h-16 w-16 rounded-xl border border-tt-line object-contain"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
            <p className="text-sm leading-relaxed text-tt-muted">{t("settings.about_text")}</p>
          </div>
          <p className="mt-4 text-sm font-semibold text-tt-ink">{t("settings.contact")}</p>
          <p className="mt-1 text-xs text-tt-muted">{t("settings.version")}</p>
        </section>
        {/* Deliberately quiet staff entry point — caption text, no button chrome. */}
        <p className="pb-4 text-center">
          <Link to="/staff" className="text-xs text-tt-muted underline-offset-2 hover:underline">
            {t("staff.portal")}
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
