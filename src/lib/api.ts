/* Thin fetch wrappers hitting the local Express API (server/index.js).
 * Same function names/shapes as the original Higgsfield server functions so
 * the rest of the app barely changed. Vite's dev proxy forwards /api to
 * http://localhost:8787 (see vite.config.ts), so relative paths just work. */

export type LineRow = {
  id: number;
  mode: "bus" | "metro" | "train";
  operator: string;
  train_kind: string | null;
  code: string;
  destination: string;
  terminal_id: number | null;
  terminal_name: string | null;
  route_summary: string | null;
  first_departure: string | null;
  last_departure: string | null;
  frequency_min: number | null;
};

export type TerminalRow = { id: number; slug: string; name: string; mode: string; sort: number };

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getNetwork(): Promise<{ terminals: TerminalRow[]; lines: LineRow[] }> {
  return j(await fetch("/api/network"));
}

export async function searchLines(query: string): Promise<LineRow[]> {
  return j(await fetch(`/api/search?q=${encodeURIComponent(query)}`));
}

export type PublicAlert = { id: number; template: string; line_code: string | null; created_at: string };
export async function getActiveAlerts(): Promise<PublicAlert[]> {
  return j(await fetch("/api/alerts"));
}

export type ReportInput = {
  title: string;
  category?: string;
  description?: string;
  line_code?: string;
  contact?: string;
  lat?: number;
  lng?: number;
  photo_data_url?: string;
};
export async function submitReport(data: ReportInput): Promise<{ ref_code: string }> {
  return j(
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

export type ReportStatus = { ref_code: string; title: string; status: string; created_at: string };
export async function getReportStatuses(refs: string[]): Promise<ReportStatus[]> {
  return j(
    await fetch("/api/report-statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs }),
    }),
  );
}

// ── Staff auth ────────────────────────────────────────────────────────────
export async function driverLogin(employee_id: string, pin: string) {
  return j<{ ok: boolean; token?: string; name?: string; on_duty?: boolean }>(
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id, pin }),
    }),
  );
}

export async function directionLogin(email: string, password: string) {
  return j<{ ok: boolean; token?: string; name?: string }>(
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function sendDriverAlert(token: string, template: string, line_code?: string) {
  return j<{ ok: true }>(
    await fetch("/api/driver/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, template, line_code }),
    }),
  );
}

export async function setDutyStatus(token: string, on_duty: boolean) {
  return j<{ ok: true }>(
    await fetch("/api/driver/duty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, on_duty }),
    }),
  );
}

// ── Direction / admin ────────────────────────────────────────────────────
export type AdminReport = {
  id: number;
  ref_code: string;
  title: string;
  category: string | null;
  description: string | null;
  photo_key: string | null;
  line_code: string | null;
  contact: string | null;
  status: string;
  created_at: string;
};
export type AdminAlert = {
  id: number;
  template: string;
  line_code: string | null;
  vehicle_id: string | null;
  active: number;
  created_at: string;
  driver_name: string | null;
};
export type AdminOverview = {
  reports: AdminReport[];
  alerts: AdminAlert[];
  stats: { open_reports: number; active_alerts: number; line_count: number } | null;
};

export async function adminOverview(token: string): Promise<AdminOverview> {
  return j(
    await fetch("/api/admin/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
  );
}

export async function setReportStatus(
  token: string,
  id: number,
  status: "processing" | "resolved" | "delete",
) {
  return j<{ ok: true }>(
    await fetch("/api/admin/report-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id, status }),
    }),
  );
}

export async function resolveAlert(token: string, id: number) {
  return j<{ ok: true }>(
    await fetch("/api/admin/alert-resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    }),
  );
}

export async function updateLineSchedule(
  token: string,
  id: number,
  first_departure: string | null,
  last_departure: string | null,
  frequency_min: number | null,
) {
  return j<{ ok: true }>(
    await fetch("/api/admin/line-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id, first_departure, last_departure, frequency_min }),
    }),
  );
}
