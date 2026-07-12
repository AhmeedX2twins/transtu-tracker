/* TRANSTU Tracker — i18n
 * FR is the source language (matches TRANSTU's own materials), AR is full
 * RTL, EN is a straight translation. No i18n library — this is a small,
 * fixed dictionary app; a context + localStorage is all it needs.
 */
import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar" | "en";

const DICT = {
  "app.name": { fr: "TRANSTU Tracker", ar: "متتبع نقل تونس", en: "TRANSTU Tracker" },
  "app.tagline": { fr: "Le réseau en un coup d'œil", ar: "الشبكة في لمحة", en: "The network at a glance" },

  "nav.home": { fr: "Accueil", ar: "الرئيسية", en: "Home" },
  "nav.timetables": { fr: "Horaires", ar: "المواقيت", en: "Timetables" },
  "nav.map": { fr: "Carte", ar: "الخريطة", en: "Map" },
  "nav.favorites": { fr: "Favoris", ar: "المفضلة", en: "Favorites" },
  "nav.settings": { fr: "Réglages", ar: "الإعدادات", en: "Settings" },

  "mode.bus": { fr: "Bus", ar: "حافلة", en: "Bus" },
  "mode.metro": { fr: "Métro", ar: "مترو", en: "Metro" },
  "mode.train": { fr: "Train", ar: "قطار", en: "Train" },

  "home.season": { fr: "Réseau TRANSTU", ar: "شبكة نقل تونس", en: "TRANSTU network" },
  "home.greeting.morning": { fr: "Bonjour", ar: "صباح الخير", en: "Good morning" },
  "home.greeting.evening": { fr: "Bonsoir", ar: "مساء الخير", en: "Good evening" },
  "home.where": { fr: "Où allez-vous ?", ar: "إلى أين تذهب؟", en: "Where are you headed?" },
  "search.placeholder": { fr: "Ligne, destination, station…", ar: "خط، وجهة، محطة…", en: "Line, destination, stop…" },
  "home.alerts": { fr: "Alertes en cours", ar: "تنبيهات حالية", en: "Current alerts" },
  "home.quick": { fr: "Accès rapide", ar: "وصول سريع", en: "Quick access" },
  "home.favorites": { fr: "Mes favoris", ar: "مفضلاتي", en: "My favorites" },
  "home.no_favorites": {
    fr: "Ajoutez une ligne en favori pour la retrouver ici.",
    ar: "أضف خطًا إلى المفضلة لتجده هنا.",
    en: "Add a line to favorites to find it here.",
  },
  "home.report_cta": { fr: "Signaler un incident", ar: "الإبلاغ عن حادثة", en: "Report an issue" },
  "home.report_sub": {
    fr: "Anonyme, en 3 étapes",
    ar: "بشكل مجهول، في 3 خطوات",
    en: "Anonymous, 3 steps",
  },

  "track.live": { fr: "Suivre en direct", ar: "تتبع مباشر", en: "Track live" },
  "map.title": { fr: "Carte en direct", ar: "الخريطة المباشرة", en: "Live map" },
  "map.gps_live": { fr: "Signal GPS en direct", ar: "إشارة GPS مباشرة", en: "Live GPS signal" },
  "map.demo_vehicle": { fr: "véhicule pilote", ar: "مركبة تجريبية", en: "pilot vehicle" },
  "map.select_line": { fr: "Sélectionnez une ligne pour suivre le véhicule", ar: "اختر خطًا لتتبع المركبة", en: "Select a line to track the vehicle" },
  "map.eta": { fr: "Arrivée estimée", ar: "الوصول المتوقع", en: "Estimated arrival" },
  "map.speed": { fr: "Vitesse", ar: "السرعة", en: "Speed" },
  "map.stale": { fr: "Signal ancien", ar: "إشارة قديمة", en: "Signal is stale" },
  "map.no_signal": { fr: "Aucun signal pour le moment", ar: "لا توجد إشارة حاليًا", en: "No signal right now" },

  "alert.live_badge": { fr: "EN DIRECT", ar: "مباشر", en: "LIVE" },
  "alert.breakdown": { fr: "Panne signalée", ar: "تم الإبلاغ عن عطل", en: "Breakdown reported" },
  "alert.accident": { fr: "Accident signalé", ar: "تم الإبلاغ عن حادث", en: "Accident reported" },
  "alert.delay": { fr: "Retard signalé", ar: "تم الإبلاغ عن تأخير", en: "Delay reported" },
  "alert.full": { fr: "Véhicule complet", ar: "المركبة ممتلئة", en: "Vehicle full" },
  "alert.detour": { fr: "Déviation en cours", ar: "تحويل جاري", en: "Detour in progress" },
  "alert.traffic": { fr: "Trafic dense", ar: "ازدحام مروري", en: "Heavy traffic" },

  "tt.title": { fr: "Horaires", ar: "المواقيت", en: "Timetables" },
  "tt.line": { fr: "Ligne", ar: "الخط", en: "Line" },
  "tt.min": { fr: "min", ar: "د", en: "min" },
  "schedule.frequency": { fr: "Toutes les", ar: "كل", en: "Every" },
  "schedule.first_last": { fr: "Premier → dernier départ", ar: "أول → آخر رحلة", en: "First → last departure" },
  "schedule.empty": {
    fr: "Aucune ligne trouvée pour ce filtre.",
    ar: "لم يتم العثور على أي خط.",
    en: "No lines found for this filter.",
  },
  "schedule.train.tgm": { fr: "TGM", ar: "TGM", en: "TGM" },
  "schedule.train.sncft": { fr: "SNCFT", ar: "الشركة الوطنية للسكك الحديدية", en: "SNCFT" },

  "fav.title": { fr: "Mes favoris", ar: "مفضلاتي", en: "My favorites" },
  "fav.empty": { fr: "Aucun favori pour l'instant", ar: "لا توجد مفضلات بعد", en: "No favorites yet" },
  "fav.hint": {
    fr: "Touchez l'étoile sur une ligne pour l'ajouter ici.",
    ar: "اضغط على النجمة بجانب الخط لإضافته هنا.",
    en: "Tap the star on a line to add it here.",
  },

  "report.cat.seat": { fr: "Siège abîmé", ar: "مقعد تالف", en: "Damaged seat" },
  "report.cat.clean": { fr: "Propreté", ar: "النظافة", en: "Cleanliness" },
  "report.cat.ac": { fr: "Climatisation", ar: "التكييف", en: "Air conditioning" },
  "report.cat.security": { fr: "Sécurité", ar: "الأمن", en: "Security" },
  "report.cat.other": { fr: "Autre", ar: "أخرى", en: "Other" },
  "report.title": { fr: "Signaler un incident", ar: "الإبلاغ عن حادثة", en: "Report an issue" },
  "report.anonymous": {
    fr: "Signalement anonyme — aucune information ne vous identifie.",
    ar: "بلاغ مجهول — لا تُجمع أي معلومة تعرّف بك.",
    en: "Anonymous report — nothing identifies you.",
  },
  "report.step_what": { fr: "1. Quel est le problème ?", ar: "١. ما هي المشكلة؟", en: "1. What's the issue?" },
  "report.step_photo": { fr: "2. Une photo ? (facultatif)", ar: "٢. صورة؟ (اختياري)", en: "2. A photo? (optional)" },
  "report.step_send": { fr: "3. Envoyer", ar: "٣. إرسال", en: "3. Send" },
  "report.line": { fr: "Ligne concernée", ar: "الخط المعني", en: "Line involved" },
  "report.line_ph": { fr: "ex : 27A, TGM, Ligne 2…", ar: "مثال: 27A، TGM، الخط 2…", en: "e.g. 27A, TGM, Line 2…" },
  "report.desc": { fr: "Détails (facultatif)", ar: "تفاصيل (اختياري)", en: "Details (optional)" },
  "report.desc_ph": { fr: "Décrivez ce que vous voyez…", ar: "صف ما تلاحظه…", en: "Describe what you see…" },
  "report.contact": { fr: "Contact (facultatif)", ar: "للتواصل (اختياري)", en: "Contact (optional)" },
  "report.contact_ph": { fr: "Téléphone ou e-mail", ar: "هاتف أو بريد إلكتروني", en: "Phone or email" },
  "report.photo_add": { fr: "Ajouter une photo", ar: "أضف صورة", en: "Add a photo" },
  "report.photo_change": { fr: "Changer la photo", ar: "تغيير الصورة", en: "Change photo" },
  "report.submit": { fr: "Envoyer le signalement", ar: "إرسال البلاغ", en: "Send report" },
  "report.sending": { fr: "Envoi…", ar: "جارٍ الإرسال…", en: "Sending…" },
  "report.done": { fr: "Signalement envoyé. Merci !", ar: "تم إرسال البلاغ. شكرًا!", en: "Report sent. Thank you!" },
  "report.ref": { fr: "Référence", ar: "المرجع", en: "Reference" },
  "report.mine": { fr: "Mes signalements", ar: "بلاغاتي", en: "My reports" },
  "report.status.sent": { fr: "Envoyé", ar: "أُرسل", en: "Sent" },
  "report.status.processing": { fr: "En traitement", ar: "قيد المعالجة", en: "Processing" },
  "report.status.resolved": { fr: "Résolu", ar: "تم الحل", en: "Resolved" },

  "settings.title": { fr: "Réglages", ar: "الإعدادات", en: "Settings" },
  "settings.language": { fr: "Langue", ar: "اللغة", en: "Language" },
  "settings.about": { fr: "À propos", ar: "حول التطبيق", en: "About" },
  "settings.about_text": {
    fr: "TRANSTU Tracker vous aide à suivre bus, métro et train en temps réel, consulter les horaires et signaler un incident, partout à Tunis.",
    ar: "يساعدك متتبع نقل تونس على تتبع الحافلات والمترو والقطار في الوقت الحقيقي، والاطلاع على المواقيت، والإبلاغ عن أي حادثة، في جميع أنحاء تونس.",
    en: "TRANSTU Tracker helps you track buses, metro and trains live, check timetables, and report an issue, anywhere in Tunis.",
  },
  "settings.contact": { fr: "contact@transtu.tn", ar: "contact@transtu.tn", en: "contact@transtu.tn" },
  "settings.version": { fr: "Version 1.0", ar: "الإصدار 1.0", en: "Version 1.0" },
  "staff.portal": { fr: "Espace professionnel", ar: "الفضاء المهني", en: "Staff area" },

  "staff.role_select": { fr: "Choisissez votre profil", ar: "اختر ملفك", en: "Choose your role" },
  "staff.driver": { fr: "Chauffeur", ar: "سائق", en: "Driver" },
  "staff.direction": { fr: "Direction", ar: "الإدارة", en: "Direction" },
  "staff.employee_id": { fr: "Matricule", ar: "الرقم الوظيفي", en: "Employee ID" },
  "staff.pin": { fr: "Code PIN", ar: "الرمز السري", en: "PIN code" },
  "staff.email": { fr: "E-mail", ar: "البريد الإلكتروني", en: "Email" },
  "staff.password": { fr: "Mot de passe", ar: "كلمة المرور", en: "Password" },
  "staff.login": { fr: "Se connecter", ar: "تسجيل الدخول", en: "Log in" },
  "staff.login_error": { fr: "Identifiants incorrects", ar: "بيانات الدخول غير صحيحة", en: "Incorrect credentials" },
  "staff.logout": { fr: "Se déconnecter", ar: "تسجيل الخروج", en: "Log out" },
  "staff.on_duty": { fr: "En service", ar: "في الخدمة", en: "On duty" },
  "staff.off_duty": { fr: "Hors service", ar: "خارج الخدمة", en: "Off duty" },
  "staff.send_alert": { fr: "Envoyer une alerte", ar: "إرسال تنبيه", en: "Send alert" },
  "staff.alert_sent": { fr: "Alerte envoyée", ar: "تم إرسال التنبيه", en: "Alert sent" },
  "staff.dashboard": { fr: "Tableau de bord", ar: "لوحة التحكم", en: "Dashboard" },
  "staff.reports": { fr: "Signalements", ar: "البلاغات", en: "Reports" },
  "staff.alerts": { fr: "Alertes chauffeurs", ar: "تنبيهات السائقين", en: "Driver alerts" },
  "staff.resolve": { fr: "Clore", ar: "إغلاق", en: "Resolve" },
  "staff.mark_processing": { fr: "En traitement", ar: "قيد المعالجة", en: "Mark processing" },
  "staff.mark_resolved": { fr: "Marquer résolu", ar: "وضع علامة تم الحل", en: "Mark resolved" },
  "staff.delete": { fr: "Supprimer", ar: "حذف", en: "Delete" },
  "staff.stats.open_reports": { fr: "Signalements ouverts", ar: "بلاغات مفتوحة", en: "Open reports" },
  "staff.stats.active_alerts": { fr: "Alertes actives", ar: "تنبيهات نشطة", en: "Active alerts" },
  "staff.stats.lines": { fr: "Lignes actives", ar: "خطوط نشطة", en: "Active lines" },

  "admin.empty": { fr: "Aucun résultat", ar: "لا توجد نتائج", en: "No results" },
  "common.loading": { fr: "Chargement…", ar: "جارٍ التحميل…", en: "Loading…" },
  "common.error": { fr: "Une erreur est survenue.", ar: "حدث خطأ ما.", en: "Something went wrong." },
} as const;

export type I18nKey = keyof typeof DICT;

const RTL: Record<Lang, boolean> = { fr: false, ar: true, en: false };
const STORAGE_KEY = "transtu.lang";

type Ctx = {
  lang: Lang;
  chosen: boolean;
  ready: boolean;
  setLang: (l: Lang) => void;
  t: (key: I18nKey) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [chosen, setChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && saved in RTL) {
        setLangState(saved);
        setChosen(true);
      }
    } catch {
      /* no storage access — fall back to first-launch gate */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL[lang] ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: I18nKey) => DICT[key]?.[lang] ?? String(key), [lang]);

  return createElement(I18nContext.Provider, { value: { lang, chosen, ready, setLang, t } }, children);
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
