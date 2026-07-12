import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell, ModeBadge, LineListRow, useFavorites, modeColor } from "../components/AppShell";
import { useI18n } from "../lib/i18n";
import { getActiveAlerts, searchLines, type LineRow } from "../lib/api";

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function Home() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 250);
  const [hour, setHour] = useState(12);
  useEffect(() => setHour(new Date().getHours()), []);
  const greeting = hour < 17 ? t("home.greeting.morning") : t("home.greeting.evening");

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getActiveAlerts(),
    refetchInterval: 60_000,
  });
  const results = useQuery({
    queryKey: ["search", dq],
    queryFn: () => searchLines(dq),
    enabled: dq.trim().length > 0,
  });

  const modes = [
    { mode: "bus", label: t("mode.bus"), sub: "TRANSTU" },
    { mode: "metro", label: t("mode.metro"), sub: "6 lignes" },
    { mode: "train", label: t("mode.train"), sub: "TGM + SNCFT" },
  ];

  return (
    <AppShell>
      <div className="tt-fade-in flex flex-col gap-6">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-tt-green">
            {t("home.season")}
          </p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight text-tt-ink">
            {greeting} 👋 {t("home.where")}
          </h1>
          <div className="relative mt-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              inputMode="search"
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              className="h-14 w-full rounded-2xl border border-tt-line bg-white px-5 pe-12 text-base text-tt-ink shadow-[0_4px_20px_rgba(0,0,0,0.06)] outline-none placeholder:text-tt-muted focus:border-tt-green"
            />
            <span className="pointer-events-none absolute inset-y-0 end-4 grid place-items-center text-tt-muted" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
              </svg>
            </span>
          </div>
          {dq.trim().length > 0 && (
            <div className="tt-card mt-3 px-4 py-2">
              {results.isLoading ? (
                <p className="py-4 text-center text-sm text-tt-muted">{t("common.loading")}</p>
              ) : (results.data ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-tt-muted">{t("admin.empty")}</p>
              ) : (
                (results.data as LineRow[]).map((line) => <LineListRow key={line.id} line={line} showTerminal />)
              )}
              {(results.data ?? []).length > 0 && (
                <Link
                  to="/carte"
                  className="tt-press my-2 flex h-12 items-center justify-center rounded-xl bg-tt-green text-base font-semibold text-white"
                >
                  {t("track.live")} →
                </Link>
              )}
            </div>
          )}
        </section>

        {(alerts.data ?? []).length > 0 && (
          <section aria-label={t("home.alerts")}>
            <h2 className="text-lg font-semibold text-tt-ink">{t("home.alerts")}</h2>
            <div className="mt-2 flex flex-col gap-2">
              {(alerts.data ?? []).slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-[#f2c9c9] bg-tt-red-soft px-4 py-3"
                >
                  <span aria-hidden>⚠️</span>
                  <p className="text-sm font-semibold text-[#8a2525]">
                    {t(a.template as never)}
                    {a.line_code ? ` — ${t("tt.line")} ${a.line_code}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-tt-ink">{t("home.quick")}</h2>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {modes.map((m) => {
              const c = modeColor(m.mode);
              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => navigate(`/horaires?mode=${m.mode}`)}
                  className="tt-card tt-press flex min-h-24 flex-col items-start justify-between p-4 text-start hover:border-tt-green"
                >
                  <span className={`h-3 w-8 rounded-full ${c.bg}`} aria-hidden />
                  <span>
                    <span className="block text-base font-bold text-tt-ink">{m.label}</span>
                    <span className="block text-xs text-tt-muted">{m.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Link to="/carte" className="tt-card tt-press flex items-center gap-4 p-5 hover:border-tt-green">
            <span className="tt-pulse grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tt-green text-xl text-white" aria-hidden>
              📍
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-tt-ink">{t("map.title")}</span>
              <span className="block truncate text-sm text-tt-muted">{t("map.gps_live")} · {t("map.demo_vehicle")}</span>
            </span>
            <span className="font-bold text-tt-green" aria-hidden>→</span>
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-tt-ink">{t("home.favorites")}</h2>
          {favorites.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-tt-line bg-white px-4 py-5 text-sm text-tt-muted">
              {t("home.no_favorites")}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {favorites.map((f) => (
                <Link
                  key={f.id}
                  to={`/horaires?mode=${f.mode}`}
                  className="tt-press inline-flex min-h-12 items-center gap-2 rounded-xl border border-tt-line bg-white px-4 text-sm font-semibold text-tt-ink"
                >
                  <ModeBadge mode={f.mode} />
                  {f.code} · {f.destination}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <Link to="/signaler" className="tt-press flex items-center gap-4 rounded-2xl bg-tt-ink p-5 text-white">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-xl" aria-hidden>
              📢
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">{t("home.report_cta")}</span>
              <span className="block text-sm text-white/70">{t("home.report_sub")}</span>
            </span>
            <span aria-hidden>→</span>
          </Link>
        </section>
        <p className="pb-2 text-center text-xs text-tt-muted">
          {lang === "ar" ? "نقل تونس · شركة نقل تونس" : "Société des Transports de Tunis"} · N° vert 80 100 345
        </p>
      </div>
    </AppShell>
  );
}
