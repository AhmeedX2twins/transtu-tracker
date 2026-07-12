/* App shell: brand header, bottom navigation (48px targets), first-launch
 * full-screen language picker, shared line row + favorites (device-local,
 * guest-first — no accounts). Adapted from the original Higgsfield version:
 * @tanstack/react-router -> react-router-dom, otherwise unchanged. */
import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useI18n, type I18nKey, type Lang } from "../lib/i18n";
import type { LineRow as LineData } from "../lib/api";

const FAV_KEY = "transtu.favorites";
export type Favorite = { id: number; mode: string; code: string; destination: string };

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(JSON.parse(raw) as Favorite[]);
    } catch {
      /* corrupt storage — start fresh */
    }
  }, []);
  const toggle = useCallback((line: Favorite) => {
    setFavorites((prev) => {
      const next = prev.some((f) => f.id === line.id)
        ? prev.filter((f) => f.id !== line.id)
        : [...prev, line];
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return { favorites, toggle };
}

export function modeColor(mode: string): { bg: string; soft: string; text: string } {
  if (mode === "metro") return { bg: "bg-tt-blue", soft: "bg-tt-blue-soft", text: "text-tt-blue" };
  if (mode === "train")
    return { bg: "bg-tt-yellow", soft: "bg-tt-yellow-soft", text: "text-[#8a6a00]" };
  return { bg: "bg-tt-green", soft: "bg-tt-green-soft", text: "text-tt-green" };
}

export function ModeBadge({ mode }: { mode: string }) {
  const { t } = useI18n();
  const c = modeColor(mode);
  const label =
    mode === "metro" ? t("mode.metro") : mode === "train" ? t("mode.train") : t("mode.bus");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold ${c.soft} ${c.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${c.bg}`} aria-hidden />
      {label}
    </span>
  );
}

export function LineListRow({
  line,
  showTerminal = false,
}: {
  line: LineData;
  showTerminal?: boolean;
}) {
  const { t } = useI18n();
  const { favorites, toggle } = useFavorites();
  const isFav = favorites.some((f) => f.id === line.id);
  const c = modeColor(line.mode);
  return (
    <div className="flex min-h-12 items-center gap-3 border-b border-tt-line px-1 py-2.5 last:border-b-0">
      <span
        className={`inline-flex h-9 min-w-12 items-center justify-center rounded-lg px-2 text-sm font-bold text-white ${c.bg}`}
      >
        {line.code}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-tt-ink">{line.destination}</p>
        <p className="truncate text-sm text-tt-muted">
          {line.operator === "SNCFT" ? "SNCFT · " : ""}
          {line.train_kind === "tgm" ? "TGM · " : ""}
          {showTerminal && line.terminal_name ? line.terminal_name : line.route_summary ?? ""}
          {line.frequency_min ? ` · ${t("schedule.frequency")} ${line.frequency_min} ${t("tt.min")}` : ""}
          {line.first_departure ? ` · ${line.first_departure} → ${line.last_departure ?? "…"}` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={() =>
          toggle({ id: line.id, mode: line.mode, code: line.code, destination: line.destination })
        }
        className={`tt-press grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl ${
          isFav ? "text-tt-yellow" : "text-tt-line hover:text-tt-muted"
        }`}
      >
        {isFav ? "★" : "☆"}
      </button>
    </div>
  );
}

function LanguageGate() {
  const { ready, chosen, setLang } = useI18n();
  if (!ready || chosen) return null;
  const options: { code: Lang; native: string; sub: string }[] = [
    { code: "fr", native: "Français", sub: "Langue par défaut" },
    { code: "ar", native: "العربية", sub: "واجهة كاملة من اليمين إلى اليسار" },
    { code: "en", native: "English", sub: "Full English interface" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-tt-bg px-6">
      <img
        src="/assets/logo-transtu.jpg"
        alt="TRANSTU"
        className="h-24 w-24 rounded-2xl object-contain"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-tt-ink">اختر لغتك</h1>
        <p className="mt-1 text-base text-tt-muted">Choisissez votre langue · Choose your language</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {options.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => setLang(o.code)}
            className="tt-card tt-press flex min-h-16 items-center justify-between px-5 py-3 text-start hover:border-tt-green"
          >
            <span>
              <span className="block text-lg font-semibold text-tt-ink">{o.native}</span>
              <span className="block text-sm text-tt-muted">{o.sub}</span>
            </span>
            <span className="text-tt-green" aria-hidden>
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const NAV: { to: string; key: I18nKey; icon: string }[] = [
  { to: "/", key: "nav.home", icon: "M12 3 3 10v11h6v-6h6v6h6V10Z" },
  {
    to: "/horaires",
    key: "nav.timetables",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.6 4.2 2.5-.8 1.3-4.9-3V7h1.5Z",
  },
  {
    to: "/carte",
    key: "nav.map",
    icon: "M9 3 3.5 5v16L9 19l6 2 5.5-2V3L15 5 9 3Zm0 2.2 6 2v11.6l-6-2V5.2Z",
  },
  { to: "/favoris", key: "nav.favorites", icon: "m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1L12 16.9 6.4 20l1.3-6.1L3 9.6l6.3-.7Z" },
  {
    to: "/parametres",
    key: "nav.settings",
    icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-2-1.2L16 2h-4l-.4 2.6a7.7 7.7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 7 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L12 22h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.2-.8.2-1.2Z",
  },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { t } = useI18n();
  const pathname = useLocation().pathname;
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col lg:max-w-5xl">
      <header className="sticky top-0 z-30 border-b border-tt-line bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/assets/logo-transtu.jpg"
              alt="TRANSTU — نقل تونس"
              className="h-10 w-10 rounded-xl border border-tt-line bg-white object-contain"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
            <span>
              <span className="block text-base font-bold leading-tight text-tt-ink">
                {title ?? t("app.name")}
              </span>
              <span className="block text-xs font-semibold text-tt-green">{t("app.tagline")}</span>
            </span>
          </Link>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-tt-green-soft px-3 py-1 text-xs font-bold text-tt-green">
            <span className="tt-pulse h-2 w-2 rounded-full bg-tt-green" aria-hidden />
            {t("alert.live_badge")}
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-tt-line bg-white/95 backdrop-blur"
      >
        <div className="mx-auto grid w-full max-w-3xl grid-cols-5 lg:max-w-5xl">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-1.5 text-[11px] font-semibold ${
                  active ? "text-tt-green" : "text-tt-muted"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                  <path d={item.icon} />
                </svg>
                {t(item.key)}
                <span
                  className={`mt-0.5 h-1 w-6 rounded-full ${active ? "bg-tt-green" : "bg-transparent"}`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </nav>
      <LanguageGate />
    </div>
  );
}
