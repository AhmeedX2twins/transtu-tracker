// Pure client-side mock data for Vercel static deployment
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

const terminals: TerminalRow[] = [
  { id: 1, slug: "tunis-marine", name: "Tunis Marine", mode: "metro", sort: 1 },
  { id: 2, slug: "barcelone", name: "Barcelone", mode: "bus", sort: 2 },
  { id: 3, slug: "tgm-station", name: "Tunis Marine (TGM)", mode: "train", sort: 3 }
];

const lines: LineRow[] = [
  { id: 1, mode: "metro", operator: "TRANSTU", train_kind: null, code: "1", destination: "Ben Arous", terminal_id: 1, terminal_name: "Tunis Marine", route_summary: "Ligne 1", first_departure: "05:00", last_departure: "22:00", frequency_min: 10 },
  { id: 2, mode: "metro", operator: "TRANSTU", train_kind: null, code: "2", destination: "Ariana", terminal_id: 1, terminal_name: "Tunis Marine", route_summary: "Ligne 2", first_departure: "05:15", last_departure: "22:15", frequency_min: 12 },
  { id: 3, mode: "metro", operator: "TRANSTU", train_kind: null, code: "4", destination: "Khereddine", terminal_id: 1, terminal_name: "Tunis Marine", route_summary: "Ligne 4", first_departure: "05:30", last_departure: "21:30", frequency_min: 15 },
  { id: 4, mode: "bus", operator: "TRANSTU", train_kind: null, code: "28C", destination: "Carthage", terminal_id: 2, terminal_name: "Barcelone", route_summary: "Bus 28C", first_departure: "06:00", last_departure: "20:00", frequency_min: 20 },
  { id: 5, mode: "train", operator: "TRANSTU", train_kind: "tgm", code: "TGM", destination: "La Marsa Plage", terminal_id: 3, terminal_name: "Tunis Marine (TGM)", route_summary: "TGM", first_departure: "04:00", last_departure: "23:00", frequency_min: 15 },
  { id: 6, mode: "train", operator: "SNCFT", train_kind: "banlieue", code: "Ligne A", destination: "Erriadh", terminal_id: null, terminal_name: null, route_summary: "Banlieue Sud", first_departure: "05:00", last_departure: "22:00", frequency_min: 30 }
];

export async function getNetwork(): Promise<{ terminals: TerminalRow[]; lines: LineRow[] }> {
  return { terminals, lines };
}

export async function searchLines(query: string): Promise<LineRow[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return lines.filter(l => l.code.toLowerCase().includes(q) || l.destination.toLowerCase().includes(q));
}

export type PublicAlert = { id: number; template: string; line_code: string | null; created_at: string };
export async function getActiveAlerts(): Promise<PublicAlert[]> {
  return [{ id: 1, template: "alert.traffic", line_code: "28C", created_at: new Date().toISOString() }];
}

export type ReportInput = { title: string; category?: string; description?: string; line_code?: string; contact?: string; lat?: number; lng?: number; photo_data_url?: string; };
export async function submitReport(data: ReportInput): Promise<{ ref_code: string }> {
  return { ref_code: `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
}

export type ReportStatus = { ref_code: string; title: string; status: string; created_at: string };
export async function getReportStatuses(refs: string[]): Promise<ReportStatus[]> {
  return refs.map(r => ({ ref_code: r, title: "Mock Report", status: "processing", created_at: new Date().toISOString() }));
}

export async function driverLogin(employee_id: string, pin: string) {
  return { ok: true, token: "mock-token", name: "Chauffeur Démo", on_duty: true };
}

export async function directionLogin(email: string, password: string) {
  return { ok: true, token: "mock-token", name: "Direction Démo" };
}

export async function sendDriverAlert(token: string, template: string, line_code?: string) { return { ok: true }; }
export async function setDutyStatus(token: string, on_duty: boolean) { return { ok: true }; }

export type AdminReport = { id: number; ref_code: string; title: string; category: string | null; description: string | null; photo_key: string | null; line_code: string | null; contact: string | null; status: string; created_at: string; };
export type AdminAlert = { id: number; template: string; line_code: string | null; vehicle_id: string | null; active: number; created_at: string; driver_name: string | null; };
export type AdminOverview = { reports: AdminReport[]; alerts: AdminAlert[]; stats: { open_reports: number; active_alerts: number; line_count: number } | null; };

export async function adminOverview(token: string): Promise<AdminOverview> {
  return { reports: [], alerts: [], stats: { open_reports: 0, active_alerts: 1, line_count: 6 } };
}

export async function setReportStatus(token: string, id: number, status: "processing" | "resolved" | "delete") { return { ok: true }; }
export async function resolveAlert(token: string, id: number) { return { ok: true }; }
export async function updateLineSchedule(token: string, id: number, first_departure: string | null, last_departure: string | null, frequency_min: number | null) { return { ok: true }; }
