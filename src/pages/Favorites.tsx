import { Link } from "react-router-dom";
import { AppShell, ModeBadge, useFavorites, modeColor } from "../components/AppShell";
import { useI18n } from "../lib/i18n";

export default function Favorites() {
  const { t } = useI18n();
  const { favorites, toggle } = useFavorites();
  return (
    <AppShell>
      <div className="tt-fade-in flex flex-col gap-4">
        <h1 className="text-[26px] font-bold text-tt-ink">{t("fav.title")}</h1>
        {favorites.length === 0 ? (
          <div className="tt-card flex flex-col items-center gap-3 p-10 text-center">
            <span className="text-4xl" aria-hidden>
              ☆
            </span>
            <p className="text-base font-semibold text-tt-ink">{t("fav.empty")}</p>
            <p className="text-sm text-tt-muted">{t("fav.hint")}</p>
            <Link
              to="/horaires"
              className="tt-press mt-2 min-h-12 rounded-xl bg-tt-green px-6 py-3 text-base font-semibold text-white"
            >
              {t("tt.title")} →
            </Link>
          </div>
        ) : (
          <div className="tt-card divide-y divide-tt-line px-4">
            {favorites.map((f) => {
              const c = modeColor(f.mode);
              return (
                <div key={f.id} className="flex min-h-14 items-center gap-3 py-3">
                  <span
                    className={`inline-flex h-9 min-w-12 items-center justify-center rounded-lg px-2 text-sm font-bold text-white ${c.bg}`}
                  >
                    {f.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-tt-ink">{f.destination}</p>
                    <ModeBadge mode={f.mode} />
                  </div>
                  <Link
                    to="/carte"
                    className="tt-press rounded-xl bg-tt-green-soft px-3 py-2 text-sm font-semibold text-tt-green"
                  >
                    {t("track.live")}
                  </Link>
                  <button
                    type="button"
                    aria-label="Retirer"
                    onClick={() => toggle(f)}
                    className="tt-press grid h-12 w-12 place-items-center text-xl text-tt-yellow"
                  >
                    ★
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
