import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useI18n, type I18nKey } from "../lib/i18n";
import {
  driverLogin,
  directionLogin,
  sendDriverAlert,
  setDutyStatus,
  adminOverview,
  setReportStatus,
  resolveAlert,
} from "../lib/api";

type Role = "driver" | "direction";
type Session = { token: string; role: Role; name: string };
const SESSION_KEY = "transtu.staff_session";

function loadSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
function saveSession(s: Session | null) {
  try {
    if (s) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export default function StaffPortal() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [pickedRole, setPickedRole] = useState<Role | null>(null);

  useEffect(() => setSession(loadSession()), []);

  function logout() {
    saveSession(null);
    setSession(null);
    setPickedRole(null);
  }

  return (
    <AppShell title={t("staff.portal")}>
      <div className="tt-fade-in flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold text-tt-ink">{t("staff.portal")}</h1>
          {session && (
            <button type="button" onClick={logout} className="text-sm font-semibold text-tt-muted underline">
              {t("staff.logout")}
            </button>
          )}
        </div>

        {!session && !pickedRole && <RoleSelector onPick={setPickedRole} label={t("staff.role_select")} />}

        {!session && pickedRole === "driver" && (
          <DriverLogin
            onSuccess={(s) => {
              saveSession(s);
              setSession(s);
            }}
          />
        )}

        {!session && pickedRole === "direction" && (
          <DirectionLogin
            onSuccess={(s) => {
              saveSession(s);
              setSession(s);
            }}
          />
        )}

        {session?.role === "driver" && <DriverPanel session={session} />}
        {session?.role === "direction" && <DirectionPanel session={session} />}
      </div>
    </AppShell>
  );
}

function RoleSelector({ onPick, label }: { onPick: (r: Role) => void; label: string }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-tt-muted">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onPick("driver")}
          className="tt-card tt-press flex min-h-28 flex-col items-center justify-center gap-2 p-4"
        >
          <span className="text-3xl" aria-hidden>🚌</span>
          <span className="text-base font-bold text-tt-ink">{t("staff.driver")}</span>
        </button>
        <button
          type="button"
          onClick={() => onPick("direction")}
          className="tt-card tt-press flex min-h-28 flex-col items-center justify-center gap-2 p-4"
        >
          <span className="text-3xl" aria-hidden>🗂️</span>
          <span className="text-base font-bold text-tt-ink">{t("staff.direction")}</span>
        </button>
      </div>
    </div>
  );
}

function DriverLogin({ onSuccess }: { onSuccess: (s: Session) => void }) {
  const { t } = useI18n();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(false);
    try {
      const res = await driverLogin(employeeId, pin);
      if (res.ok && res.token && res.name) onSuccess({ token: res.token, role: "driver", name: res.name });
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tt-card flex flex-col gap-3 p-5">
      <p className="text-xs text-tt-muted">Démo : matricule D-0001, PIN 1234</p>
      <label className="text-sm font-semibold text-tt-ink">
        {t("staff.employee_id")}
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-tt-line px-4 text-base"
        />
      </label>
      <label className="text-sm font-semibold text-tt-ink">
        {t("staff.pin")}
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-tt-line px-4 text-base"
        />
      </label>
      {error && <p className="text-sm font-semibold text-tt-red">{t("staff.login_error")}</p>}
      <button
        type="button"
        disabled={busy || !employeeId || !pin}
        onClick={() => void submit()}
        className="tt-press mt-1 min-h-12 rounded-xl bg-tt-green text-base font-bold text-white disabled:opacity-40"
      >
        {t("staff.login")}
      </button>
    </div>
  );
}

