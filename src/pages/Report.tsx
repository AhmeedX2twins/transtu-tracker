import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useI18n, type I18nKey } from "../lib/i18n";
import { getReportStatuses, submitReport } from "../lib/api";

const REPORTS_KEY = "transtu.reports";
function readMyRefs(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(REPORTS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

const CATEGORIES: { key: string; label: I18nKey }[] = [
  { key: "seat", label: "report.cat.seat" },
  { key: "clean", label: "report.cat.clean" },
  { key: "ac", label: "report.cat.ac" },
  { key: "security", label: "report.cat.security" },
  { key: "other", label: "report.cat.other" },
];

export default function ReportIssue() {
  const { t } = useI18n();
  const [category, setCategory] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lineCode, setLineCode] = useState("");
  const [contact, setContact] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [refCode, setRefCode] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [myRefs, setMyRefs] = useState<string[]>([]);
  useEffect(() => setMyRefs(readMyRefs()), []);

  const statuses = useQuery({
    queryKey: ["my-reports", myRefs],
    queryFn: () => getReportStatuses(myRefs),
    enabled: myRefs.length > 0,
  });

  function onPickPhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      // Downscale client-side so mobile photos fit the 2.5 MB transport cap.
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit() {
    const title = category ? t(CATEGORIES.find((c) => c.key === category)!.label) : customTitle.trim();
    if (!title) return;
    setState("sending");
    try {
      let pos: { lat?: number; lng?: number } = {};
      // GPS is auto-attached when already permitted; never blocks submission.
      if ("geolocation" in navigator && "permissions" in navigator) {
        try {
          const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (perm.state === "granted") {
            pos = await new Promise((resolve) =>
              navigator.geolocation.getCurrentPosition(
                (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                () => resolve({}),
                { timeout: 3000 },
              ),
            );
          }
        } catch {
          /* ignore */
        }
      }
      const res = await submitReport({
        title,
        category: category ?? "other",
        description: description.trim() || undefined,
        line_code: lineCode.trim() || undefined,
        contact: contact.trim() || undefined,
        photo_data_url: photo ?? undefined,
        ...pos,
      });
      setRefCode(res.ref_code);
      const next = [res.ref_code, ...readMyRefs()].slice(0, 20);
      window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      setMyRefs(next);
      setState("done");
      setCategory(null);
      setCustomTitle("");
      setDescription("");
      setLineCode("");
      setContact("");
      setPhoto(null);
    } catch {
      setState("error");
    }
  }

  return (
    <AppShell>
      <div className="tt-fade-in flex flex-col gap-5">
        <div>
          <h1 className="text-[26px] font-bold text-tt-ink">{t("report.title")}</h1>
          <p className="mt-1 text-sm text-tt-muted">{t("report.anonymous")}</p>
        </div>
        {state === "done" && refCode ? (
          <div className="tt-card flex flex-col items-center gap-3 p-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-tt-green-soft text-3xl" aria-hidden>
              ✅
            </span>
            <p className="text-lg font-bold text-tt-ink">{t("report.done")}</p>
            <p className="text-sm text-tt-muted">
              {t("report.ref")} : <span className="font-bold text-tt-ink">{refCode}</span>
            </p>
            <button
              type="button"
              onClick={() => setState("idle")}
              className="tt-press mt-2 min-h-12 rounded-xl bg-tt-green px-6 text-base font-semibold text-white"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <section className="tt-card p-5">
              <h2 className="text-base font-bold text-tt-ink">{t("report.step_what")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(category === c.key ? null : c.key)}
                    className={`tt-press min-h-12 rounded-full border px-4 text-sm font-semibold ${
                      category === c.key
                        ? "border-tt-green bg-tt-green-soft text-tt-green"
                        : "border-tt-line bg-white text-tt-ink"
                    }`}
                  >
                    {t(c.label)}
                  </button>
                ))}
              </div>
              {category === "other" && (
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={t("report.desc_ph")}
                  className="mt-3 h-12 w-full rounded-xl border border-tt-line px-4 text-base outline-none focus:border-tt-green"
                />
              )}
              <label className="mt-4 block text-sm font-semibold text-tt-muted">
                {t("report.line")}
                <input
                  value={lineCode}
                  onChange={(e) => setLineCode(e.target.value)}
                  placeholder={t("report.line_ph")}
                  className="mt-1 h-12 w-full rounded-xl border border-tt-line px-4 text-base font-normal text-tt-ink outline-none focus:border-tt-green"
                />
              </label>
              <label className="mt-3 block text-sm font-semibold text-tt-muted">
                {t("report.desc")}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("report.desc_ph")}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-tt-line px-4 py-3 text-base font-normal text-tt-ink outline-none focus:border-tt-green"
                />
              </label>
            </section>
            <section className="tt-card p-5">
              <h2 className="text-base font-bold text-tt-ink">{t("report.step_photo")}</h2>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
              {photo && (
                <img src={photo} alt="" className="mt-3 max-h-56 w-full rounded-xl border border-tt-line object-cover" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="tt-press mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-tt-green bg-tt-green-soft px-4 text-base font-semibold text-tt-green"
              >
                📷 {photo ? t("report.photo_change") : t("report.photo_add")}
              </button>
            </section>
            <section className="tt-card p-5">
              <h2 className="text-base font-bold text-tt-ink">{t("report.step_send")}</h2>
              <label className="mt-3 block text-sm font-semibold text-tt-muted">
                {t("report.contact")}
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t("report.contact_ph")}
                  className="mt-1 h-12 w-full rounded-xl border border-tt-line px-4 text-base font-normal text-tt-ink outline-none focus:border-tt-green"
                />
              </label>
              {state === "error" && (
                <p className="mt-3 rounded-xl bg-tt-red-soft px-4 py-3 text-sm font-semibold text-[#8a2525]">
                  {t("common.error")}
                </p>
              )}
              <button
                type="button"
                disabled={state === "sending" || (!category && !customTitle.trim())}
                onClick={() => void onSubmit()}
                className="tt-press mt-4 min-h-14 w-full rounded-xl bg-tt-green text-base font-bold text-white disabled:opacity-40"
              >
                {state === "sending" ? t("report.sending") : t("report.submit")}
              </button>
            </section>
          </>
        )}

        {myRefs.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-tt-ink">{t("report.mine")}</h2>
            <div className="tt-card divide-y divide-tt-line px-4">
              {(statuses.data ?? []).map((r) => (
                <div key={r.ref_code} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-tt-ink">{r.title}</p>
                    <p className="text-xs text-tt-muted">{r.ref_code}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-tt-yellow-soft px-3 py-1 text-xs font-bold text-[#8a6a00]">
                    {r.status === "resolved"
                      ? t("report.status.resolved")
                      : r.status === "processing"
                        ? t("report.status.processing")
                        : t("report.status.sent")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
