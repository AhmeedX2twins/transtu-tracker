import { useEffect, useState } from "react";
import { AppShell, modeColor } from "../components/AppShell";
import { useI18n } from "../lib/i18n";
import { LiveMap, useVehicleFix } from "../components/LiveMap";

type ModeKey = "train" | "bus" | "metro";

// Demo vehicle IDs — one pilot vehicle per mode, matching the "V-DEMO-1" id
// used by the driver alert endpoint while the hardware fleet is one unit.
const DEMO_VEHICLE: Record<ModeKey, string> = {
  train: "V-DEMO-1",
  bus: "V-DEMO-1",
  metro: "V-DEMO-1",
};

function useUserLocation() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPos(null),
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return pos;
}

export default function LiveMapPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<ModeKey>("train");
  const vehicle = useVehicleFix(DEMO_VEHICLE[mode]);
  const userLocation = useUserLocation();

  const modes: { key: ModeKey; label: string }[] = [
    { key: "train", label: t("mode.train") },
    { key: "bus", label: t("mode.bus") },
    { key: "metro", label: t("mode.metro") },
  ];

  return (
    <AppShell title={t("map.title")}>
      <div className="tt-fade-in flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[26px] font-bold text-tt-ink">{t("map.title")}</h1>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-tt-green-soft px-3 py-1 text-xs font-bold text-tt-green">
            <span className="tt-pulse h-2 w-2 rounded-full bg-tt-green" aria-hidden />
            {t("alert.live_badge")}
          </span>
        </div>

        <div className="tt-card flex gap-1 p-1.5">
          {modes.map((m) => {
            const active = mode === m.key;
            const c = modeColor(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`tt-press min-h-11 flex-1 rounded-xl text-sm font-bold ${
                  active ? `text-white ${c.bg}` : "text-tt-muted"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <LiveMap vehicle={vehicle} userLocation={userLocation} />

        <div className="tt-card flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tt-green-soft text-lg" aria-hidden>
            📍
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-tt-ink">
              {vehicle.stale || vehicle.error ? t("map.stale") : t("map.eta")}
            </p>
            <p className="text-xs text-tt-muted">
              {vehicle.speedKmh != null
                ? `${t("map.speed")}: ${Math.round(vehicle.speedKmh)} km/h`
                : t("map.select_line")}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
