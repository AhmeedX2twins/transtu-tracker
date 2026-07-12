/* TRANSTU Tracker — live tracking: Leaflet map (client-only, dynamically
 * imported — SSR-safe) + the existing Trackini GPS pipeline (Supabase
 * PostgREST read, anon key — public by design; RLS on the table is the
 * security boundary, and the key only ever reads). Polled every 5 s per the
 * prototype contract; upgrade path to a Supabase Realtime subscription is
 * noted below.
 *
 * ASSUMPTION TO VERIFY against the real Trackini schema before go-live:
 * table `vehicle_positions` with columns (vehicle_id text, lat float8,
 * lng float8, updated_at timestamptz). Adjust POSITIONS_TABLE / column
 * names below if the real schema differs.
 */
import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import { useI18n } from "../lib/i18n";

const SUPABASE_URL = "https://wmoksvlrrhyjphtzjzal.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtb2tzdmxycmh5anBodHpqemFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDUzMTksImV4cCI6MjA5NDI4MTMxOX0.zWDWpytKbSh4c-VY-ZdZueGdWkyQeCGu7IYdqHoOKKQ";
const POSITIONS_TABLE = "vehicle_positions";
const POLL_MS = 5_000;
const STALE_AFTER_MS = 30_000;

export type VehicleFix = {
  lat: number;
  lng: number;
  updatedAt: Date | null;
  /** km/h computed from consecutive fixes; null until two fixes exist */
  speedKmh: number | null;
  stale: boolean;
  error: boolean;
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const EMPTY_FIX: VehicleFix = { lat: 0, lng: 0, updatedAt: null, speedKmh: null, stale: true, error: false };

/** Polls the Trackini Supabase table for one vehicle's latest fix. */
export function useVehicleFix(vehicleId: string): VehicleFix {
  const [fix, setFix] = useState<VehicleFix>(EMPTY_FIX);
  const prevRef = useRef<{ lat: number; lng: number; t: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const url = `${SUPABASE_URL}/rest/v1/${POSITIONS_TABLE}?vehicle_id=eq.${encodeURIComponent(
          vehicleId,
        )}&select=lat,lng,updated_at&order=updated_at.desc&limit=1`;
        const res = await fetch(url, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        const rows = (await res.json()) as { lat: number; lng: number; updated_at: string }[];
        if (cancelled) return;
        if (!rows.length) {
          setFix((f) => ({ ...f, error: false, stale: true }));
          return;
        }
        const row = rows[0];
        const updatedAt = new Date(row.updated_at);
        const now = Date.now();
        const stale = now - updatedAt.getTime() > STALE_AFTER_MS;

        let speedKmh: number | null = null;
        const prev = prevRef.current;
        if (prev) {
          const km = haversineKm(prev, { lat: row.lat, lng: row.lng });
          const hours = (now - prev.t) / 3_600_000;
          if (hours > 0) speedKmh = km / hours;
        }
        prevRef.current = { lat: row.lat, lng: row.lng, t: now };
        setFix({ lat: row.lat, lng: row.lng, updatedAt, speedKmh, stale, error: false });
      } catch {
        if (!cancelled) setFix((f) => ({ ...f, error: true }));
      }
    }

    void poll();
    timer = window.setInterval(poll, POLL_MS);
    // Upgrade path: replace this interval with a Supabase Realtime channel
    // subscription (`supabase.channel(...).on('postgres_changes', ...)`) once
    // the project is on a plan/tier that supports it — same fix shape, no UI
    // changes needed downstream.
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [vehicleId]);

  return fix;
}

/** Client-only Leaflet map. Dynamically imports `leaflet` so it never runs
 *  during SSR (Leaflet touches `window`/`document` at import time). */
export function LiveMap({
  vehicle,
  userLocation,
}: {
  vehicle: VehicleFix;
  userLocation: { lat: number; lng: number } | null;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const vehicleMarkerRef = useRef<LeafletNS.Marker | null>(null);
  const userMarkerRef = useRef<LeafletNS.Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Init map once, client-side only.
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [36.8065, 10.1815], // Tunis
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Vehicle marker.
  useEffect(() => {
    if (!ready || !mapRef.current || vehicle.error || (vehicle.lat === 0 && vehicle.lng === 0)) return;
    void import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;
      const icon = L.divIcon({
        className: "",
        html: `<div class="tt-marker">🚌</div>`,
        iconSize: [38, 38],
      });
      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = L.marker([vehicle.lat, vehicle.lng], { icon }).addTo(map);
        map.setView([vehicle.lat, vehicle.lng], 14);
      } else {
        vehicleMarkerRef.current.setLatLng([vehicle.lat, vehicle.lng]);
      }
    });
  }, [ready, vehicle.lat, vehicle.lng, vehicle.error]);

  // User marker.
  useEffect(() => {
    if (!ready || !mapRef.current || !userLocation) return;
    void import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;
      const icon = L.divIcon({ className: "", html: `<div class="tt-marker is-user"></div>`, iconSize: [20, 20] });
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    });
  }, [ready, userLocation]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[60vh] w-full overflow-hidden rounded-2xl border border-tt-line" />
      {(vehicle.error || (vehicle.lat === 0 && vehicle.lng === 0)) && (
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70 text-sm font-semibold text-tt-muted">
          {t("map.no_signal")}
        </div>
      )}
    </div>
  );
}
