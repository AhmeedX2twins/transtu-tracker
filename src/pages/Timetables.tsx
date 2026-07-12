import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell, LineListRow, modeColor } from "../components/AppShell";
import { useI18n } from "../lib/i18n";
import { getNetwork, type LineRow, type TerminalRow } from "../lib/api";

type ModeKey = "bus" | "metro" | "train";
type TrainSub = "tgm" | "sncft";

export default function Timetables() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode");
  const [mode, setMode] = useState<ModeKey>(
    initialMode === "bus" || initialMode === "metro" || initialMode === "train" ? initialMode : "bus",
  );
  const [trainSub, setTrainSub] = useState<TrainSub>("tgm");
  const [openTerminal, setOpenTerminal] = useState<number | null>(null);

  const network = useQuery({
    queryKey: ["network"],
    queryFn: () => getNetwork(),
    staleTime: 5 * 60_000,
  });

  const terminals = network.data?.terminals ?? [];
  const lines = network.data?.lines ?? [];

  const filteredLines = useMemo(() => {
    let ls = lines.filter((l) => l.mode === mode);
    if (mode === "train") {
      ls = ls.filter((l) => (trainSub === "tgm" ? l.train_kind === "tgm" : l.train_kind !== "tgm"));
    }
    return ls;
  }, [lines, mode, trainSub]);

  const terminalsForMode = useMemo(() => {
    const ids = new Set(filteredLines.map((l) => l.terminal_id));
    return terminals.filter((tm) => ids.has(tm.id));
  }, [terminals, filteredLines]);

  const byTerminal = useMemo(() => {
    const map = new Map<number, LineRow[]>();
    for (const l of filteredLines) {
      if (l.terminal_id == null) continue;
      const arr = map.get(l.terminal_id) ?? [];
      arr.push(l);
      map.set(l.terminal_id, arr);
    }
    return map;
  }, [filteredLines]);

  const modes: { key: ModeKey; label: string }[] = [
    { key: "bus", label: t("mode.bus") },
    { key: "metro", label: t("mode.metro") },
    { key: "train", label: t("mode.train") },
  ];

  return (
    <AppShell title={t("tt.title")}>
      <div className="tt-fade-in flex flex-col gap-4">
        <h1 className="text-[26px] font-bold text-tt-ink">{t("tt.title")}</h1>

        <div className="tt-card flex gap-1 p-1.5" role="tablist" aria-label={t("tt.title")}>
          {modes.map((m) => {
            const active = mode === m.key;
            const c = modeColor(m.key);
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setMode(m.key);
                  setOpenTerminal(null);
                }}
                className={`tt-press min-h-11 flex-1 rounded-xl text-sm font-bold ${
                  active ? `text-white ${c.bg}` : "text-tt-muted"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === "train" && (
          <div className="flex gap-2">
            {(["tgm", "sncft"] as TrainSub[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTrainSub(s)}
                className={`tt-press min-h-10 rounded-lg border px-4 text-sm font-semibold ${
                  trainSub === s
                    ? "border-tt-yellow bg-tt-yellow-soft text-[#8a6a00]"
                    : "border-tt-line bg-white text-tt-muted"
                }`}
              >
                {s === "tgm" ? t("schedule.train.tgm") : t("schedule.train.sncft")}
              </button>
            ))}
          </div>
        )}

        {network.isLoading ? (
          <p className="py-8 text-center text-sm text-tt-muted">{t("common.loading")}</p>
        ) : terminalsForMode.length === 0 ? (
          <p className="py-8 text-center text-sm text-tt-muted">{t("schedule.empty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {terminalsForMode.map((tm: TerminalRow) => {
              const open = openTerminal === tm.id;
              const linesHere = byTerminal.get(tm.id) ?? [];
              return (
                <div key={tm.id} className="tt-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenTerminal(open ? null : tm.id)}
                    aria-expanded={open}
                    className="tt-press flex min-h-14 w-full items-center justify-between px-4 py-3 text-start"
                  >
                    <span>
                      <span className="block text-base font-bold text-tt-ink">{tm.name}</span>
                      <span className="block text-xs text-tt-muted">
                        {linesHere.length} {t("tt.line").toLowerCase()}
                        {linesHere.length > 1 ? "s" : ""}
                      </span>
                    </span>
                    <span className={`text-tt-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
                      ⌄
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-tt-line px-4">
                      {linesHere.map((line) => (
                        <LineListRow key={line.id} line={line} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