function DirectionLogin({ onSuccess }: { onSuccess: (s: Session) => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(false);
    try {
      const res = await directionLogin(email, password);
      if (res.ok && res.token && res.name) onSuccess({ token: res.token, role: "direction", name: res.name });
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tt-card flex flex-col gap-3 p-5">
      <p className="text-xs text-tt-muted">Démo : direction@transtu.tn / transtu2026</p>
      <label className="text-sm font-semibold text-tt-ink">
        {t("staff.email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-tt-line px-4 text-base"
        />
      </label>
      <label className="text-sm font-semibold text-tt-ink">
        {t("staff.password")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-tt-line px-4 text-base"
        />
      </label>
      {error && <p className="text-sm font-semibold text-tt-red">{t("staff.login_error")}</p>}
      <button
        type="button"
        disabled={busy || !email || !password}
        onClick={() => void submit()}
        className="tt-press mt-1 min-h-12 rounded-xl bg-tt-green text-base font-bold text-white disabled:opacity-40"
      >
        {t("staff.login")}
      </button>
    </div>
  );
}

const ALERT_TEMPLATES: I18nKey[] = [
  "alert.breakdown",
  "alert.accident",
  "alert.delay",
  "alert.full",
  "alert.detour",
  "alert.traffic",
];

function DriverPanel({ session }: { session: Session }) {
  const { t } = useI18n();
  const [onDuty, setOnDuty] = useState(false);
  const [sentFlash, setSentFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleDuty() {
    const next = !onDuty;
    setOnDuty(next);
    await setDutyStatus(session.token, next);
  }

  async function fireAlert(template: I18nKey) {
    setBusy(true);
    try {
      await sendDriverAlert(session.token, template);
      setSentFlash(template);
      window.setTimeout(() => setSentFlash(null), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="tt-card flex items-center justify-between p-4">
        <span className="text-base font-semibold text-tt-ink">{session.name}</span>
        <button
          type="button"
          onClick={() => void toggleDuty()}
          className={`tt-press min-h-10 rounded-full px-4 text-sm font-bold ${
            onDuty ? "bg-tt-green-soft text-tt-green" : "bg-tt-line/60 text-tt-muted"
          }`}
        >
          {onDuty ? t("staff.on_duty") : t("staff.off_duty")}
        </button>
      </div>

      {sentFlash && (
        <p className="rounded-xl bg-tt-green-soft px-4 py-2 text-sm font-semibold text-tt-green">
          {t("staff.alert_sent")}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {ALERT_TEMPLATES.map((key) => (
          <button
            key={key}
            type="button"
            disabled={busy}
            onClick={() => void fireAlert(key)}
            className="tt-press tt-card flex min-h-24 flex-col items-center justify-center gap-1 p-3 text-center disabled:opacity-50"
          >
            <span className="text-2xl" aria-hidden>⚠️</span>
            <span className="text-sm font-bold text-tt-ink">{t(key)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DirectionPanel({ session }: { session: Session }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminOverview(session.token),
    refetchInterval: 30_000,
  });

  async function updateStatus(id: number, status: "processing" | "resolved" | "delete") {
    await setReportStatus(session.token, id, status);
    void qc.invalidateQueries({ queryKey: ["admin-overview"] });
  }
  async function resolve(id: number) {
    await resolveAlert(session.token, id);
    void qc.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  if (overview.isLoading) return <p className="py-8 text-center text-sm text-tt-muted">{t("common.loading")}</p>;
  const data = overview.data;
  if (!data) return <p className="py-8 text-center text-sm text-tt-muted">{t("common.error")}</p>;

  const { reports, alerts, stats } = data;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t("staff.stats.open_reports")} value={stats?.open_reports ?? 0} />
        <StatCard label={t("staff.stats.active_alerts")} value={stats?.active_alerts ?? 0} />
        <StatCard label={t("staff.stats.lines")} value={stats?.line_count ?? 0} />
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-tt-ink">{t("staff.alerts")}</h2>
        <div className="tt-card divide-y divide-tt-line px-4">
          {alerts.length === 0 && <p className="py-6 text-center text-sm text-tt-muted">{t("admin.empty")}</p>}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tt-ink">
                  {t(a.template as I18nKey)} {a.line_code ? `· ${a.line_code}` : ""}
                </p>
                <p className="truncate text-xs text-tt-muted">
                  {a.driver_name ?? "—"} · {a.created_at}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void resolve(a.id)}
                className="tt-press min-h-10 rounded-lg bg-tt-green-soft px-3 text-sm font-semibold text-tt-green"
              >
                {t("staff.resolve")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-tt-ink">{t("staff.reports")}</h2>
        <div className="tt-card divide-y divide-tt-line px-4">
          {reports.length === 0 && <p className="py-6 text-center text-sm text-tt-muted">{t("admin.empty")}</p>}
          {reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-tt-ink">{r.title}</p>
                  <p className="text-xs text-tt-muted">
                    {r.ref_code} · {r.created_at}
                  </p>
                </div>
                <span className="rounded-full bg-tt-yellow-soft px-3 py-1 text-xs font-bold text-[#8a6a00]">
                  {r.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus(r.id, "processing")}
                  className="tt-press min-h-9 rounded-lg bg-tt-blue-soft px-3 text-xs font-semibold text-tt-blue"
                >
                  {t("staff.mark_processing")}
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(r.id, "resolved")}
                  className="tt-press min-h-9 rounded-lg bg-tt-green-soft px-3 text-xs font-semibold text-tt-green"
                >
                  {t("staff.mark_resolved")}
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(r.id, "delete")}
                  className="tt-press min-h-9 rounded-lg bg-tt-red-soft px-3 text-xs font-semibold text-tt-red"
                >
                  {t("staff.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="tt-card p-4 text-center">
      <p className="text-2xl font-bold text-tt-ink">{value}</p>
      <p className="mt-1 text-xs text-tt-muted">{label}</p>
    </div>
  );
}
