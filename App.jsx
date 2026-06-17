import { useState, useEffect, useRef } from "react";
import {
  Clock, CalendarDays, Repeat, BarChart3, LayoutDashboard,
  MapPin, QrCode, Coffee, LogIn, LogOut, AlertTriangle, Check, X,
  Shield, ChevronRight, ChevronLeft, ChevronDown, Wifi, Scan, Play, CircleDot,
  Gavel, Plus, RotateCcw, ScrollText, ChefHat, Utensils, Wine, Pencil, Bed, Crown, Banknote,
  Home, Megaphone, ClipboardList, Send, Pin, User, GripVertical, Trash2,
  Soup, Pizza, Flame, Salad, Croissant, Users, UserPlus, Briefcase, Beer, Lock
} from "lucide-react";

// kulcssorrend-független, stabil JSON (echo-szűréshez az élő szinkronnál)
function stableStr(v) {
  if (Array.isArray(v)) return "[" + v.map(stableStr).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + stableStr(v[k])).join(",") + "}";
  return JSON.stringify(v);
}

/* ---------------- Törzsadatok ---------------- */
const RESTAURANT = { name: "DOB 18 GASTRO", lat: 47.4979, lng: 19.0402, radius: 120, qr: "DOB18-GASTRO-CLOCKIN" };
// Admin felület a mobilappban. false = az admin/gazdasági szerep kikerül a felületről (külön PC-s back-office),
// de a teljes admin-kód a fájlban marad és fejleszthető; bármikor true-ra állítva visszahozható.
const ADMIN_IN_APP = false;
// Pastamore márka — RAL 3020 (Traffic Red). Az identitás színe; óvatosan, akcentként használjuk.
const BRAND = { name: "Pastamore", red: "#CC0605", redDark: "#9E0403", soft: "rgba(204,6,5,0.14)", ring: "rgba(204,6,5,0.40)" };

const DEPARTMENTS = [
  { id: "konyha", label: "Konyha", icon: ChefHat },
  { id: "palya", label: "Pálya", icon: Utensils },
  { id: "pult", label: "Pult", icon: Wine },
  { id: "office", label: "Office", icon: Briefcase },
];
const OPS_DEPTS = ["konyha", "palya", "pult"];
const ALL_DEPTS = [...OPS_DEPTS, "office"];
// A komplexum két egysége. A pultosok (ritkán felszolgálók) ide-oda beoszthatók.
const UNITS = [
  { id: "pastamore", label: "Pastamore", short: "P", icon: Pizza },
  { id: "butcher", label: "Old Butcher's Pub", short: "OB", icon: Beer },
];
const unitLabel = (id) => UNITS.find((u) => u.id === id)?.label ?? "Pastamore";
const VENUE_DEPTS = ["pult", "palya"]; // ahol az egység választható
const ROLE_DEPT_OVERRIDE = { "Stratégiai operatív vezető": "office", "Gazdasági vezető": "office", "General Manager": "office", "HR": "office", "Sous Chef": "konyha" };

const SPECIALTIES = {
  teszta:   { label: "Tésztás",        icon: Soup },
  pizza:    { label: "Pizzás",         icon: Pizza },
  grill:    { label: "Grilles",        icon: Flame },
  hideg:    { label: "Hidegkonyha",    icon: Salad },
  desszert: { label: "Desszert / pék", icon: Croissant },
};

const PALETTE = ["amber", "sky", "emerald", "violet", "rose", "orange"];
const RAW = [
  [1, "Béri Péter", "Szakács", "konyha", 2600], [2, "Fazekas Sándor", "Szakács", "konyha", 2600],
  [3, "Jáger Áron", "Szakács", "konyha", 2600], [4, "Kovács Ádám Tibor", "Szakács", "konyha", 2600],
  [5, "Lajos Attila", "Szakács", "konyha", 2600], [6, "Mózes Gábor", "Szakács", "konyha", 2600],
  [7, "Opovszki Edina", "Szakács", "konyha", 2600], [8, "Szanyi Balázs Áron", "Szakács", "konyha", 2600],
  [9, "Taricska Róbert", "Szakács", "konyha", 2600], [10, "Molnár Dávid László", "Konyhai kisegítő", "konyha", 1900],
  [11, "Oláh István", "Mosogató", "konyha", 1900],
  [12, "Borhi Balázs", "Felszolgáló", "palya", 2200], [13, "Borsós Valéria", "Felszolgáló", "palya", 2200],
  [14, "Csillag Bence Özséb", "Felszolgáló", "palya", 2200], [15, "Demján Balázs", "Felszolgáló", "palya", 2200],
  [16, "Fodor Vivien", "Felszolgáló", "palya", 2200], [17, "Ruszó János Norbert", "Felszolgáló", "palya", 2200],
  [18, "Szabó Ádám István", "Felszolgáló", "palya", 2200], [19, "Windoch László Ferenc", "Felszolgáló", "palya", 2200],
  [20, "Mészáros Zoltán", "Pincér", "palya", 2300], [21, "Vasas Diána", "Pincér", "palya", 2300],
  [22, "Mezei Andrea Ildikó", "Takarító", "palya", 1900],
  [23, "Bócz Attila", "Pultos", "pult", 2400], [24, "Brunner Balázs", "Pultos", "pult", 2400],
  [25, "Lóczi Orsolya", "Pultos", "pult", 2400], [26, "Szakácsy Dávid", "Pultos", "pult", 2400],
  [27, "Mészáros Bálint Zoltán", "Bartender", "pult", 2500], [28, "Czinderi Laura", "Kasszás", "pult", 2200],
  [29, "Szász Dorottya", "Kasszás", "pult", 2200],
  [30, "Kiss Réka", "Felszolgáló", "palya", 2200],
];
const SPECIALTY_SEED = { 1: "pizza", 6: "teszta", 7: "teszta", 3: "grill", 5: "hideg", 8: "pizza", 4: "grill", 9: "hideg" };
const PENDING_IDS = new Set([30]); // aktiválásra váró (frissen felvett) dolgozók
const EMPLOYEES = RAW.map(([id, name, role, dept, rate], i) => ({ id, name, role, dept, depts: [dept], rate, color: PALETTE[i % PALETTE.length], level: "employee", specialty: SPECIALTY_SEED[id] ?? null, account: PENDING_IDS.has(id) ? "pending" : "active" }));

const MANAGEMENT = [
  { id: 101, name: "Tóth Roland", role: "Séf", level: "manager", depts: ["konyha"], color: "orange" },
  { id: 102, name: "Fekete Anna Róza", role: "Éttermi üzletvezető", level: "manager", depts: ["palya"], color: "amber" },
  { id: 103, name: "Gerhát Tamás", role: "Bar manager", level: "manager", depts: ["pult"], color: "violet" },
  { id: 104, name: "Hőgye Lajos", role: "Éttermi üzletvezető", level: "manager", depts: ["konyha", "palya", "pult"], color: "sky" },
  { id: 105, name: "Volenszki András", role: "Stratégiai operatív vezető", level: "admin", depts: ["konyha", "palya", "pult"], color: "emerald" },
  { id: 106, name: "Fülöp Andrea", role: "Gazdasági vezető", level: "admin", depts: ["konyha", "palya", "pult"], color: "rose" },
  { id: 107, name: "Dobosi Márk", role: "Tulajdonos", level: "owner", depts: ["konyha", "palya", "pult"], color: "emerald" },
];
const ALL_PEOPLE = [...EMPLOYEES, ...MANAGEMENT];
const SEED_PEOPLE = [...EMPLOYEES, ...MANAGEMENT.map((m) => ({ ...m, dept: m.depts[0], rate: 0, specialty: null }))];
const ROLE_SEED = (() => {
  const m = new Map(); // label -> { level, dept }
  SEED_PEOPLE.forEach((p) => { if (!m.has(p.role)) m.set(p.role, { level: p.level, dept: p.dept }); });
  [["General Manager", "admin"], ["HR", "admin"], ["Sous Chef", "manager"]].forEach(([label, level]) => { if (!m.has(label)) m.set(label, { level, dept: "konyha" }); });
  Object.entries(ROLE_DEPT_OVERRIDE).forEach(([label, dept]) => { if (m.has(label)) m.get(label).dept = dept; });
  return [...m.entries()].map(([label, v], i) => ({ id: i + 1, label, level: v.level, dept: v.dept }));
})();
const DEPT_HEAD = { konyha: 101, palya: 102, pult: 103 };

const C = {
  amber:   { dot: "bg-amber-400",   text: "text-amber-300",   soft: "bg-amber-400/10",   border: "border-amber-400/30",   chip: "bg-amber-400/15 text-amber-200" },
  rose:    { dot: "bg-rose-400",    text: "text-rose-300",    soft: "bg-rose-400/10",    border: "border-rose-400/30",    chip: "bg-rose-400/15 text-rose-200" },
  violet:  { dot: "bg-violet-400",  text: "text-violet-300",  soft: "bg-violet-400/10",  border: "border-violet-400/30",  chip: "bg-violet-400/15 text-violet-200" },
  sky:     { dot: "bg-sky-400",     text: "text-sky-300",     soft: "bg-sky-400/10",     border: "border-sky-400/30",     chip: "bg-sky-400/15 text-sky-200" },
  emerald: { dot: "bg-emerald-400", text: "text-emerald-300", soft: "bg-emerald-400/10", border: "border-emerald-400/30", chip: "bg-emerald-400/15 text-emerald-200" },
  orange:  { dot: "bg-orange-400",  text: "text-orange-300",  soft: "bg-orange-400/10",  border: "border-orange-400/30",  chip: "bg-orange-400/15 text-orange-200" },
};
const LEVEL_META = { employee: { label: "Alkalmazott", tone: "slate" }, manager: { label: "Részlegvezető", tone: "amber" }, admin: { label: "Admin", tone: "violet" }, owner: { label: "Tulajdonos", tone: "owner" } };
const DUTY_SLOT = { all: "Egész nap", open: "Nyitó", close: "Záró" };

const DAYS_FULL = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
const DAYS_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const MAX_PLAN_OFFSET = 7;
const SHIFT_BLOCKS = [["09:00", "17:00"], ["11:00", "19:00"], ["14:00", "22:00"], ["17:00", "01:00"], ["18:00", "02:00"]];

const SANCTION_CATALOG = [
  // Írásbeli figyelmeztetés (manuális, bírság nélkül)
  { id: "figyelmeztetes", label: "Írásbeli figyelmeztetés", cat: "general", fine: 0, warning: true },
  // Általános szabálysértések
  { id: "keses_15", label: "Késés (15–30 perc)", cat: "general", fine: 4000 },
  { id: "keses_30", label: "Késés (30+ perc, indok nélkül)", cat: "general", fine: 8000 },
  { id: "munkavegzes", label: "Nem megfelelő munkavégzés (ismétlődő hiba)", cat: "general", fine: 5000 },
  { id: "terulet", label: "Munkaterület rendben tartásának elmulasztása", cat: "general", fine: 3000 },
  { id: "oltozet", label: "Nem megfelelő öltözet vagy ápoltság", cat: "general", fine: 4000 },
  { id: "alkalmatlan", label: "Munkavégzésre alkalmatlan állapot", cat: "general", fine: 0, variable: "daily", consequences: ["sendHome", "warning"] },
  { id: "dohanyzas", label: "Dohányzás nem kijelölt helyen", cat: "general", fine: 10000, note: "Kijelölt: hátsó udvar és utca, min. 5 méterre." },
  // Súlyosabb szabálysértések
  { id: "viselkedes", label: "Nem megfelelő viselkedés (vendég / kolléga)", cat: "serious", fine: 10000 },
  { id: "zaklatas", label: "Munkahelyi zaklatás vagy diszkrimináció", cat: "serious", fine: 20000, consequences: ["termination"] },
  { id: "alkohol", label: "Alkohol vagy kábítószer munkaidőben", cat: "serious", fine: 30000, consequences: ["termination", "test"] },
  { id: "lopas", label: "Lopás vagy sikkasztás", cat: "serious", fine: 0, variable: "damage", consequences: ["termination", "report"] },
  { id: "rongalas", label: "Eszköz / berendezés gondatlan megrongálása", cat: "serious", fine: 0, variable: "repair", consequences: ["warning"] },
  { id: "titoktartas", label: "Titoktartási kötelezettség megsértése", cat: "serious", fine: 15000, consequences: ["compensation"] },
  { id: "tavollet", label: "Engedély nélküli távollét", cat: "serious", fine: 15000, variable: "daily", consequences: ["warning"] },
  { id: "hamisitas", label: "Munkaidő-nyilvántartás hamisítása", cat: "serious", fine: 10000 },
  { id: "biztonsag", label: "Biztonsági előírások súlyos megsértése", cat: "serious", fine: 10000 },
];
const CONSEQ = { warning: "Munkáltatói figyelmeztetés", sendHome: "Hazaküldés", termination: "Felmondás lehet", report: "Feljelentés", test: "Eseti tesztelés", compensation: "Kártérítés" };
const VAR_LABEL = { daily: "Aznapi / napi bér levonása", damage: "Okozott kár összege", repair: "Javítási költség" };

/* ---------------- Segédfüggvények ---------------- */
const pad = (n) => String(n).padStart(2, "0");
const fmtDur = (ms) => { const m = Math.max(0, Math.floor(ms / 60000)); return `${Math.floor(m / 60)}ó ${pad(m % 60)}p`; };
const fmtClock = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`; };
const timeStr = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const ago = (ms) => { const m = Math.floor((Date.now() - ms) / 60000); if (m < 1) return "most"; if (m < 60) return `${m} perce`; const h = Math.floor(m / 60); if (h < 24) return `${h} órája`; return `${Math.floor(h / 24)} napja`; };
// === Egységes időforrás (óra) ===
// MINDEN rögzített időbélyeg (becsekkolás, kicsekkolás, szünet, automatikus bírság) ezen keresztül készül,
// soha nem közvetlenül a kliens órájából. Prototípusban a készülék órája; ÉLES rendszerben a backend ad
// hiteles szerveridőt: a beérkező eseményt a szerver bélyegzi (UTC), vagy a kliens a szervertől kapott
// offsettel korrigál. Backend bekötésekor CSAK ezt az egy helyet kell átállítani — a manipulálható
// telefonóra helyett mindenki ugyanahhoz az egységes szerveridőhöz igazodik.
let SERVER_OFFSET = 0; // szerveridő − kliensóra (ms); bejelentkezéskor a backendtől jön
function serverNow() { return Date.now() + SERVER_OFFSET; }
const dateLabel = (ms) => new Date(ms).toLocaleDateString("hu-HU", { weekday: "short", month: "short", day: "numeric" });
const fullDate = (ms) => new Date(ms).toLocaleDateString("hu-HU", { month: "short", day: "numeric", weekday: "short" });
const dayKey = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const ft = (n) => Math.round(n).toLocaleString("hu-HU") + " Ft";
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const getMonday = (base) => { const x = new Date(base); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x; };
const atTime = (dateObj, hhmm) => { const d = new Date(dateObj); const [h, m] = hhmm.split(":").map(Number); d.setHours(h, m, 0, 0); return d.getTime(); };
function schedEnd(dateObj, s, x) { let end = atTime(dateObj, x); if (toMin(x) <= toMin(s)) end += 86400000; return end; }
function distM(a, b) {
  const R = 6371000, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const emp = (id) => ALL_PEOPLE.find((p) => p.id === id);
const empDept = (id) => emp(id)?.dept;
const deptLabel = (id) => DEPARTMENTS.find((d) => d.id === id)?.label ?? "";
const shortName = (name) => { const p = name.split(" "); return p.length > 1 ? `${p[0]} ${p[1][0]}.` : p[0]; };
const firstName = (name) => { const p = name.split(" "); return p[1] || p[0]; };
const scopeText = (scope) => scope.type === "all" ? "Mindenki" : scope.type === "dept" ? deptLabel(scope.value) : scope.value;
function annVisible(a, u) {
  if (u.level !== "employee") return true;
  if (a.scope.type === "all") return true;
  if (a.scope.type === "dept") return a.scope.value === u.dept;
  if (a.scope.type === "role") return a.scope.value === u.role;
  return false;
}
const GRACE = 15, LATE_GRACE = 10, FORGOT_GRACE = 20;
function latePolicy(min) { if (min <= 15) return null; if (min <= 30) return { id: "keses_15", fine: 4000 }; return { id: "keses_30", fine: 8000 }; }
const catTone = (c) => (c === "serious" ? "red" : "amber");
const catLabel = (c) => (c === "serious" ? "Súlyos" : "Általános");

function templatesFor(p) {
  if (p.role === "Mosogató" || p.role === "Konyhai kisegítő") return [["11:00", "19:00"], ["16:00", "23:00"]];
  if (p.dept === "konyha") return [["09:00", "17:00"], ["14:00", "22:00"]];
  if (p.role === "Takarító") return [["08:00", "12:00"], ["22:00", "02:00"]];
  if (p.dept === "palya") return [["11:00", "19:00"], ["16:00", "23:30"]];
  if (p.role === "Bartender") return [["18:00", "02:00"], ["17:00", "01:00"]];
  if (p.role === "Kasszás") return [["11:00", "19:00"], ["15:00", "23:00"]];
  if (p.dept === "pult") return [["12:00", "20:00"], ["17:00", "01:00"]];
  return [["10:00", "18:00"], ["14:00", "22:00"]];
}
const worksOn = (id, day) => ((id * 3 + day * 5) % 7) < 5;

function buildShifts(weekDates, todayIndex, now) {
  let id = 1; const list = [];
  for (const e of EMPLOYEES) {
    if (e.id === 12) continue;
    const tpl = templatesFor(e);
    for (let d = 0; d < 7; d++) { if (e.id === 16 && d === todayIndex) continue; if (!worksOn(e.id, d)) continue; const t = tpl[(e.id + d) % 2]; const unit = ((e.dept === "pult" && e.id % 2 === 0) || (e.id === 17 && d === 4)) ? "butcher" : "pastamore"; list.push({ id: id++, employeeId: e.id, dayIndex: d, start: t[0], end: t[1], unit }); }
  }
  const tpl12 = templatesFor(emp(12));
  for (let d = 0; d < 7; d++) { if (d === todayIndex || !worksOn(12, d)) continue; const t = tpl12[(12 + d) % 2]; list.push({ id: id++, employeeId: 12, dayIndex: d, start: t[0], end: t[1] }); }
  const sD = new Date(now - 16 * 60000), eD = new Date(now + 300 * 60000);
  list.push({ id: id++, employeeId: 12, dayIndex: todayIndex, start: `${pad(sD.getHours())}:${pad(sD.getMinutes())}`, end: `${pad(eD.getHours())}:${pad(eD.getMinutes())}` });
  // Demo – elfelejtett kicsekkolás: a mai műszak ~2 órája lejárt, de a bélyegzés még nyitva
  const fS = new Date(now - 6 * 3600000), fE = new Date(now - 2 * 3600000);
  list.push({ id: id++, employeeId: 16, dayIndex: todayIndex, start: `${pad(fS.getHours())}:${pad(fS.getMinutes())}`, end: `${pad(fE.getHours())}:${pad(fE.getMinutes())}` });
  return list;
}
function buildEntries(weekDates, shifts, todayIndex, now) {
  let id = 1; const out = [];
  for (const sh of shifts) {
    if (sh.dayIndex >= todayIndex) continue;
    const dateObj = weekDates[sh.dayIndex];
    const start = atTime(dateObj, sh.start), end = schedEnd(dateObj, sh.start, sh.end);
    const v = (sh.employeeId % 7 === 0) ? 95 : (sh.employeeId % 5 === 0 ? 25 : 4);
    const ci = start - 10 * 60000, co = end + v * 60000; // ~10 perc korai érkezés (illendő), kicsekkolás eltérés
    const brk = (co - ci) > 5 * 3600000 ? 30 * 60000 : 0;
    const isOT = v > GRACE;
    out.push({ id: id++, employeeId: sh.employeeId, date: dateObj.getTime(), checkIn: ci, checkOut: co, breakMs: brk, breakStart: null, method: "GPS + QR", flagged: isOT, flagType: isOT ? "ot" : null, flagReason: isOT ? `Túlóra: +${v}p a tervezetthez — jóváhagyásra vár` : null, otApproved: false, earlyApproved: false });
  }
  const td = weekDates[todayIndex].getTime();
  [[2, 130], [13, 70], [24, 95]].forEach(([eid, mins]) => out.push({ id: id++, employeeId: eid, date: td, checkIn: now - mins * 60000, checkOut: null, breakMs: 0, breakStart: null, method: "GPS + QR", flagged: false, flagType: null, flagReason: null, otApproved: false, earlyApproved: false }));
  out.push({ id: id++, employeeId: 16, date: td, checkIn: now - 6 * 3600000, checkOut: null, breakMs: 30 * 60000, breakStart: null, method: "GPS + QR", flagged: false, flagType: null, flagReason: null, otApproved: false, earlyApproved: false });
  return out;
}
function buildSanctions(now) {
  return [
    { id: 1, employeeId: 9, typeId: "tavollet", title: "Engedély nélküli távollét", cat: "serious", fine: 15000, variable: "daily", consequences: ["warning"], note: "Pénteki esti műszak, jelzés nélkül", date: now - 2 * 86400000, source: "manager", status: "active" },
    { id: 2, employeeId: 13, typeId: "keses_15", title: "Késés (22 perc)", cat: "general", fine: 4000, consequences: [], note: "Automatikus – becsekkoláskor", date: now - 86400000, source: "auto", status: "active" },
    { id: 3, employeeId: 12, typeId: "oltozet", title: "Nem megfelelő öltözet vagy ápoltság", cat: "general", fine: 4000, consequences: [], note: "Hiányos egyenruha", date: now - 3 * 86400000, source: "manager", status: "active" },
    { id: 4, employeeId: 25, typeId: "dohanyzas", title: "Dohányzás nem kijelölt helyen", cat: "general", fine: 10000, consequences: [], note: "Bejárat előtt", date: now - 86400000, source: "manager", status: "active" },
  ];
}
function buildTimeOff(now) {
  const k = (n) => dayKey(now + n * 86400000);
  return [
    { id: 1, employeeId: 14, date: k(2), note: "Orvosi vizsgálat", status: "pending" },
    { id: 2, employeeId: 15, date: k(3), note: "", status: "pending" },
    { id: 3, employeeId: 3, date: k(1), note: "Családi program", status: "approved" },
    { id: 4, employeeId: 24, date: k(12), note: "Esküvő (előzetes kérés)", status: "pending" },
  ];
}
function buildAnnouncements(now) {
  return [
    { id: 1, authorId: 105, scope: { type: "all" }, title: "Csapatértekezlet csütörtökön", body: "Csütörtök 10:00, emeleti terem. Mindenki jelenléte fontos – a negyedéves számokat és a nyári nyitvatartást beszéljük át.", pinned: true, date: now - 26 * 3600000 },
    { id: 2, authorId: 102, scope: { type: "all" }, title: "Új nyári étlap hétfőtől", body: "Hétfőtől él az új nyári étlap. Kérlek nézzétek át a változásokat és az allergéntáblát műszak előtt.", pinned: false, date: now - 3 * 3600000 },
    { id: 3, authorId: 101, scope: { type: "dept", value: "konyha" }, title: "Új zöldség-beszállító", body: "A mai szállítástól az új beszállító árui érkeznek. Ellenőrizzétek a minőséget átvételkor, és jelezzétek, ha bármi nem stimmel.", pinned: false, date: now - 5 * 3600000 },
    { id: 4, authorId: 102, scope: { type: "role", value: "Felszolgáló" }, title: "Felszolgálás tempója", body: "Vendég-visszajelzés alapján csúcsidőben figyeljünk az italrendelések gyorsaságára. Köszi mindenkinek!", pinned: false, date: now - 8 * 3600000 },
  ];
}
/* ---------------- UI elemek ---------------- */
function Avatar({ id, size = "w-9 h-9" }) {
  const e = emp(id); const c = C[e.color];
  const init = e.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return <div className={`${size} ${c.soft} ${c.text} rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-1 ${c.border}`}>{init}</div>;
}
function Card({ children, className = "" }) { return <div className={`bg-slate-800/60 border border-slate-700/60 rounded-2xl ${className}`}>{children}</div>; }
function SubTabs({ items, value, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 mb-3 overflow-x-auto">
      {items.map((it) => { const on = value === it.id; const I = it.icon; return (
        <button key={it.id} onClick={() => onChange(it.id)} className={`relative flex-1 min-w-fit flex items-center justify-center gap-1.5 text-xs py-2 px-2.5 rounded-lg transition whitespace-nowrap ${on ? "bg-slate-700 text-white font-medium" : "text-slate-400"}`}>{I && <I className="w-3.5 h-3.5" />} {it.label}{it.count > 0 && <span className="ml-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">{it.count}</span>}</button>); })}
    </div>
  );
}
function Badge({ children, tone = "slate" }) {
  const map = { slate: "bg-slate-700/60 text-slate-300", amber: "bg-amber-400/15 text-amber-300", red: "bg-rose-500/15 text-rose-300", green: "bg-emerald-500/15 text-emerald-300", blue: "bg-sky-500/15 text-sky-300", violet: "bg-violet-500/15 text-violet-300", orange: "bg-orange-500/15 text-orange-300", owner: "bg-amber-300/25 text-amber-100 ring-1 ring-amber-300/40" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[tone]}`}>{children}</span>;
}
function DeptPill({ id, active, onClick }) {
  const d = DEPARTMENTS.find((x) => x.id === id); const Icon = d.icon;
  return <button onClick={onClick} className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition ${active ? "bg-amber-500 text-slate-900 font-medium" : "text-slate-400 bg-slate-800/60"}`}><Icon className="w-3.5 h-3.5" /> {d.label}</button>;
}
function SpecIcon({ id, className = "w-3 h-3" }) {
  const s = id ? SPECIALTIES[id] : null; if (!s) return null; const I = s.icon;
  return <I className={className} aria-label={s.label} />;
}

/* ---------------- Fő komponens ---------------- */
export default function App() {
  const now0 = Date.now();
  const today = new Date(now0);
  const monday = getMonday(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d; });
  const weekDatesFor = (off) => Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + off * 7 + i); return d; });
  const weekRangeLabel = (off) => { const ws = weekDatesFor(off); return `${ws[0].toLocaleDateString("hu-HU", { month: "short", day: "numeric" })} – ${ws[6].toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}`; };
  const weekTag = (off) => off === 0 ? "Aktuális hét" : off === 1 ? "Következő hét" : `+${off} hét`;
  const todayIndex = (today.getDay() + 6) % 7;
  const TODAY_KEY = dayKey(now0);
  const MAX_OFF_KEY = (() => { const d = new Date(now0); d.setMonth(d.getMonth() + 6); return dayKey(d); })();
  const CUR_MONTH = (() => { const d = new Date(now0); d.setDate(1); return dayKey(d); })();
  const MAX_MONTH = (() => { const d = new Date(MAX_OFF_KEY); d.setDate(1); return dayKey(d); })();

  const [shifts, setShifts] = useState(() => buildShifts(weekDates, todayIndex, now0));
  const [entries, setEntries] = useState(() => buildEntries(weekDates, buildShifts(weekDates, todayIndex, now0), todayIndex, now0));
  const [swaps, setSwaps] = useState([{ id: 1, shiftId: null, fromEmployeeId: 13, toEmployeeId: null, status: "open" }]);
  const [sanctions, setSanctions] = useState(() => buildSanctions(now0));
  const [timeOff, setTimeOff] = useState(() => buildTimeOff(now0));
  const [announcements, setAnnouncements] = useState(() => buildAnnouncements(now0));
  const [people, setPeople] = useState(() => SEED_PEOPLE.map((p) => ({ ...p, account: p.account ?? "active" })));
  // A komponensen belül a törzsadat az állapotból jön (a modul-szintű neveket árnyékoljuk):
  const EMPLOYEES = people.filter((p) => p.level === "employee");
  const MANAGEMENT = people.filter((p) => p.level !== "employee");
  const ALL_PEOPLE = people;
  const emp = (id) => people.find((p) => p.id === id);
  const empDept = (id) => emp(id)?.dept;
  const [empEdit, setEmpEdit] = useState(null);
  const [roles, setRoles] = useState(() => ROLE_SEED.map((r) => ({ ...r })));
  const [roleEdit, setRoleEdit] = useState(null);
  const [blocks, setBlocks] = useState(() => SHIFT_BLOCKS.map(([start, end], i) => ({ id: i + 1, start, end })));
  const roleLevel = (label) => roles.find((r) => r.label === label)?.level ?? "employee";
  const roleDept = (label) => roles.find((r) => r.label === label)?.dept;
  const groupDept = (p) => roleDept(p.role) ?? p.dept;
  function Avatar({ id, size = "w-9 h-9" }) {
    const e = emp(id); if (!e) return <div className={`${size} bg-slate-700 rounded-full shrink-0`} />;
    const c = C[e.color] || C.amber;
    const init = e.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    return <div className={`${size} ${c.soft} ${c.text} rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-1 ${c.border}`}>{init}</div>;
  }

  const [meId, setMeId] = useState(12);
  const [tab, setTab] = useState("central");
  const [now, setNow] = useState(now0);
  const [loaded, setLoaded] = useState(false);
  const [viewDept, setViewDept] = useState("palya");
  const [empSchedView, setEmpSchedView] = useState("self");

  const [geoMode, setGeoMode] = useState("sim");
  const [sim, setSim] = useState("here");
  const [realPos, setRealPos] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);

  const [scan, setScan] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const [showPolicy, setShowPolicy] = useState(false);
  const [expandedEmp, setExpandedEmp] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmp, setAssignEmp] = useState(null);
  const [assignType, setAssignType] = useState(null);
  const [assignAmount, setAssignAmount] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [shiftEdit, setShiftEdit] = useState(null);
  const [offModal, setOffModal] = useState(false);
  const [offDays, setOffDays] = useState([]);
  const [offNote, setOffNote] = useState("");
  const [offDefaultCap, setOffDefaultCap] = useState(2);
  const [offCaps, setOffCaps] = useState(() => ({ [dayKey(new Date(new Date(now0).getFullYear(), 11, 31).getTime())]: 0, [dayKey(now0 + 13 * 86400000)]: 0, [dayKey(now0 + 6 * 86400000)]: 1 }));
  const [capDateInput, setCapDateInput] = useState("");
  const [capValInput, setCapValInput] = useState(0);
  const [calMonth, setCalMonth] = useState(CUR_MONTH);
  const [annOpen, setAnnOpen] = useState(false);
  const [annScopeType, setAnnScopeType] = useState("all");
  const [annRole, setAnnRole] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [confirmDeptClose, setConfirmDeptClose] = useState(false);
  const [planOffset, setPlanOffset] = useState(1);
  const [planSpan, setPlanSpan] = useState(1);
  const [empWorkSub, setEmpWorkSub] = useState("schedule");
  const [adminSub, setAdminSub] = useState("overview");
  const [mgrTeamSub, setMgrTeamSub] = useState("hours");
  const [seenAnn, setSeenAnn] = useState([]);
  const [dutyManagers, setDutyManagers] = useState([{ id: 104, slot: "all" }, { id: 102, slot: "all" }]);
  const [addDutyId, setAddDutyId] = useState("");
  const [dailyDate, setDailyDate] = useState(() => { const d = new Date(now0); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; });
  const [showExport, setShowExport] = useState(false);
  const [dailyDept, setDailyDept] = useState("all");
  const [activationCodes, setActivationCodes] = useState({});
  const [inviteEmp, setInviteEmp] = useState(null);
  const [activateInput, setActivateInput] = useState("");
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newRate, setNewRate] = useState("");
  const [ownerDay, setOwnerDay] = useState(todayIndex);
  const histRef = useRef([]);
  const fbRef = useRef(null);
  const saveTimer = useRef(null);
  const lastSyncedRef = useRef(null);
  const lastTabRef = useRef("central");
  const goingBackRef = useRef(false);

  const me = emp(meId);
  const myLevel = me.level;
  const myDepts = myLevel === "employee" ? [me.dept] : me.depts;
  const userId = meId;
  const isMgr = myLevel !== "employee";

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // --- Firestore perzisztencia: betöltés induláskor, mentés változáskor ---
  function collectState() {
    return JSON.parse(JSON.stringify({ people, roles, blocks, shifts, entries, swaps, sanctions, timeOff, announcements, dutyManagers, offDefaultCap, offCaps, activationCodes }));
  }
  function applyState(d) {
    if (d.people) setPeople(d.people);
    if (d.roles) setRoles(d.roles);
    if (d.blocks) setBlocks(d.blocks);
    if (d.shifts) setShifts(d.shifts);
    if (d.entries) setEntries(d.entries);
    if (d.swaps) setSwaps(d.swaps);
    if (d.sanctions) setSanctions(d.sanctions);
    if (d.timeOff) setTimeOff(d.timeOff);
    if (d.announcements) setAnnouncements(d.announcements);
    if (d.dutyManagers) setDutyManagers(d.dutyManagers);
    if (typeof d.offDefaultCap === "number") setOffDefaultCap(d.offDefaultCap);
    if (d.offCaps) setOffCaps(d.offCaps);
    if (d.activationCodes) setActivationCodes(d.activationCodes);
  }
  useEffect(() => {
    let cancelled = false; let unsub = null;
    (async () => {
      try {
        const { db } = await import("./firebase.js");
        const { getAuth, signInAnonymously } = await import("firebase/auth");
        const { doc, getDoc, setDoc, onSnapshot } = await import("firebase/firestore");
        if (cancelled) return;
        await signInAnonymously(getAuth()); // névtelen bejelentkezés a hozzáférés előtt
        if (cancelled) return;
        fbRef.current = { db, doc, setDoc };
        const ref = doc(db, "state", "main");
        const first = await getDoc(ref);
        if (cancelled) return;
        if (!first.exists()) {
          const seed = collectState();
          lastSyncedRef.current = stableStr(seed);
          await setDoc(ref, seed); // első indítás: az aktuális (seed) állapot mentése
        }
        // élő figyelő: másik eszköz változtatása azonnal megjelenik
        unsub = onSnapshot(ref, (ds) => {
          if (!ds.exists() || ds.metadata.hasPendingWrites) return; // saját, még visszaigazolatlan írás
          const data = ds.data();
          const j = stableStr(data);
          if (j === lastSyncedRef.current) return; // saját írás visszhangja
          lastSyncedRef.current = j;
          applyState(data);
        });
      } catch (e) {
        console.warn("Firestore nem elérhető — helyi adatokkal futunk.", e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; if (unsub) unsub(); };
  }, []);
  useEffect(() => {
    if (!loaded || !fbRef.current) return;
    const snapshot = collectState();
    const j = stableStr(snapshot);
    if (j === lastSyncedRef.current) return; // nincs valódi változás a szinkronizálthoz képest
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      lastSyncedRef.current = j;
      const { db, doc, setDoc } = fbRef.current;
      setDoc(doc(db, "state", "main"), snapshot).catch((e) => console.warn("Mentés hiba:", e));
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [loaded, people, roles, blocks, shifts, entries, swaps, sanctions, timeOff, announcements, dutyManagers, offDefaultCap, offCaps, activationCodes]);
  useEffect(() => {
    const m = emp(meId);
    setViewDept(m.level === "employee" ? m.dept : m.depts[0]);
    setTab("central"); setExpandedEmp(null); setEmpSchedView("self"); setConfirmDeptClose(false); setPlanOffset(1); setPlanSpan(1); setDragUI(null); dragRef.current = null;
    setEmpWorkSub("schedule"); setAdminSub("overview"); setMgrTeamSub("hours"); setSeenAnn([]); histRef.current = []; lastTabRef.current = "central";
  }, [meId]);
  function markAnnSeen() {
    const vis = announcements.filter((a) => annVisible(a, emp(meId))).map((a) => a.id);
    setSeenAnn((prev) => Array.from(new Set([...prev, ...vis])));
  }
  // Navigációs előzmény a globális "vissza" gombhoz
  useEffect(() => {
    if (goingBackRef.current) { goingBackRef.current = false; lastTabRef.current = tab; return; }
    if (lastTabRef.current !== tab) { histRef.current = [...histRef.current, lastTabRef.current].slice(-12); lastTabRef.current = tab; }
  }, [tab]);
  function closeModals() {
    let closed = false;
    if (shiftEdit) { setShiftEdit(null); closed = true; }
    if (empEdit) { setEmpEdit(null); closed = true; }
    if (roleEdit) { setRoleEdit(null); closed = true; }
    if (offModal) { setOffModal(false); closed = true; }
    if (assignOpen) { setAssignOpen(false); closed = true; }
    if (annOpen) { setAnnOpen(false); closed = true; }
    if (inviteEmp) { setInviteEmp(null); closed = true; }
    if (scanning || scan) { setScanning(false); setScan(null); closed = true; }
    if (showPolicy) { setShowPolicy(false); closed = true; }
    return closed;
  }
  function goBack() {
    if (closeModals()) return;
    if (tab === "admin" && adminSub !== "overview") { setAdminSub("overview"); return; }
    if (tab === "work" && empWorkSub !== "schedule") { setEmpWorkSub("schedule"); return; }
    if (tab === "team" && mgrTeamSub !== "hours") { setMgrTeamSub("hours"); return; }
    if (expandedEmp) { setExpandedEmp(null); return; }
    if (histRef.current.length) { goingBackRef.current = true; const prev = histRef.current[histRef.current.length - 1]; histRef.current = histRef.current.slice(0, -1); setTab(prev); return; }
    if (tab !== "central") setTab("central");
  }
  const canGoBack = tab !== "central" || histRef.current.length > 0 || !!(shiftEdit || empEdit || roleEdit || offModal || assignOpen || annOpen || scanning || scan || showPolicy) || (tab === "admin" && adminSub !== "overview") || (tab === "work" && empWorkSub !== "schedule") || (tab === "team" && mgrTeamSub !== "hours") || !!expandedEmp;


  function flash(msg, tone = "info") { setNotice({ msg, tone }); clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(null), 3400); }

  const distance = geoMode === "gps" ? (realPos ? distM(realPos, RESTAURANT) : null) : (sim === "here" ? 34 : 2400);
  const atWork = distance != null && distance <= RESTAURANT.radius;
  function useRealGps() {
    if (!navigator.geolocation) { flash("Ez az eszköz nem támogatja a helymeghatározást.", "warn"); return; }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setRealPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoMode("gps"); setGeoBusy(false); },
      () => { setGeoBusy(false); flash("Nem sikerült lekérni a pozíciót (engedély megtagadva).", "warn"); }, { enableHighAccuracy: true, timeout: 8000 });
  }

  const myOpen = entries.find((e) => e.employeeId === userId && e.checkOut == null);
  // A jelenleg releváns műszak: a mai beosztott, VAGY egy tegnap indult, éjfél utánra átnyúló műszak, amely még tart.
  // Visszaadja a műszakot és az "üzleti napot" (a kezdőnap), amelyhez a bélyegzést kötni kell.
  function resolveCurrentShift() {
    if (todayIndex > 0) {
      const yIdx = todayIndex - 1;
      const yShift = shifts.find((s) => s.employeeId === userId && s.dayIndex === yIdx && (s.weekOffset ?? 0) === 0);
      if (yShift && toMin(yShift.end) <= toMin(yShift.start)) {
        const yDate = weekDates[yIdx];
        if (now < schedEnd(yDate, yShift.start, yShift.end)) return { shift: yShift, date: yDate.getTime() };
      }
    }
    const cur = shifts.find((s) => s.employeeId === userId && s.dayIndex === todayIndex && (s.weekOffset ?? 0) === 0);
    return cur ? { shift: cur, date: weekDates[todayIndex].getTime() } : null;
  }
  const curShift = resolveCurrentShift();
  const myTodayShift = curShift?.shift ?? null;
  function liveWorked(e) { if (!e) return 0; const end = e.checkOut ?? now; const lb = e.breakStart ? now - e.breakStart : 0; return Math.max(0, end - e.checkIn - e.breakMs - lb); }
  function shiftForEntry(e) { return shifts.find((s) => s.employeeId === e.employeeId && (s.weekOffset ?? 0) === 0 && dayKey(weekDates[s.dayIndex]) === dayKey(e.date)); }
  function paidMs(e) {
    if (!e) return 0;
    const end = e.checkOut ?? now;
    const brk = e.breakMs + (e.breakStart ? now - e.breakStart : 0);
    const sh = shiftForEntry(e);
    if (!sh) return Math.max(0, end - e.checkIn - brk);
    const dObj = new Date(e.date);
    const ss = atTime(dObj, sh.start), se = schedEnd(dObj, sh.start, sh.end);
    const paidStart = e.earlyApproved ? e.checkIn : Math.max(ss, e.checkIn);
    const paidEnd = e.otApproved ? end : Math.min(se, end);
    return Math.max(0, paidEnd - paidStart - brk);
  }
  function approveFlag(id, kind) { setEntries((p) => p.map((e) => e.id === id ? { ...e, flagged: false, flagReason: null, otApproved: kind === "ot" ? true : e.otApproved, earlyApproved: kind === "early" ? true : e.earlyApproved } : e)); flash(kind === "ot" ? "Túlóra beszámítva ✓" : kind === "early" ? "Korábbi kezdés beszámítva ✓" : "Jóváhagyva ✓", "ok"); }
  function dismissFlag(id) { setEntries((p) => p.map((e) => e.id === id ? { ...e, flagged: false, flagReason: null } : e)); flash("Megjelölés lezárva (nem beszámítva).", "info"); }

  function attemptClock(action) {
    if (!atWork) { flash(`Bélyegzés letiltva — nem vagy a munkahelyen${distance != null ? ` (kb. ${distance >= 1000 ? (distance / 1000).toFixed(1) + " km" : Math.round(distance) + " m"})` : ""}.`, "warn"); return; }
    setScan({ action }); setScanning(false);
  }
  function confirmScan() { setScanning(true); setTimeout(() => { const a = scan.action; setScan(null); setScanning(false); a === "in" ? doCheckIn() : doCheckOut(); }, 1100); }
  function doCheckIn() {
    const ts = serverNow(); // hiteles esemény-időbélyeg (éles: szerveridő)
    const cs = resolveCurrentShift();
    const dateObj = cs ? new Date(cs.date) : weekDates[todayIndex];
    const sh = cs?.shift ?? null;
    let flagType = null, reason = null, newSanction = null;
    if (sh) {
      const start = atTime(dateObj, sh.start);
      const lateMin = Math.round((ts - start) / 60000);
      const pol = latePolicy(lateMin);
      if (pol) { newSanction = { id: Date.now() + 1, employeeId: userId, typeId: pol.id, title: `Késés (${lateMin} perc)`, cat: "general", fine: pol.fine, consequences: [], note: "Automatikus – becsekkoláskor rögzítve", date: ts, source: "auto", status: "active" }; }
      else if (ts < start - 20 * 60000) { flagType = "early"; reason = `Korai kezdés (${Math.round((start - ts) / 60000)} perccel a műszak előtt) — beszámítás?`; }
    }
    setEntries((p) => [...p, { id: Date.now(), employeeId: userId, date: dateObj.getTime(), checkIn: ts, checkOut: null, breakMs: 0, breakStart: null, method: "GPS + QR", flagged: !!flagType, flagType, flagReason: reason, otApproved: false, earlyApproved: false }]);
    if (newSanction) setSanctions((p) => [...p, newSanction]);
    flash(newSanction ? `Becsekkolva — késés miatt ${ft(newSanction.fine)} bírság. A fizetett idő a tényleges becsekkolástól indul.` : "Sikeres becsekkolás ✓ — jó műszakot!", newSanction ? "warn" : "ok");
  }
  function doCheckOut() {
    const ts = serverNow();
    const sh = shiftForEntry(myOpen);
    let flagged = false, flagType = null, reason = null;
    if (sh) { const se = schedEnd(new Date(myOpen.date), sh.start, sh.end); const otMin = Math.round((ts - se) / 60000); if (otMin > GRACE) { flagged = true; flagType = "ot"; reason = `Túlóra: +${otMin}p a tervezetthez — jóváhagyásra vár`; } }
    const extraBreak = myOpen.breakStart ? ts - myOpen.breakStart : 0;
    setEntries((p) => p.map((e) => e.id === myOpen.id ? { ...e, checkOut: ts, breakStart: null, breakMs: e.breakMs + extraBreak, flagged, flagType, flagReason: reason } : e));
    flash(flagged ? "Kicsekkoltál — a túlóra jóváhagyásra vár (addig a beosztott végig számít)." : "Sikeres kicsekkolás ✓", flagged ? "warn" : "ok");
  }
  function toggleBreak() {
    if (!myOpen) return;
    const ts = serverNow();
    if (myOpen.breakStart) { setEntries((p) => p.map((e) => e.id === myOpen.id ? { ...e, breakMs: e.breakMs + (ts - e.breakStart), breakStart: null } : e)); flash("Szünet vége — folytatódik a műszak.", "info"); }
    else { setEntries((p) => p.map((e) => e.id === myOpen.id ? { ...e, breakStart: ts } : e)); flash("Szünet elindítva ☕", "info"); }
  }

  function resolveClose(e, idSeed) {
    const tsNow = serverNow();
    const sh = shifts.find((s) => s.employeeId === e.employeeId && dayKey(weekDates[s.dayIndex]) === dayKey(e.date));
    let checkOut = tsNow, forgot = false, se = null;
    if (sh) { se = schedEnd(new Date(e.date), sh.start, sh.end); if (tsNow > se + FORGOT_GRACE * 60000) { checkOut = se; forgot = true; } }
    const extraBreak = (!forgot && e.breakStart) ? tsNow - e.breakStart : 0;
    const patch = { ...e, checkOut, breakStart: null, breakMs: e.breakMs + extraBreak, flagged: false, flagType: null, flagReason: null, closedBy: meId, forgotCheckout: forgot };
    let sanction = null;
    if (forgot) { const t = SANCTION_CATALOG.find((x) => x.id === "hamisitas"); sanction = { id: idSeed, employeeId: e.employeeId, typeId: t.id, title: t.label, cat: t.cat, fine: t.fine || 0, consequences: t.consequences || [], note: `Elfelejtett kicsekkolás — tervezett vége ${timeStr(se)}, vezetői lezárás`, date: tsNow, source: "auto", status: "active" }; }
    return { patch, sanction };
  }
  function closeEntry(entryId) {
    const e = entries.find((x) => x.id === entryId && x.checkOut == null); if (!e) return;
    const { patch, sanction } = resolveClose(e, Date.now());
    setEntries((p) => p.map((x) => x.id === e.id ? patch : x));
    if (sanction) setSanctions((p) => [...p, sanction]);
    flash(sanction ? `${shortName(emp(e.employeeId).name)} lezárva — munkaidő-nyilvántartás hamisítása (${ft(sanction.fine)}).` : `${shortName(emp(e.employeeId).name)} műszakja lezárva ✓`, sanction ? "warn" : "ok");
  }
  function closeDept() {
    const open = entries.filter((e) => e.checkOut == null && inDept(e.employeeId));
    if (open.length === 0) { setConfirmDeptClose(false); flash("Nincs nyitott bélyegzés a részlegben.", "info"); return; }
    const resolved = open.map((e, i) => ({ rid: e.id, ...resolveClose(e, Date.now() + i + 1) }));
    setEntries((p) => p.map((x) => { const r = resolved.find((r) => r.rid === x.id); return r ? r.patch : x; }));
    const newSanc = resolved.filter((r) => r.sanction).map((r) => r.sanction);
    if (newSanc.length) setSanctions((p) => [...p, ...newSanc]);
    flash(`Részleg lezárva: ${open.length} műszak${newSanc.length ? ` · ${newSanc.length} munkaidő-hamisítás rögzítve` : ""}.`, newSanc.length ? "warn" : "ok");
    setConfirmDeptClose(false);
  }

  function weekMinutes(id) { return entries.filter((e) => e.employeeId === id).reduce((s, e) => s + paidMs(e), 0) / 60000; }
  function activeFines(id) { return sanctions.filter((s) => s.employeeId === id && s.status === "active").reduce((a, s) => a + (s.fine || 0), 0); }
  function standing(id) {
    const act = sanctions.filter((s) => s.employeeId === id && s.status === "active");
    if (act.some((s) => (s.consequences || []).includes("termination"))) return { label: "Fegyelmi eljárás", tone: "red" };
    if (act.some((s) => s.cat === "serious")) return { label: "Súlyos vétség", tone: "red" };
    if (act.length) return { label: "Figyelmeztetés", tone: "amber" };
    return { label: "Rendben", tone: "green" };
  }
  const upcomingMine = shifts.filter((s) => s.employeeId === userId && (s.weekOffset ?? 0) === 0 && s.dayIndex >= todayIndex).sort((a, b) => a.dayIndex - b.dayIndex);

  function offerShift(shiftId) { if (swaps.some((w) => w.shiftId === shiftId && ["open", "pending"].includes(w.status))) return; setSwaps((p) => [...p, { id: Date.now(), shiftId, fromEmployeeId: userId, toEmployeeId: null, status: "open" }]); flash("Műszak felajánlva cserére.", "ok"); }
  function cancelOffer(reqId) { setSwaps((p) => p.filter((w) => w.id !== reqId)); flash("Felajánlás visszavonva.", "info"); }
  function claimSwap(reqId) { setSwaps((p) => p.map((w) => w.id === reqId ? { ...w, toEmployeeId: userId, status: "pending" } : w)); flash("Jelentkeztél — vezetői jóváhagyásra vár.", "ok"); }
  function decideSwap(reqId, approve) {
    setSwaps((p) => p.map((w) => w.id === reqId ? { ...w, status: approve ? "approved" : "rejected" } : w));
    if (approve) { const req = swaps.find((w) => w.id === reqId); if (req?.shiftId && req.toEmployeeId) setShifts((p) => p.map((s) => s.id === req.shiftId ? { ...s, employeeId: req.toEmployeeId } : s)); }
    flash(approve ? "Csere jóváhagyva ✓" : "Csere elutasítva.", approve ? "ok" : "warn");
  }
  const shiftLabel = (shiftId) => { const s = shifts.find((x) => x.id === shiftId); return s ? `${DAYS_FULL[s.dayIndex]} · ${s.start}–${s.end}` : "—"; };

  function assignSanction() {
    const t = SANCTION_CATALOG.find((x) => x.id === assignType); if (!assignEmp || !t) return;
    const fine = (t.fine || 0) + (t.variable ? Number(assignAmount || 0) : 0);
    setSanctions((p) => [...p, { id: Date.now(), employeeId: assignEmp, typeId: t.id, title: t.label, cat: t.cat, fine, variable: t.variable || null, consequences: t.consequences || [], warning: !!t.warning, note: assignNote.trim(), date: serverNow(), source: "manager", status: "active" }]);
    flash(t.warning ? `Írásbeli figyelmeztetés rögzítve: ${shortName(emp(assignEmp).name)}.` : `Szankció rögzítve: ${shortName(emp(assignEmp).name)}${fine > 0 ? ` — ${ft(fine)}` : ""}.`, "warn");
    setAssignOpen(false); setAssignEmp(null); setAssignType(null); setAssignNote(""); setAssignAmount("");
  }
  function withdrawSanction(id) { setSanctions((p) => p.map((s) => s.id === id ? { ...s, status: "withdrawn" } : s)); flash("Szankció visszavonva.", "info"); }

  /* ---- Alkalmazotti törzsadat (admin) ---- */
  function openEmpEditor(person) {
    if (person) setEmpEdit({ ...person, depts: person.depts ?? [person.dept] });
    else setEmpEdit({ id: null, name: "", role: "Szakács", dept: "konyha", depts: ["konyha"], rate: 2600, level: roleLevel("Szakács"), color: PALETTE[people.length % PALETTE.length], specialty: null });
  }
  function saveEmp() {
    const e = empEdit; if (!e.name.trim()) { flash("Adj meg egy nevet.", "warn"); return; }
    const level = roleLevel(e.role);
    const home = roleDept(e.role) ?? e.dept;
    const depts = level === "employee" ? [home] : ((e.depts || []).filter((d) => OPS_DEPTS.includes(d)).length ? e.depts.filter((d) => OPS_DEPTS.includes(d)) : (OPS_DEPTS.includes(home) ? [home] : OPS_DEPTS.slice()));
    const norm = { ...e, name: e.name.trim(), level, dept: home, depts, rate: Number(e.rate) || 0, specialty: level === "employee" ? e.specialty : null };
    if (e.id == null) { const id = Math.max(0, ...people.map((p) => p.id)) + 1; setPeople((p) => [...p, { ...norm, id }]); flash(`Felvéve: ${norm.name}.`, "ok"); }
    else { setPeople((p) => p.map((x) => x.id === e.id ? { ...x, ...norm } : x)); flash(`Mentve: ${norm.name}.`, "ok"); }
    setEmpEdit(null);
  }
  function deleteEmp(id) {
    if (id === meId) { flash("A jelenleg belépett felhasználó nem törölhető.", "warn"); return; }
    const name = emp(id)?.name;
    setPeople((p) => p.filter((x) => x.id !== id));
    setShifts((p) => p.filter((s) => s.employeeId !== id));
    setEntries((p) => p.filter((x) => x.employeeId !== id));
    setSanctions((p) => p.filter((s) => s.employeeId !== id));
    setTimeOff((p) => p.filter((t) => t.employeeId !== id));
    setSwaps((p) => p.filter((w) => w.fromEmployeeId !== id && w.toEmployeeId !== id));
    setEmpEdit(null); flash(`Törölve: ${name}.`, "info");
  }

  /* ---- Munkakörök → jogosultságok ---- */
  function openRoleEditor(role) { setRoleEdit(role ? { ...role } : { id: null, label: "", level: "employee", dept: "konyha" }); }
  function saveRole() {
    const r = roleEdit; const label = r.label.trim(); if (!label) { flash("Adj nevet a munkakörnek.", "warn"); return; }
    if (roles.some((x) => x.label.toLowerCase() === label.toLowerCase() && x.id !== r.id)) { flash("Ilyen munkakör már létezik.", "warn"); return; }
    if (r.id == null) { const id = Math.max(0, ...roles.map((x) => x.id)) + 1; setRoles((p) => [...p, { id, label, level: r.level, dept: r.dept }]); flash(`Munkakör létrehozva: ${label}.`, "ok"); }
    else {
      const old = roles.find((x) => x.id === r.id);
      setRoles((p) => p.map((x) => x.id === r.id ? { ...x, label, level: r.level, dept: r.dept } : x));
      setPeople((p) => p.map((per) => per.role === old.label ? { ...per, role: label, level: r.level, dept: r.dept, depts: r.level === "employee" ? [r.dept] : ((per.depts || []).filter((d) => OPS_DEPTS.includes(d)).length ? per.depts.filter((d) => OPS_DEPTS.includes(d)) : (OPS_DEPTS.includes(r.dept) ? [r.dept] : OPS_DEPTS.slice())), specialty: r.level === "employee" ? per.specialty : null } : per));
      flash(`Munkakör frissítve: ${label}.`, "ok");
    }
    setRoleEdit(null);
  }
  function deleteRole(id) {
    const r = roles.find((x) => x.id === id);
    const remaining = roles.filter((x) => x.id !== id);
    if (!remaining.length) { flash("Legalább egy munkakör maradjon.", "warn"); return; }
    const used = people.filter((p) => p.role === r.label);
    if (used.length) {
      const fb = remaining.find((x) => x.dept === r.dept) || remaining[0];
      setPeople((p) => p.map((per) => per.role === r.label ? { ...per, role: fb.label, level: fb.level, dept: fb.dept, depts: fb.level === "employee" ? [fb.dept] : (OPS_DEPTS.includes(fb.dept) ? [fb.dept] : OPS_DEPTS.slice()), specialty: fb.level === "employee" ? per.specialty : null } : per));
      flash(`Munkakör törölve — ${used.length} fő átsorolva ide: ${fb.label}.`, "info");
    } else flash("Munkakör törölve.", "info");
    setRoles((p) => p.filter((x) => x.id !== id));
    setRoleEdit(null);
  }

  function openShiftEditor(preset) {
    const deptEmps = EMPLOYEES.filter((e) => e.dept === viewDept);
    if (preset && preset.id) setShiftEdit({ ...preset, weekOffset: preset.weekOffset ?? 0 });
    else setShiftEdit({ dayIndex: preset?.dayIndex ?? todayIndex, employeeId: preset?.employeeId ?? deptEmps[0]?.id, start: preset?.start ?? "16:00", end: preset?.end ?? "22:00", weekOffset: preset?.weekOffset ?? planOffset, unit: preset?.unit ?? "pastamore" });
  }
  function copyWeekInto(targetOffset) {
    if (shifts.some((s) => (s.weekOffset ?? 0) === targetOffset && empDept(s.employeeId) === viewDept)) { flash("Ezen a héten már van beosztás ebben a részlegben.", "warn"); return; }
    const base = shifts.filter((s) => (s.weekOffset ?? 0) === 0 && empDept(s.employeeId) === viewDept);
    if (base.length === 0) { flash("Az aktuális héten nincs mit másolni.", "info"); return; }
    const copies = base.map((s, i) => ({ id: Date.now() + i + 1, employeeId: s.employeeId, dayIndex: s.dayIndex, start: s.start, end: s.end, weekOffset: targetOffset, unit: s.unit ?? "pastamore" }));
    setShifts((p) => [...p, ...copies]);
    flash(`Aktuális hét átmásolva ide (${copies.length} műszak).`, "ok");
  }
  function saveShift() {
    const se = shiftEdit;
    if (!se.employeeId || !se.start || !se.end) { flash("Hiányzó adat (dolgozó / idő).", "warn"); return; }
    if (se.id) { setShifts((p) => p.map((s) => s.id === se.id ? { ...s, dayIndex: se.dayIndex, employeeId: se.employeeId, start: se.start, end: se.end, unit: se.unit ?? "pastamore" } : s)); flash("Műszak frissítve.", "ok"); }
    else { setShifts((p) => [...p, { id: Date.now(), dayIndex: se.dayIndex, employeeId: se.employeeId, start: se.start, end: se.end, weekOffset: se.weekOffset ?? 0, unit: se.unit ?? "pastamore" }]); flash("Műszak hozzáadva.", "ok"); }
    setShiftEdit(null);
  }
  function deleteShift(id) { setShifts((p) => p.filter((s) => s.id !== id)); if (shiftEdit?.id === id) setShiftEdit(null); flash("Műszak törölve.", "info"); }

  /* ---- Drag & drop a beosztáshoz (pointer-alapú: egér + érintés) ---- */
  const dragRef = useRef(null);
  const [dragUI, setDragUI] = useState(null);
  function dndMove(ev) {
    const d = dragRef.current; if (!d) return;
    const dist = Math.hypot(ev.clientX - d.start.x, ev.clientY - d.start.y);
    if (!d.active) {
      if (dist <= 6) return;
      if (d.mode === "cell" && d.cell.shiftId != null) { d.active = true; d.payload = { start: d.cell.start, end: d.cell.end }; }
      else { d.canceledTap = true; return; }
    }
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const cellEl = el && el.closest ? el.closest("[data-cell]") : null;
    setDragUI({ x: ev.clientX, y: ev.clientY, overKey: cellEl ? cellEl.getAttribute("data-cell") : null, label: d.payload ? `${d.payload.start}–${d.payload.end}` : "", del: d.mode === "cell" });
    ev.preventDefault();
  }
  function dndUp(ev) {
    const d = dragRef.current;
    window.removeEventListener("pointermove", dndMove);
    window.removeEventListener("pointerup", dndUp);
    dragRef.current = null; setDragUI(null);
    if (!d) return;
    if (d.active) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cellEl = el && el.closest ? el.closest("[data-cell]") : null;
      applyDrop(d, cellEl ? cellEl.getAttribute("data-cell") : null);
    } else if (!d.canceledTap && d.mode === "cell") {
      openCellEditor(d.cell);
    }
  }
  function startCellDrag(ev, cell) {
    if (ev.button != null && ev.button !== 0) return;
    dragRef.current = { mode: "cell", start: { x: ev.clientX, y: ev.clientY }, cell, payload: null, active: false, canceledTap: false };
    window.addEventListener("pointermove", dndMove, { passive: false });
    window.addEventListener("pointerup", dndUp);
  }
  function startTemplateDrag(ev, block) {
    if (ev.button != null && ev.button !== 0) return;
    dragRef.current = { mode: "template", start: { x: ev.clientX, y: ev.clientY }, cell: null, payload: { start: block.start, end: block.end }, active: true, canceledTap: false };
    setDragUI({ x: ev.clientX, y: ev.clientY, overKey: null, label: `${block.start}–${block.end}`, del: false });
    window.addEventListener("pointermove", dndMove, { passive: false });
    window.addEventListener("pointerup", dndUp);
    ev.preventDefault();
  }
  function addBlock() { setBlocks((p) => [...p, { id: Math.max(0, ...p.map((b) => b.id)) + 1, start: "09:00", end: "17:00" }]); }
  function updateBlock(id, field, value) { setBlocks((p) => p.map((b) => b.id === id ? { ...b, [field]: value } : b)); }
  function removeBlock(id) { setBlocks((p) => p.filter((b) => b.id !== id)); }
  function openCellEditor(cell) {
    if (cell.shiftId != null) setShiftEdit({ id: cell.shiftId, dayIndex: cell.dayIndex, employeeId: cell.employeeId, start: cell.start, end: cell.end, weekOffset: cell.weekOffset, unit: cell.unit ?? "pastamore" });
    else { const e = emp(cell.employeeId); openShiftEditor({ dayIndex: cell.dayIndex, employeeId: cell.employeeId, start: templatesFor(e)[0][0], end: templatesFor(e)[0][1], weekOffset: cell.weekOffset }); }
  }
  function applyDrop(d, key) {
    if (!key) return;
    if (key === "trash") { if (d.mode === "cell" && d.cell.shiftId != null) { setShifts((p) => p.filter((s) => s.id !== d.cell.shiftId)); flash("Műszak törölve.", "info"); } return; }
    const [eidS, dayS, wkS] = key.split(":");
    const employeeId = Number(eidS), dayIndex = Number(dayS), weekOffset = Number(wkS);
    if (d.mode === "cell" && d.cell.shiftId != null) {
      if (d.cell.employeeId === employeeId && d.cell.dayIndex === dayIndex && (d.cell.weekOffset ?? 0) === weekOffset) return;
      setShifts((prev) => {
        const moving = prev.find((s) => s.id === d.cell.shiftId); if (!moving) return prev;
        const occ = prev.find((s) => s.id !== moving.id && s.employeeId === employeeId && s.dayIndex === dayIndex && (s.weekOffset ?? 0) === weekOffset);
        return prev.map((s) => {
          if (s.id === moving.id) return { ...s, employeeId, dayIndex, weekOffset };
          if (occ && s.id === occ.id) return { ...s, employeeId: moving.employeeId, dayIndex: moving.dayIndex, weekOffset: moving.weekOffset ?? 0 };
          return s;
        });
      });
      flash("Műszak áthelyezve.", "ok");
    } else if (d.payload) {
      const { start, end } = d.payload;
      setShifts((prev) => {
        const ex = prev.find((s) => s.employeeId === employeeId && s.dayIndex === dayIndex && (s.weekOffset ?? 0) === weekOffset);
        if (ex) return prev.map((s) => s.id === ex.id ? { ...s, start, end } : s);
        return [...prev, { id: Date.now(), employeeId, dayIndex, weekOffset, start, end, unit: "pastamore" }];
      });
      flash("Műszak a táblára helyezve.", "ok");
    }
  }

  function openOff() { setOffDays([]); setOffNote(""); setCalMonth(CUR_MONTH); setOffModal(true); }
  const offCapFor = (k) => (offCaps[k] ?? offDefaultCap);
  const offTakenFor = (k, dept) => timeOff.filter((t) => t.date === k && (t.status === "pending" || t.status === "approved") && empDept(t.employeeId) === dept).length;
  const offRemainingFor = (k, dept) => Math.max(0, offCapFor(k) - offTakenFor(k, dept));
  function addCapOverride() { if (!capDateInput) return; const [yy, mm, dd] = capDateInput.split("-").map(Number); const k = dayKey(new Date(yy, mm - 1, dd).getTime()); setOffCaps((p) => ({ ...p, [k]: Number(capValInput) })); setCapDateInput(""); flash(Number(capValInput) === 0 ? "Zárt nap beállítva." : `Keret beállítva: ${capValInput} fő.`, "ok"); }
  function removeCapOverride(k) { setOffCaps((p) => { const n = { ...p }; delete n[k]; return n; }); }
  function submitTimeOff() {
    if (offDays.length === 0) { flash("Válassz legalább egy napot a naptárból.", "warn"); return; }
    const dept = me.dept;
    const existing = timeOff.filter((t) => t.employeeId === userId && t.status !== "declined").map((t) => t.date);
    const blocked = offDays.filter((k) => offCapFor(k) === 0 || offRemainingFor(k, dept) <= 0);
    const allowed = offDays.filter((k) => !blocked.includes(k));
    const fresh = allowed.filter((k) => !existing.includes(k)).map((k, i) => ({ id: Date.now() + i, employeeId: userId, date: k, note: offNote.trim(), status: "pending" }));
    if (fresh.length === 0) flash(blocked.length ? "A választott nap(ok)ra már betelt a szabadnap-keret." : "Ezekre a napokra már van kérésed.", "warn");
    else { setTimeOff((p) => [...p, ...fresh]); flash(`Szabadnap-kérés elküldve (${fresh.length} nap)${blocked.length ? ` · ${blocked.length} nap betelt keret miatt kimaradt` : ""}.`, "ok"); }
    setOffModal(false); setOffDays([]); setOffNote("");
  }
  function decideTimeOff(id, approve) { setTimeOff((p) => p.map((t) => t.id === id ? { ...t, status: approve ? "approved" : "declined" } : t)); flash(approve ? "Szabadnap jóváhagyva ✓" : "Szabadnap-kérés elutasítva.", approve ? "ok" : "warn"); }

  function openAnnCompose() { setAnnScopeType("all"); setAnnRole([...new Set(EMPLOYEES.filter((e) => e.dept === viewDept).map((e) => e.role))][0] || ""); setAnnTitle(""); setAnnBody(""); setAnnPinned(false); setAnnOpen(true); }
  function postAnnouncement() {
    if (!annTitle.trim()) { flash("Adj címet a közleménynek.", "warn"); return; }
    const scope = annScopeType === "dept" ? { type: "dept", value: viewDept } : annScopeType === "role" ? { type: "role", value: annRole } : { type: "all" };
    setAnnouncements((p) => [{ id: Date.now(), authorId: meId, scope, title: annTitle.trim(), body: annBody.trim(), pinned: annPinned, date: Date.now() }, ...p]);
    flash("Közlemény közzétéve 📢", "ok"); setAnnOpen(false);
  }

  const inDept = (id) => emp(id)?.dept === viewDept;

  /* ====== Heti rács ====== */
  function WeekGrid({ deptId, editable, weekOffset = 0 }) {
    const gridDates = weekDatesFor(weekOffset);
    const isCur = weekOffset === 0;
    const rows = EMPLOYEES.filter((e) => e.dept === deptId);
    const cells = [];
    cells.push(<div key="corner" className="sticky left-0 z-10 bg-slate-900 border-b border-r border-slate-700/60 px-1.5 py-2 text-[10px] text-slate-500 font-medium">Dolgozó</div>);
    gridDates.forEach((d, di) => cells.push(<div key={`h${di}`} className={`border-b border-slate-700/60 px-1 py-1.5 text-center ${isCur && di === todayIndex ? "bg-amber-400/10" : ""}`}><div className={`text-[10px] font-semibold ${isCur && di === todayIndex ? "text-amber-300" : "text-slate-300"}`}>{DAYS_SHORT[di]}</div><div className="text-[9px] text-slate-500">{d.getDate()}</div></div>));
    rows.forEach((e) => {
      const c = C[e.color];
      cells.push(<div key={`n${e.id}`} className={`sticky left-0 z-10 bg-slate-900 border-b border-r border-slate-700/60 px-1.5 py-1.5 flex items-center gap-1 ${e.id === userId ? "bg-amber-400/5" : ""}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />{e.specialty && <SpecIcon id={e.specialty} className={`w-3 h-3 shrink-0 ${c.text}`} />}<span className="text-[11px] text-slate-300 truncate leading-tight">{shortName(e.name)}</span></div>);
      gridDates.forEach((d, di) => {
        const dk = dayKey(d);
        const shift = shifts.find((s) => s.employeeId === e.id && s.dayIndex === di && (s.weekOffset ?? 0) === weekOffset);
        const off = timeOff.find((t) => t.employeeId === e.id && t.date === dk && t.status === "approved");
        const offPend = timeOff.find((t) => t.employeeId === e.id && t.date === dk && t.status === "pending");
        const todayCol = isCur && di === todayIndex ? "bg-amber-400/5" : "";
        let inner;
        if (shift) inner = <div className={`relative w-full h-full rounded ${c.chip} px-0.5 py-1 flex flex-col items-center justify-center leading-none`}><span className="text-[9px] font-semibold">{shift.start}</span><span className="text-[9px] opacity-70">{shift.end}</span>{(shift.unit ?? "pastamore") === "butcher" && <span className="absolute top-0 left-0 text-[7px] font-bold leading-none px-0.5 rounded-br bg-amber-500/35 text-amber-50">OB</span>}{(off || offPend) && <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-400" />}</div>;
        else if (off) inner = <div className="w-full h-full rounded bg-emerald-500/10 flex items-center justify-center"><Bed className="w-3 h-3 text-emerald-400" /></div>;
        else if (offPend) inner = <div className="w-full h-full rounded bg-amber-400/5 flex items-center justify-center"><Bed className="w-3 h-3 text-amber-400/60" /></div>;
        else inner = editable ? <div className="w-full h-full rounded flex items-center justify-center text-slate-700"><Plus className="w-3 h-3" /></div> : null;
        const cellKey = `${e.id}:${di}:${weekOffset}`;
        const cls = `border-b border-slate-800 ${todayCol} p-0.5 h-11`;
        cells.push(editable
          ? <div key={`c${e.id}-${di}`} role="button" data-cell={cellKey} onPointerDown={(ev) => startCellDrag(ev, { employeeId: e.id, dayIndex: di, weekOffset, shiftId: shift?.id ?? null, start: shift?.start ?? null, end: shift?.end ?? null, unit: shift?.unit ?? "pastamore" })} style={shift ? { touchAction: "none" } : undefined} className={`${cls} select-none ${shift ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${dragUI?.overKey === cellKey ? "ring-2 ring-inset ring-amber-400/70 bg-amber-400/10" : "hover:bg-slate-700/30"}`}>{inner}</div>
          : <div key={`c${e.id}-${di}`} className={cls}>{inner}</div>);
      });
    });
    return <div className="overflow-x-auto -mx-1 border border-slate-700/60 rounded-xl"><div className="min-w-max" style={{ display: "grid", gridTemplateColumns: "88px repeat(7, 48px)" }}>{cells}</div></div>;
  }
  const Legend = () => (<div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 flex-wrap"><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-600" /> műszak</span><span className="flex items-center gap-1"><span className="text-[8px] font-bold leading-none px-0.5 rounded bg-amber-500/35 text-amber-50">OB</span> Old Butcher's Pub</span><span className="flex items-center gap-1"><Bed className="w-3 h-3 text-emerald-400" /> jóváhagyott szabadnap</span><span className="flex items-center gap-1"><Bed className="w-3 h-3 text-amber-400/60" /> kért szabadnap</span></div>);

  /* ====== KÖZPONT ====== */
  function CentralTab() {
    const curDept = isMgr ? viewDept : me.dept;
    const anns = announcements.filter((a) => annVisible(a, me)).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.date - a.date);
    const deptLive = entries.filter((e) => e.checkOut == null && empDept(e.employeeId) === curDept).length;
    const deptCount = EMPLOYEES.filter((e) => e.dept === curDept).length;
    return (
      <div className="space-y-4">
        <Card className="p-4 relative overflow-hidden"><span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(${BRAND.red}, ${BRAND.redDark})` }} />
          <div className="flex items-center justify-between"><div><div className="text-lg font-bold text-white">Szia, {firstName(me.name)}! 👋</div><div className="text-xs text-slate-400 capitalize">{today.toLocaleDateString("hu-HU", { weekday: "long", month: "long", day: "numeric" })}</div></div><Avatar id={meId} size="w-11 h-11" /></div>
          {!isMgr ? (
            <div className="mt-3 pt-3 border-t border-slate-700/60">
              {myOpen ? (<div className="flex items-center justify-between"><div><div className="text-xs text-slate-400">Aktív műszak</div><div className="text-xl font-bold text-emerald-300 tabular-nums">{fmtClock(liveWorked(myOpen))}</div></div><button onClick={() => setTab("clock")} className="text-xs px-3 py-2 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700">Bélyegző →</button></div>) : myTodayShift ? (<div className="flex items-center justify-between"><div><div className="text-xs text-slate-400">Mai műszak</div><div className="text-base font-semibold text-slate-100">{myTodayShift.start}–{myTodayShift.end}{(myTodayShift.unit ?? "pastamore") === "butcher" && <span className="ml-1.5 text-[11px] font-medium text-amber-300">· Old Butcher's Pub</span>}</div></div><button onClick={() => setTab("clock")} className="text-xs px-3 py-2 rounded-lg bg-amber-500 text-slate-900 font-medium hover:bg-amber-400">Becsekkolás →</button></div>) : <div className="text-sm text-slate-500">Ma nincs beosztott műszakod – pihenj! 🌿</div>}
            </div>
          ) : <div className="mt-3 pt-3 border-t border-slate-700/60 text-sm text-slate-400">{deptLabel(curDept)} · <span className="text-emerald-300 font-medium">{deptLive} bent</span> / {deptCount} fő</div>}
        </Card>
        <div>
          <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-amber-400" /> Hírfolyam</div>{isMgr && <button onClick={openAnnCompose} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700"><Plus className="w-3.5 h-3.5" /> Közlemény</button>}</div>
          <div className="space-y-2">{anns.length === 0 && <div className="text-xs text-slate-600">Nincs közlemény.</div>}{anns.map((a) => (<Card key={a.id} className={`p-3 ${a.pinned ? "border-amber-400/40" : ""}`}><div className="flex items-center gap-2 mb-1.5"><Avatar id={a.authorId} size="w-6 h-6" /><span className="text-xs text-slate-400">{emp(a.authorId).name}</span><span className="text-xs text-slate-600">· {ago(a.date)}</span><div className="ml-auto flex items-center gap-1.5">{a.pinned && <Pin className="w-3.5 h-3.5 text-amber-400" />}<Badge tone={a.scope.type === "all" ? "slate" : a.scope.type === "dept" ? "blue" : "violet"}>{scopeText(a.scope)}</Badge></div></div><div className="text-sm font-semibold text-slate-100">{a.title}</div>{a.body && <div className="text-sm text-slate-400 mt-0.5">{a.body}</div>}</Card>))}</div>
        </div>
      </div>
    );
  }

  /* ====== ALKALMAZOTT ====== */
  function ClockTab() {
    const onBreak = !!myOpen?.breakStart;
    const sh = myOpen ? shiftForEntry(myOpen) : null;
    const ss = sh ? atTime(new Date(myOpen.date), sh.start) : null;
    const se = sh ? schedEnd(new Date(myOpen.date), sh.start, sh.end) : null;
    const beforeStart = !!(myOpen && sh && !myOpen.earlyApproved && now < ss);
    const otMin = (myOpen && sh && now > se && !myOpen.otApproved) ? Math.round((now - se) / 60000) : 0;
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-slate-200 font-medium"><MapPin className="w-4 h-4 text-amber-400" /> Helyhez kötött bélyegzés</div><Badge tone={atWork ? "green" : "red"}>{atWork ? "A munkahelyen" : "Távol"}</Badge></div>
          <div className={`flex items-center gap-3 rounded-xl p-3 ${atWork ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}><Shield className={`w-5 h-5 ${atWork ? "text-emerald-400" : "text-rose-400"}`} /><div className="text-sm"><div className="text-slate-200 font-medium">{RESTAURANT.name}</div><div className="text-slate-400">{distance == null ? "Pozíció ismeretlen" : `Távolság: ${distance >= 1000 ? (distance / 1000).toFixed(1) + " km" : Math.round(distance) + " m"} · zóna: ${RESTAURANT.radius} m`}</div></div></div>
          <div className="mt-3 flex items-center gap-2"><div className="flex bg-slate-900/60 rounded-lg p-0.5 text-xs"><button onClick={() => { setGeoMode("sim"); setSim("here"); }} className={`px-2.5 py-1.5 rounded-md ${geoMode === "sim" && sim === "here" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400"}`}>Munkahelyen</button><button onClick={() => { setGeoMode("sim"); setSim("away"); }} className={`px-2.5 py-1.5 rounded-md ${geoMode === "sim" && sim === "away" ? "bg-rose-500/20 text-rose-300" : "text-slate-400"}`}>Távol</button></div><button onClick={useRealGps} className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700"><Wifi className="w-3.5 h-3.5" /> {geoBusy ? "Keresés…" : "Valódi GPS"}</button></div>
        </Card>
        <Card className="p-5 text-center">
          {myTodayShift ? <div className="text-sm text-slate-400 mb-3">Mai beosztásod: <span className="text-slate-200 font-medium">{myTodayShift.start}–{myTodayShift.end}</span>{(myTodayShift.unit ?? "pastamore") === "butcher" && <span className="text-amber-300 font-medium"> · Old Butcher's Pub</span>}</div> : <div className="text-sm text-slate-500 mb-3">Ma nincs beosztott műszakod</div>}
          {myOpen ? (
            <>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{beforeStart ? "Becsekkolva – műszak még nem kezdődött" : onBreak ? "Szünet folyamatban" : "Fizetett munkaidő"}</div>
              <div className="text-4xl font-bold text-white tabular-nums tracking-tight">{fmtClock(paidMs(myOpen))}</div>
              <div className="text-slate-400 text-sm mt-1">Becsekkolva: {timeStr(myOpen.checkIn)}{sh && ` · műszak ${sh.start}–${sh.end}`}</div>
              {beforeStart && <div className="text-xs text-amber-300/90 mt-1.5">A fizetett idő {sh.start}-kor indul (a korábbi perceket nem számítjuk).</div>}
              {otMin > 0 && <div className="text-xs text-amber-300/90 mt-1.5 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> Túlóra: {otMin}p — jóváhagyásig nem számít a fizetett időbe.</div>}
              <div className="grid grid-cols-2 gap-2 mt-5"><button onClick={toggleBreak} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${onBreak ? "bg-amber-500 text-slate-900" : "bg-slate-700/60 text-slate-200 hover:bg-slate-700"}`}>{onBreak ? <Play className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}{onBreak ? "Szünet vége" : "Szünet"}</button><button onClick={() => attemptClock("out")} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-rose-500 text-white hover:bg-rose-600 transition"><LogOut className="w-4 h-4" /> Kicsekkolás</button></div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/10 flex items-center justify-center mb-4 ring-1 ring-amber-400/30"><Clock className="w-9 h-9 text-amber-400" /></div>
              <div className="text-slate-300 mb-1">Készen állsz a műszakra?</div>
              <div className="text-xs text-slate-500 mb-5">Becsekkoláshoz a helyszínen kell lenned + QR-kód</div>
              <button onClick={() => attemptClock("in")} disabled={!atWork} className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition ${atWork ? "bg-amber-500 text-slate-900 hover:bg-amber-400" : "bg-slate-700/50 text-slate-500 cursor-not-allowed"}`}><LogIn className="w-5 h-5" /> Becsekkolás</button>
              {!atWork && <div className="text-xs text-rose-300/80 mt-2 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> A helyszínen kívül a bélyegzés le van tiltva</div>}
            </>
          )}
        </Card>
      </div>
    );
  }

  function EmployeeScheduleTab() {
    const head = emp(DEPT_HEAD[me.dept]);
    const myReq = timeOff.filter((t) => t.employeeId === userId).sort((a, b) => a.date - b.date);
    const myWeek = weekDates.map((d, di) => ({ d, di, shift: shifts.find((s) => s.employeeId === userId && s.dayIndex === di && (s.weekOffset ?? 0) === 0), off: timeOff.find((t) => t.employeeId === userId && t.date === dayKey(d) && t.status === "approved") }));
    const totalMin = myWeek.reduce((s, x) => s + (x.shift ? (schedEnd(x.d, x.shift.start, x.shift.end) - atTime(x.d, x.shift.start)) / 60000 : 0), 0);
    const workDays = myWeek.filter((x) => x.shift).length;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs flex-1">
            <button onClick={() => setEmpSchedView("self")} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md ${empSchedView === "self" ? "bg-amber-500 text-slate-900 font-medium" : "text-slate-400"}`}><User className="w-3.5 h-3.5" /> Saját</button>
            <button onClick={() => setEmpSchedView("dept")} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md ${empSchedView === "dept" ? "bg-amber-500 text-slate-900 font-medium" : "text-slate-400"}`}><CalendarDays className="w-3.5 h-3.5" /> Részleg</button>
          </div>
          <button onClick={openOff} className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700"><Bed className="w-3.5 h-3.5" /> Szabadnap</button>
        </div>

        {empSchedView === "self" ? (
          <>
            <Card className="p-4"><div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-slate-400">Heti beosztott idő</div><div className="text-2xl font-bold text-white">{fmtDur(totalMin * 60000)}</div></div><div><div className="text-xs text-slate-400">Műszakok</div><div className="text-2xl font-bold text-amber-300">{workDays} nap</div></div></div></Card>
            <div className="space-y-2">
              {myWeek.map((x) => (
                <Card key={x.di} className={`p-3 flex items-center justify-between ${x.di === todayIndex ? "ring-1 ring-amber-400/40" : ""}`}>
                  <div className="flex items-center gap-2"><div className="w-9 text-center"><div className={`text-xs font-semibold ${x.di === todayIndex ? "text-amber-300" : "text-slate-300"}`}>{DAYS_SHORT[x.di]}</div><div className="text-[10px] text-slate-500">{x.d.getDate()}</div></div><div className="text-sm text-slate-300">{DAYS_FULL[x.di]}{x.di === todayIndex && <span className="text-amber-300"> · ma</span>}</div></div>
                  {x.shift ? <span className="flex items-center gap-1.5">{(x.shift.unit ?? "pastamore") === "butcher" && <span className="text-[8px] font-bold leading-none px-1 py-0.5 rounded bg-amber-500/30 text-amber-100">OB</span>}<span className="text-sm font-semibold text-slate-100 tabular-nums">{x.shift.start}–{x.shift.end}</span></span> : x.off ? <Badge tone="green">Szabadnap</Badge> : <span className="text-xs text-slate-600">pihenő</span>}
                </Card>
              ))}
            </div>
            {myReq.length > 0 && (<div className="pt-1"><div className="text-sm font-medium text-slate-300 mb-2">Szabadnap-kéréseim</div><div className="space-y-2">{myReq.map((t) => { const tone = t.status === "approved" ? "green" : t.status === "declined" ? "red" : "amber"; const lab = { pending: "Elbírálás alatt", approved: "Jóváhagyva", declined: "Elutasítva" }[t.status]; return (<Card key={t.id} className="p-3 flex items-center justify-between"><div className="text-sm"><div className="text-slate-200 capitalize">{fullDate(t.date)}</div>{t.note && <div className="text-xs text-slate-500">{t.note}</div>}</div><Badge tone={tone}>{lab}</Badge></Card>); })}</div></div>)}
          </>
        ) : (
          <>
            <div className="text-xs text-slate-500">{deptLabel(me.dept)} · készíti: {head?.name}</div>
            <WeekGrid deptId={me.dept} editable={false} />
            <Legend />
          </>
        )}
      </div>
    );
  }

  function SwapsTab() {
    const myDept = me.dept;
    const openOthers = swaps.filter((w) => w.status === "open" && w.fromEmployeeId !== userId && w.shiftId && emp(w.fromEmployeeId).dept === myDept);
    const mine = swaps.filter((w) => w.fromEmployeeId === userId || w.toEmployeeId === userId);
    return (
      <div className="space-y-5">
        <div><div className="text-sm font-medium text-slate-300 mb-2">Közelgő műszakjaim</div><div className="space-y-2">{upcomingMine.length === 0 && <div className="text-xs text-slate-600">Nincs közelgő műszakod ezen a héten.</div>}{upcomingMine.map((s) => { const offered = swaps.some((w) => w.shiftId === s.id && ["open", "pending"].includes(w.status)); return (<Card key={s.id} className="p-3 flex items-center justify-between"><div className="text-sm"><div className="text-slate-200">{DAYS_FULL[s.dayIndex]}</div><div className="text-slate-500 text-xs tabular-nums">{s.start}–{s.end}</div></div>{offered ? <Badge tone="amber">Felajánlva</Badge> : <button onClick={() => offerShift(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"><Repeat className="w-3.5 h-3.5" /> Felajánl</button>}</Card>); })}</div></div>
        <div><div className="text-sm font-medium text-slate-300 mb-2">Elérhető cserék <span className="text-slate-500 font-normal">· {deptLabel(myDept)}</span></div><div className="space-y-2">{openOthers.length === 0 && <div className="text-xs text-slate-600">Jelenleg nincs elérhető műszak a részlegedben.</div>}{openOthers.map((w) => <Card key={w.id} className="p-3 flex items-center justify-between"><div className="flex items-center gap-2.5"><Avatar id={w.fromEmployeeId} size="w-8 h-8" /><div className="text-sm"><div className="text-slate-200">{emp(w.fromEmployeeId).name}</div><div className="text-slate-500 text-xs">{shiftLabel(w.shiftId)}</div></div></div><button onClick={() => claimSwap(w.id)} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-medium hover:bg-amber-400">Elvállalom</button></Card>)}</div></div>
        <div><div className="text-sm font-medium text-slate-300 mb-2">Kéréseim</div><div className="space-y-2">{mine.length === 0 && <div className="text-xs text-slate-600">Nincs aktív cserekérésed.</div>}{mine.map((w) => { const tone = w.status === "approved" ? "green" : w.status === "rejected" ? "red" : w.status === "pending" ? "amber" : "slate"; const label = { open: "Felajánlva", pending: "Jóváhagyásra vár", approved: "Jóváhagyva", rejected: "Elutasítva" }[w.status]; return (<Card key={w.id} className="p-3 flex items-center justify-between"><div className="text-sm"><div className="text-slate-200">{shiftLabel(w.shiftId)}</div><div className="text-slate-500 text-xs">{w.fromEmployeeId === userId ? "Te ajánlottad fel" : `Átvennéd: ${emp(w.fromEmployeeId).name}`}</div></div><div className="flex items-center gap-2"><Badge tone={tone}>{label}</Badge>{w.status === "open" && w.fromEmployeeId === userId && <button onClick={() => cancelOffer(w.id)} className="text-slate-500 hover:text-rose-300"><X className="w-4 h-4" /></button>}</div></Card>); })}</div></div>
      </div>
    );
  }

  function MyHoursTab() {
    const mine = entries.filter((e) => e.employeeId === userId).sort((a, b) => b.checkIn - a.checkIn);
    const mins = weekMinutes(userId); const pay = (mins / 60) * emp(userId).rate;
    return (
      <div className="space-y-4">
        <Card className="p-4"><div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-slate-400">Heti fizetett idő</div><div className="text-2xl font-bold text-white">{fmtDur(mins * 60000)}</div></div><div><div className="text-xs text-slate-400">Becsült bér</div><div className="text-2xl font-bold text-amber-300">{ft(pay)}</div></div></div><div className="text-xs text-slate-500 mt-2">Órabér: {ft(emp(userId).rate)} · a fizetett idő a beosztott műszakhoz igazítva</div></Card>
        <div className="text-sm font-medium text-slate-300">Bélyegzéseim</div>
        <div className="space-y-2">{mine.length === 0 && <div className="text-xs text-slate-600">Még nincs bélyegzésed ezen a héten.</div>}{mine.map((e) => { const actual = liveWorked(e), paid = paidMs(e); const diff = Math.abs(Math.round(actual / 60000) - Math.round(paid / 60000)) >= 1; return (<Card key={e.id} className={`p-3 ${e.flagged ? "border-amber-400/40" : ""}`}><div className="flex items-center justify-between"><div className="text-sm text-slate-200">{new Date(e.checkIn).toLocaleDateString("hu-HU", { weekday: "long", month: "short", day: "numeric" })}</div>{e.checkOut ? <span className="text-sm font-semibold text-slate-100">{fmtDur(paid)}</span> : <Badge tone="green">Aktív</Badge>}</div><div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap"><span className="tabular-nums">{timeStr(e.checkIn)} → {e.checkOut ? timeStr(e.checkOut) : "…"}</span>{e.checkOut && diff && <span>· jelenlét: {fmtDur(actual)}</span>}{e.otApproved && <Badge tone="green">túlóra beszámítva</Badge>}{e.earlyApproved && <Badge tone="green">korai kezdés beszámítva</Badge>}{e.forgotCheckout && <Badge tone="orange">elfelejtett kicsekkolás</Badge>}</div>{e.flagged && <div className="text-xs text-amber-300 mt-2 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />{e.flagReason}</div>}</Card>); })}</div>
      </div>
    );
  }

  function SanctionRow({ s, manager }) {
    const withdrawn = s.status === "withdrawn";
    return (
      <Card className={`p-3 ${withdrawn ? "opacity-50" : ""}`}>
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 min-w-0">{s.warning ? <ScrollText className={`w-4 h-4 shrink-0 text-amber-400`} /> : <Gavel className={`w-4 h-4 shrink-0 ${C[emp(s.employeeId).color]?.text || "text-slate-400"}`} />}<span className={`text-sm truncate ${withdrawn ? "line-through text-slate-400" : "text-slate-200"}`}>{s.title}</span></div><div className="flex items-center gap-2 shrink-0"><Badge tone={s.warning ? "amber" : catTone(s.cat)}>{s.warning ? "Írásbeli" : (s.fine > 0 ? ft(s.fine) : catLabel(s.cat))}</Badge>{manager && !withdrawn && <button onClick={() => withdrawSanction(s.id)} className="text-slate-500 hover:text-emerald-300" title="Visszavonás"><RotateCcw className="w-4 h-4" /></button>}</div></div>
        {s.consequences?.length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{s.consequences.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300">{CONSEQ[c]}</span>)}</div>}
        <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap"><span>{dateLabel(s.date)}</span>{s.warning ? <Badge tone="amber">Írásbeli figyelmeztetés</Badge> : <Badge tone={s.cat === "serious" ? "red" : "slate"}>{catLabel(s.cat)}</Badge>}<Badge tone={s.source === "auto" ? "blue" : "slate"}>{s.source === "auto" ? "Automatikus" : "Vezetői"}</Badge>{withdrawn && <Badge tone="green">Visszavonva</Badge>}</div>
        {s.note && <div className="text-xs text-slate-400 mt-1.5 italic">„{s.note}”</div>}
      </Card>
    );
  }
  function MySanctionsTab() {
    const mine = sanctions.filter((s) => s.employeeId === userId).sort((a, b) => b.date - a.date);
    const total = activeFines(userId); const st = standing(userId);
    const warns = sanctions.filter((s) => s.employeeId === userId && s.status === "active" && s.warning).length;
    const general = SANCTION_CATALOG.filter((t) => t.cat === "general" && !t.warning);
    const serious = SANCTION_CATALOG.filter((t) => t.cat === "serious");
    const fineLabel = (t) => t.variable ? (t.fine ? `${ft(t.fine)} + ${VAR_LABEL[t.variable].toLowerCase()}` : VAR_LABEL[t.variable]) : ft(t.fine);
    return (
      <div className="space-y-4">
        <Card className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-slate-400">Aktív bírság összesen</div><div className="text-3xl font-bold text-white tabular-nums">{ft(total)}</div></div><Badge tone={st.tone}>{st.label}</Badge></div></Card>
        {warns > 0 && <Card className="p-3 flex items-center gap-2.5 border-amber-400/30"><ScrollText className="w-4 h-4 text-amber-400 shrink-0" /><span className="text-sm text-amber-200">{warns} aktív írásbeli figyelmeztetésed van.</span></Card>}
        <Card className="p-0 overflow-hidden"><button onClick={() => setShowPolicy((v) => !v)} className="w-full flex items-center justify-between p-3.5 text-sm text-slate-200"><span className="flex items-center gap-2"><ScrollText className="w-4 h-4 text-amber-400" /> Szankciós szabályzat</span><ChevronDown className={`w-4 h-4 text-slate-400 transition ${showPolicy ? "rotate-180" : ""}`} /></button>{showPolicy && <div className="px-4 pb-4 text-xs border-t border-slate-700/60 pt-3 space-y-3">
          <div className="text-slate-400">Késés: 0–15 perc türelmi idő (nincs bírság). A pénzbírságok a kollektív szabályzat szerint:</div>
          <div><div className="text-amber-300 font-medium mb-1">Általános szabálysértések</div><div className="space-y-1">{general.map((t) => <div key={t.id} className="flex justify-between gap-3"><span className="text-slate-400">{t.label}</span><span className="text-slate-200 text-right shrink-0">{fineLabel(t)}</span></div>)}</div></div>
          <div><div className="text-rose-300 font-medium mb-1">Súlyosabb szabálysértések</div><div className="space-y-1">{serious.map((t) => <div key={t.id} className="flex justify-between gap-3"><span className="text-slate-400">{t.label}</span><span className="text-slate-200 text-right shrink-0">{fineLabel(t)}</span></div>)}</div></div>
          <div className="text-slate-500">A súlyos esetek munkáltatói figyelmeztetést, kártérítést, eseti tesztelést, illetve azonnali hatályú felmondást és feljelentést is maguk után vonhatnak.</div>
        </div>}</Card>
        <div className="text-sm font-medium text-slate-300">Szankcióim</div>
        <div className="space-y-2">{mine.length === 0 ? <div className="text-xs text-slate-600">Nincs szankciód. Szép munka! 🎉</div> : mine.map((s) => <SanctionRow key={s.id} s={s} />)}</div>
      </div>
    );
  }
  // Dolgozói "Beosztás" fül: a beosztás, az órák és a szankciók egy helyen
  function EmployeeWorkTab() {
    const items = [
      { id: "schedule", label: "Beosztás", icon: CalendarDays },
      { id: "hours", label: "Óráim", icon: BarChart3 },
      { id: "sanctions", label: "Szankciók", icon: Gavel, count: cMyActiveSanctions },
    ];
    return (
      <div>
        <SubTabs items={items} value={empWorkSub} onChange={setEmpWorkSub} />
        {empWorkSub === "schedule" ? <EmployeeScheduleTab /> : empWorkSub === "hours" ? <MyHoursTab /> : <MySanctionsTab />}
      </div>
    );
  }

  /* ====== VEZETŐ ====== */
  function OverviewTab() {
    const live = entries.filter((e) => e.checkOut == null && inDept(e.employeeId));
    const flagged = entries.filter((e) => e.flagged && inDept(e.employeeId));
    const pendingSwaps = swaps.filter((w) => w.status === "pending" && inDept(w.fromEmployeeId));
    const activeSanc = sanctions.filter((s) => s.status === "active" && inDept(s.employeeId));
    return (
      <div className="space-y-4">
        {DutyManagerCard({ editable: true })}
        {(() => { const pendingActiv = people.filter((p) => p.account === "pending" && p.level === "employee" && inDept(p.id)); return pendingActiv.length > 0 ? (
          <Card className="p-3 border-amber-400/30">
            <div className="text-sm font-medium text-amber-300 flex items-center gap-1.5 mb-2"><UserPlus className="w-4 h-4" /> Aktiválásra vár ({pendingActiv.length})</div>
            <div className="space-y-2">{pendingActiv.map((p) => (
              <div key={p.id} className="flex items-center gap-2"><Avatar id={p.id} size="w-7 h-7" /><div className="text-sm min-w-0"><div className="text-slate-200 truncate">{p.name}</div><div className="text-xs text-slate-500">{p.role}</div></div><button onClick={() => genInviteCode(p.id)} className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-medium shrink-0">Aktiváló kód</button></div>))}</div>
          </Card>) : null; })()}
        <div className="grid grid-cols-2 gap-2.5">{[{ l: "Bent dolgozik", v: live.length, i: CircleDot, c: "text-emerald-400" }, { l: "Megjelölt bélyegzés", v: flagged.length, i: AlertTriangle, c: "text-rose-400" }, { l: "Cserekérés", v: pendingSwaps.length, i: Repeat, c: "text-amber-400" }, { l: "Aktív szankció", v: activeSanc.length, i: Gavel, c: "text-orange-400" }].map((s) => <Card key={s.l} className="p-3 flex items-center gap-3"><s.i className={`w-6 h-6 ${s.c}`} /><div><div className="text-xl font-bold text-white leading-none">{s.v}</div><div className="text-xs text-slate-400 mt-0.5">{s.l}</div></div></Card>)}</div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><CircleDot className="w-4 h-4 text-emerald-400" /> Jelenleg bent</div>
            {live.length > 0 && (confirmDeptClose
              ? <div className="flex items-center gap-1.5"><span className="text-xs text-slate-400">Mind lezárod?</span><button onClick={closeDept} className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600">Igen, lezár</button><button onClick={() => setConfirmDeptClose(false)} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700">Mégse</button></div>
              : <button onClick={() => setConfirmDeptClose(true)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700"><LogOut className="w-3.5 h-3.5" /> Részleg lezárása</button>)}
          </div>
          <div className="space-y-2">{live.length === 0 && <div className="text-xs text-slate-600">A részlegből jelenleg senki nincs becsekkolva.</div>}{live.map((e) => { const sh = shiftForEntry(e); const se = sh ? schedEnd(new Date(e.date), sh.start, sh.end) : null; const overdue = se != null && now > se + FORGOT_GRACE * 60000; return (
            <Card key={e.id} className={`p-3 ${overdue ? "border-orange-400/40" : ""}`}>
              <div className="flex items-center gap-3"><Avatar id={e.employeeId} /><div className="min-w-0"><div className="text-sm text-slate-200 truncate">{emp(e.employeeId).name}</div><div className="text-xs text-slate-500">{emp(e.employeeId).role} · be: {timeStr(e.checkIn)}{e.breakStart && " · szünet"}</div></div><div className="ml-auto text-sm font-semibold text-emerald-300 tabular-nums">{fmtClock(liveWorked(e))}</div></div>
              {overdue && <div className="text-xs text-orange-300 mt-2 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" /> Műszak vége {timeStr(se)} — lezáráskor munkaidő-nyilvántartás hamisítása ({ft(SANCTION_CATALOG.find((x) => x.id === "hamisitas").fine)}) rögzül.</div>}
              <button onClick={() => closeEntry(e.id)} className={`mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition ${overdue ? "bg-orange-500/15 text-orange-300 hover:bg-orange-500/25" : "bg-slate-700/60 text-slate-200 hover:bg-slate-700"}`}><LogOut className="w-3.5 h-3.5" /> Műszak lezárása</button>
            </Card>); })}</div>
        </div>
        <div><div className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-400" /> Jóváhagyandó bélyegzések</div><div className="space-y-2">{flagged.length === 0 && <div className="text-xs text-slate-600">Nincs jóváhagyandó tétel. 🎉</div>}{flagged.map((e) => <Card key={e.id} className="p-3 border-rose-500/30"><div className="flex items-center gap-2.5"><Avatar id={e.employeeId} size="w-8 h-8" /><div className="text-sm"><div className="text-slate-200">{emp(e.employeeId).name}</div><div className="text-xs text-slate-500">{dateLabel(e.checkIn)} · {timeStr(e.checkIn)}→{e.checkOut ? timeStr(e.checkOut) : "…"}</div></div></div><div className="text-xs text-amber-300 mt-2 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />{e.flagReason}</div><div className="flex gap-2 mt-2">{e.flagType === "ot" ? (<><button onClick={() => approveFlag(e.id, "ot")} className="text-xs flex-1 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">Túlórát beszámítom</button><button onClick={() => dismissFlag(e.id)} className="text-xs flex-1 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700">Elutasítom</button></>) : e.flagType === "early" ? (<><button onClick={() => approveFlag(e.id, "early")} className="text-xs flex-1 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">Korábbi kezdést beszámítom</button><button onClick={() => dismissFlag(e.id)} className="text-xs flex-1 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700">Elutasítom</button></>) : (<><button onClick={() => dismissFlag(e.id)} className="text-xs flex-1 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">Rendben</button><button onClick={() => flash("Egyeztetés szükséges.", "warn")} className="text-xs flex-1 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700">Egyeztetés</button></>)}</div></Card>)}</div></div>
      </div>
    );
  }

  function ScheduleManageTab() {
    const head = emp(DEPT_HEAD[viewDept]);
    const pendingOff = timeOff.filter((t) => inDept(t.employeeId) && t.status === "pending").sort((a, b) => a.date - b.date);
    const shownOffsets = planSpan === 2 ? [planOffset, planOffset + 1] : [planOffset];
    const weekEmpty = (off) => !shifts.some((s) => (s.weekOffset ?? 0) === off && empDept(s.employeeId) === viewDept);
    const weekCount = (off) => shifts.filter((s) => (s.weekOffset ?? 0) === off && empDept(s.employeeId) === viewDept).length;
    const maxStart = MAX_PLAN_OFFSET - (planSpan - 1);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-slate-200">{deptLabel(viewDept)} – beosztás</div><div className="text-xs text-slate-500">Készíti: {head?.name} · {head?.role}</div></div><button onClick={() => openShiftEditor(null)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600"><Plus className="w-4 h-4" /> Műszak</button></div>

        <Card className="p-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button disabled={planOffset <= 0} onClick={() => setPlanOffset((o) => Math.max(0, o - 1))} className="p-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"><ChevronLeft className="w-4 h-4" /></button>
            <div className="text-center min-w-0 flex-1"><div className="text-sm font-semibold text-slate-100 truncate">{weekTag(planOffset)}{planSpan === 2 && ` + ${weekTag(planOffset + 1)}`}</div><div className="text-[11px] text-slate-500 truncate">{weekRangeLabel(planOffset)}{planSpan === 2 && ` · ${weekRangeLabel(planOffset + 1)}`}</div></div>
            <button disabled={planOffset >= maxStart} onClick={() => setPlanOffset((o) => Math.min(maxStart, o + 1))} className="p-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-slate-900/60 rounded-lg p-0.5 text-xs">
              <button onClick={() => setPlanSpan(1)} className={`px-3 py-1.5 rounded-md transition ${planSpan === 1 ? "bg-amber-500 text-slate-900 font-medium" : "text-slate-400"}`}>1 hét</button>
              <button onClick={() => { setPlanSpan(2); setPlanOffset((o) => Math.min(o, MAX_PLAN_OFFSET - 1)); }} className={`px-3 py-1.5 rounded-md transition ${planSpan === 2 ? "bg-amber-500 text-slate-900 font-medium" : "text-slate-400"}`}>2 hét</button>
            </div>
            {planOffset > 0 && <button onClick={() => copyWeekInto(planOffset)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700"><Repeat className="w-3.5 h-3.5" /> Aktuális hét másolása</button>}
          </div>
        </Card>

        <Card className="p-2.5">
          <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5"><GripVertical className="w-3.5 h-3.5" /> Húzz egy idősávot a táblára — vagy fogd meg egy meglévő műszakot az áthelyezéshez.</div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">{blocks.length === 0 ? <span className="text-[11px] text-slate-600">Nincs idősáv — az adminban vehetsz fel.</span> : blocks.map((b) => <div key={b.id} onPointerDown={(ev) => startTemplateDrag(ev, b)} style={{ touchAction: "none" }} className="shrink-0 cursor-grab active:cursor-grabbing select-none flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-slate-700/60 text-slate-200 ring-1 ring-slate-600/50"><GripVertical className="w-3 h-3 text-slate-500" /> {b.start}–{b.end}</div>)}</div>
        </Card>

        {pendingOff.length > 0 && (<Card className="p-3 border-amber-400/30"><div className="text-sm font-medium text-amber-300 flex items-center gap-1.5 mb-2"><Bed className="w-4 h-4" /> Szabadnap-kérések ({pendingOff.length})</div><div className="space-y-2">{pendingOff.map((t) => <div key={t.id} className="flex items-center gap-2"><Avatar id={t.employeeId} size="w-7 h-7" /><div className="text-sm min-w-0"><div className="text-slate-200 truncate">{emp(t.employeeId).name}</div><div className="text-xs text-slate-500 capitalize">{fullDate(t.date)}{t.note && ` · ${t.note}`}</div></div><div className="ml-auto flex gap-1.5"><button onClick={() => decideTimeOff(t.id, true)} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"><Check className="w-4 h-4" /></button><button onClick={() => decideTimeOff(t.id, false)} className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700"><X className="w-4 h-4" /></button></div></div>)}</div></Card>)}

        <Card className="p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Bed className="w-4 h-4 text-amber-400" /> Szabadnap-keret</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">Napi keret · részlegenként</div>
            <div className="flex items-center gap-2"><button onClick={() => setOffDefaultCap((c) => Math.max(0, c - 1))} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700">−</button><span className="w-6 text-center font-bold text-white tabular-nums">{offDefaultCap}</span><button onClick={() => setOffDefaultCap((c) => c + 1)} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700">+</button></div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1.5">Kivételes / zárt napok</div>
            <div className="flex items-center gap-1.5">
              <input type="date" value={capDateInput} onChange={(e) => setCapDateInput(e.target.value)} className="flex-1 min-w-0 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-amber-400/50" />
              <select value={capValInput} onChange={(e) => setCapValInput(Number(e.target.value))} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-2 text-xs text-slate-200 outline-none focus:border-amber-400/50">{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n} className="bg-slate-800">{n === 0 ? "Zárt" : `${n} fő`}</option>)}</select>
              <button onClick={addCapOverride} disabled={!capDateInput} className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 text-xs font-semibold disabled:opacity-40">Beállít</button>
            </div>
            {Object.keys(offCaps).length > 0 && <div className="mt-2 space-y-1">{Object.entries(offCaps).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => <div key={k} className="flex items-center justify-between text-xs bg-slate-800/40 rounded-lg px-2.5 py-1.5"><span className="text-slate-300 capitalize">{fullDate(Number(k))}</span><span className="flex items-center gap-2"><span className={v === 0 ? "text-rose-300 font-medium" : "text-slate-300"}>{v === 0 ? "Zárt nap" : `${v} fő`}</span><button onClick={() => removeCapOverride(k)} className="text-slate-500 hover:text-rose-300"><X className="w-3.5 h-3.5" /></button></span></div>)}</div>}
          </div>
          <div className="text-[10px] text-slate-500">A keret naponta a részleg dolgozóira vonatkozik. „Zárt nap" = aznap senki nem kérhet szabadot (pl. Szilveszter).</div>
        </Card>

        <div className="text-[11px] text-slate-500">Koppints egy cellára a kézi felvételhez/szerkesztéshez, vagy használd a húzást.</div>

        {shownOffsets.map((off) => (
          <div key={off} className="space-y-1.5">
            <div className="flex items-center justify-between"><div className="text-xs font-medium text-slate-300">{weekTag(off)} <span className="text-slate-500 font-normal">· {weekRangeLabel(off)} · {weekCount(off)} műszak</span></div>{off > 0 && weekEmpty(off) && <button onClick={() => copyWeekInto(off)} className="text-[11px] text-amber-300 hover:text-amber-200">üres — másolás aktuálisból</button>}</div>
            <WeekGrid deptId={viewDept} editable={true} weekOffset={off} />
          </div>
        ))}
        <Legend />
      </div>
    );
  }

  function SwapsManageTab() {
    const pending = swaps.filter((w) => w.status === "pending" && inDept(w.fromEmployeeId));
    const open = swaps.filter((w) => w.status === "open" && w.shiftId && inDept(w.fromEmployeeId));
    const done = swaps.filter((w) => ["approved", "rejected"].includes(w.status) && inDept(w.fromEmployeeId));
    return (
      <div className="space-y-5">
        <div><div className="text-sm font-medium text-slate-300 mb-2">Jóváhagyásra vár · {deptLabel(viewDept)}</div><div className="space-y-2">{pending.length === 0 && <div className="text-xs text-slate-600">Nincs jóváhagyásra váró csere.</div>}{pending.map((w) => <Card key={w.id} className="p-3"><div className="text-sm text-slate-200">{shiftLabel(w.shiftId)}</div><div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">{emp(w.fromEmployeeId).name} <ChevronRight className="w-3 h-3" /> {emp(w.toEmployeeId).name}</div><div className="flex gap-2 mt-2.5"><button onClick={() => decideSwap(w.id, true)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600"><Check className="w-3.5 h-3.5" /> Jóváhagy</button><button onClick={() => decideSwap(w.id, false)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700"><X className="w-3.5 h-3.5" /> Elutasít</button></div></Card>)}</div></div>
        <div><div className="text-sm font-medium text-slate-300 mb-2">Nyitott felajánlások</div><div className="space-y-2">{open.length === 0 ? <div className="text-xs text-slate-600">Nincs nyitott felajánlás.</div> : open.map((w) => <Card key={w.id} className="p-3 flex items-center justify-between"><div className="text-sm"><div className="text-slate-200">{shiftLabel(w.shiftId)}</div><div className="text-xs text-slate-500">{emp(w.fromEmployeeId).name} · átvevőre vár</div></div><Badge tone="amber">Nyitott</Badge></Card>)}</div></div>
        {done.length > 0 && <div><div className="text-sm font-medium text-slate-300 mb-2">Korábbi döntések</div><div className="space-y-2">{done.map((w) => <Card key={w.id} className="p-3 flex items-center justify-between"><div className="text-sm text-slate-300">{shiftLabel(w.shiftId)}</div><Badge tone={w.status === "approved" ? "green" : "red"}>{w.status === "approved" ? "Jóváhagyva" : "Elutasítva"}</Badge></Card>)}</div></div>}
      </div>
    );
  }

  function HoursManageTab() {
    const rows = EMPLOYEES.filter((e) => e.dept === viewDept).map((e) => { const m = weekMinutes(e.id); return { e, m, pay: (m / 60) * e.rate }; });
    const totalPay = rows.reduce((s, r) => s + r.pay, 0);
    return (
      <div className="space-y-4">
        <Card className="p-4"><div className="text-xs text-slate-400">{deptLabel(viewDept)} – heti bérköltség (becsült)</div><div className="text-3xl font-bold text-amber-300">{ft(totalPay)}</div></Card>
        <div className="space-y-2">{rows.sort((a, b) => b.m - a.m).map(({ e, m, pay }) => <Card key={e.id} className="p-3 flex items-center gap-3"><Avatar id={e.id} /><div className="min-w-0"><div className="text-sm text-slate-200 truncate">{e.name}</div><div className="text-xs text-slate-500">{e.role}</div></div><div className="ml-auto text-right"><div className="text-sm font-semibold text-slate-100">{fmtDur(m * 60000)}</div><div className="text-xs text-amber-300/80">{ft(pay)}</div></div></Card>)}</div>
      </div>
    );
  }

  function SanctionsManageTab() {
    const deptEmps = EMPLOYEES.filter((e) => e.dept === viewDept);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setAssignEmp(null); setAssignType(null); setAssignNote(""); setAssignAmount(""); setAssignOpen(true); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"><Gavel className="w-4 h-4" /> Szankció</button>
          <button onClick={() => { setAssignEmp(null); setAssignType("figyelmeztetes"); setAssignNote(""); setAssignAmount(""); setAssignOpen(true); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/15 text-amber-200 font-semibold ring-1 ring-amber-400/40 hover:bg-amber-500/25"><ScrollText className="w-4 h-4" /> Figyelmeztetés</button>
        </div>
        <div className="space-y-2">{deptEmps.map((e) => { const total = activeFines(e.id); const st = standing(e.id); const list = sanctions.filter((s) => s.employeeId === e.id).sort((a, b) => b.date - a.date); const open = expandedEmp === e.id; return (<Card key={e.id} className="p-0 overflow-hidden"><button onClick={() => setExpandedEmp(open ? null : e.id)} className="w-full flex items-center gap-3 p-3"><Avatar id={e.id} /><div className="min-w-0 text-left"><div className="text-sm text-slate-200 truncate">{e.name}</div><div className="text-xs text-slate-500">{e.role}</div></div><div className="ml-auto flex items-center gap-2">{total > 0 && <span className="text-sm font-bold text-white tabular-nums">{ft(total)}</span>}<Badge tone={st.tone}>{st.label}</Badge><ChevronDown className={`w-4 h-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} /></div></button>{open && <div className="px-3 pb-3 space-y-2 border-t border-slate-700/60 pt-3">{list.length === 0 ? <div className="text-xs text-slate-600">Nincs szankció.</div> : list.map((s) => <SanctionRow key={s.id} s={s} manager />)}</div>}</Card>); })}</div>
      </div>
    );
  }

  /* ====== ADMIN ====== */
  function AdminTab() {
    const live = entries.filter((e) => e.checkOut == null);
    const totalCost = EMPLOYEES.reduce((s, e) => s + (weekMinutes(e.id) / 60) * e.rate, 0);
    const activeSanc = sanctions.filter((s) => s.status === "active");
    const flagged = entries.filter((e) => e.flagged);
    const pendingSwaps = swaps.filter((w) => w.status === "pending");
    const pendingOff = timeOff.filter((t) => t.status === "pending");
    return (
      <div className="space-y-4">
        <Card className="p-3 border-violet-400/30 flex items-center gap-2"><Crown className="w-4 h-4 text-violet-300" /><span className="text-xs text-violet-200">Cégszintű admin felület — csak a stratégiai és gazdasági vezető számára.</span></Card>
        <SubTabs items={[{ id: "overview", label: "Áttekintés", icon: LayoutDashboard, count: cPendingSwaps + cPendingOff + cFlagged }, { id: "daily", label: "Napi órák", icon: ClipboardList }, { id: "people", label: "Törzsadat", icon: Users }, { id: "roles", label: "Munkakörök", icon: Shield }, { id: "slots", label: "Idősávok", icon: Clock }]} value={adminSub} onChange={setAdminSub} />
        {adminSub === "overview" && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5">{[{ l: "Alkalmazott", v: EMPLOYEES.length, i: CircleDot, c: "text-sky-400" }, { l: "Most bent", v: live.length, i: Clock, c: "text-emerald-400" }, { l: "Aktív szankció", v: activeSanc.length, i: Gavel, c: "text-orange-400" }, { l: "Megjelölt", v: flagged.length, i: AlertTriangle, c: "text-rose-400" }].map((s) => <Card key={s.l} className="p-3 flex items-center gap-3"><s.i className={`w-6 h-6 ${s.c}`} /><div><div className="text-xl font-bold text-white leading-none">{s.v}</div><div className="text-xs text-slate-400 mt-0.5">{s.l}</div></div></Card>)}</div>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Banknote className="w-4 h-4 text-amber-300" /> Heti bérköltség — összesen</div><div className="text-3xl font-bold text-amber-300 mt-1">{ft(totalCost)}</div></Card>
        <div><div className="text-sm font-medium text-slate-300 mb-2">Részlegek</div><div className="space-y-2">{OPS_DEPTS.map((dep) => { const es = EMPLOYEES.filter((e) => e.dept === dep); const liveN = entries.filter((e) => e.checkOut == null && empDept(e.employeeId) === dep).length; const mins = es.reduce((s, e) => s + weekMinutes(e.id), 0); const cost = es.reduce((s, e) => s + (weekMinutes(e.id) / 60) * e.rate, 0); const Icon = DEPARTMENTS.find((d) => d.id === dep).icon; return (<Card key={dep} className="p-3"><div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-slate-300" /><span className="text-sm font-medium text-slate-200">{deptLabel(dep)}</span><span className="ml-auto text-xs text-slate-500">{es.length} fő · {liveN} bent</span></div><div className="flex items-center justify-between text-sm"><span className="text-slate-400 text-xs">Heti óra</span><span className="text-slate-200">{fmtDur(mins * 60000)}</span></div><div className="flex items-center justify-between text-sm mt-0.5"><span className="text-slate-400 text-xs">Heti bér</span><span className="text-amber-300">{ft(cost)}</span></div></Card>); })}</div></div>
        <div><div className="text-sm font-medium text-slate-300 mb-2">Függő ügyek</div><div className="grid grid-cols-3 gap-2.5">{[{ l: "Csere", v: pendingSwaps.length, i: Repeat }, { l: "Szabadnap", v: pendingOff.length, i: Bed }, { l: "Bélyegzés", v: flagged.length, i: AlertTriangle }].map((s) => <Card key={s.l} className="p-3 text-center"><s.i className="w-5 h-5 mx-auto mb-1 text-slate-400" /><div className="text-xl font-bold text-white">{s.v}</div><div className="text-[11px] text-slate-400">{s.l}</div></Card>)}</div></div>
        </div>}

        {adminSub === "daily" && DailyHoursSection()}

        {adminSub === "people" && (<div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-400" /> Törzsadat · alkalmazottak ({people.length})</div>
            <button onClick={() => openEmpEditor(null)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600"><UserPlus className="w-3.5 h-3.5" /> Új</button>
          </div>
          <div className="space-y-2">
            {ALL_DEPTS.map((dep) => { const rows = people.filter((p) => groupDept(p) === dep).sort((a, b) => a.name.localeCompare(b.name, "hu")); if (!rows.length) return null; const DIcon = DEPARTMENTS.find((d) => d.id === dep).icon; return (
              <div key={dep}>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 mt-1"><DIcon className="w-3.5 h-3.5" /> {deptLabel(dep)}</div>
                <div className="space-y-1.5">{rows.map((p) => (
                  <button key={p.id} onClick={() => openEmpEditor(p)} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left">
                    <Avatar id={p.id} size="w-8 h-8" />
                    <div className="min-w-0 flex-1"><div className="text-sm text-slate-200 truncate flex items-center gap-1.5">{p.name}{p.specialty && <SpecIcon id={p.specialty} className={`w-3.5 h-3.5 ${C[p.color]?.text}`} />}</div><div className="text-xs text-slate-500 truncate">{p.role}{p.specialty ? ` · ${SPECIALTIES[p.specialty].label}` : ""}</div></div>
                    <Badge tone={LEVEL_META[p.level].tone}>{LEVEL_META[p.level].label}</Badge>
                    <Pencil className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>))}</div>
              </div>); })}
          </div>
        </div>)}

        {adminSub === "roles" && (<div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><Shield className="w-4 h-4 text-amber-400" /> Munkakörök · jogosultságok ({roles.length})</div>
            <button onClick={() => openRoleEditor(null)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700"><Plus className="w-3.5 h-3.5" /> Munkakör</button>
          </div>
          <div className="text-[11px] text-slate-500 mb-2">A munkakörhöz rendelt jogosultság automatikusan érvényesül minden hozzá tartozó dolgozónál. Előléptetés = a dolgozó munkakörének átállítása.</div>
          <div className="space-y-1.5">{roles.map((r) => { const count = people.filter((p) => p.role === r.label).length; return (
            <button key={r.id} onClick={() => openRoleEditor(r)} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left">
              <div className="min-w-0 flex-1"><div className="text-sm text-slate-200 truncate">{r.label}</div><div className="text-xs text-slate-500">{count} fő</div></div>
              <Badge tone={LEVEL_META[r.level].tone}>{LEVEL_META[r.level].label}</Badge>
              <Pencil className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>); })}</div>
        </div>)}

        {adminSub === "slots" && (<div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> Idősávok · beosztás-paletta ({blocks.length})</div>
            <button onClick={addBlock} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700"><Plus className="w-3.5 h-3.5" /> Idősáv</button>
          </div>
          <div className="text-[11px] text-slate-500 mb-2">Ezek a sávok jelennek meg a beosztás-tervezőben húzható csempeként.</div>
          <div className="space-y-2">
            {blocks.length === 0 && <div className="text-xs text-slate-600">Nincs idősáv. Adj hozzá egyet a „+ Idősáv" gombbal.</div>}
            {blocks.map((b) => (
              <Card key={b.id} className="p-2.5 flex items-center gap-2">
                <input type="time" value={b.start} onChange={(e) => updateBlock(b.id, "start", e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-400/50" />
                <span className="text-slate-500">–</span>
                <input type="time" value={b.end} onChange={(e) => updateBlock(b.id, "end", e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-400/50" />
                <button onClick={() => removeBlock(b.id)} className="ml-auto p-2 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"><Trash2 className="w-4 h-4" /></button>
              </Card>))}
          </div>
        </div>)}
      </div>
    );
  }

  /* ====== Tabok ====== */
  // Napi óraösszesítő (gazdasági vezető / admin) — iktatható adatsor
  function DailyHoursSection() {
    const [yy, mm, dd] = dailyDate.split("-").map(Number);
    const k = dayKey(new Date(yy, mm - 1, dd).getTime());
    const dayEntries = entries.filter((e) => dayKey(e.date) === k);
    const byEmp = {};
    dayEntries.forEach((e) => {
      const a = byEmp[e.employeeId] || (byEmp[e.employeeId] = { employeeId: e.employeeId, inMs: e.checkIn, outMs: 0, paid: 0, brk: 0, open: false });
      a.inMs = Math.min(a.inMs, e.checkIn);
      if (e.checkOut == null) { a.open = true; a.outMs = Math.max(a.outMs, now); } else a.outMs = Math.max(a.outMs, e.checkOut);
      a.paid += paidMs(e); a.brk += (e.breakMs || 0) + (e.breakStart ? now - e.breakStart : 0);
    });
    const allRows = Object.values(byEmp).map((a) => ({ ...a, name: emp(a.employeeId).name, dept: empDept(a.employeeId) })).sort((x, y) => x.dept.localeCompare(y.dept) || x.name.localeCompare(y.name));
    const rows = dailyDept === "all" ? allRows : allRows.filter((r) => r.dept === dailyDept);
    const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
    const hoursDec = (ms) => (ms / 3600000).toFixed(2);
    const deptTxt = dailyDept === "all" ? "összes részleg" : deptLabel(dailyDept);
    const dLabel = new Date(k).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    const csv = [`Napi óraösszesítő;${dLabel};${deptTxt}`, "Név;Részleg;Kezdés;Vége;Szünet (perc);Nettó óra", ...rows.map((r) => `${r.name};${deptLabel(r.dept)};${timeStr(r.inMs)};${r.open ? "folyamatban" : timeStr(r.outMs)};${Math.round(r.brk / 60000)};${hoursDec(r.paid)}`), `Összesen;;;;;${hoursDec(totalPaid)}`].join("\n");
    const copyCsv = async () => { try { await navigator.clipboard.writeText(csv); flash("Adatsor a vágólapra másolva (CSV).", "ok"); } catch { setShowExport(true); flash("Másold ki kézzel a szövegmezőből.", "warn"); } };
    return (
      <div>
        <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-sky-400" /> Napi óraösszesítő</div></div>
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 mb-3 overflow-x-auto">{[["all", "Összes"], ...OPS_DEPTS.map((d) => [d, deptLabel(d)])].map(([id, lab]) => { const on = dailyDept === id; return <button key={id} onClick={() => setDailyDept(id)} className={`flex-1 min-w-fit text-xs py-1.5 px-3 rounded-lg whitespace-nowrap transition ${on ? "bg-slate-700 text-white font-medium" : "text-slate-400"}`}>{lab}</button>; })}</div>
        <div className="flex items-center gap-2 mb-3"><input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/50" /><button onClick={copyCsv} disabled={rows.length === 0} className="ml-auto flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 disabled:opacity-40"><ClipboardList className="w-3.5 h-3.5" /> Vágólapra</button></div>
        <div className="text-xs text-slate-400 capitalize mb-2">{dLabel} · {deptTxt}</div>
        {rows.length === 0 ? <Card className="p-4 text-center text-xs text-slate-500">Ezen a napon nincs rögzített munkaidő.</Card> : (
          <Card className="p-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-slate-500 text-left"><th className="py-1.5 pr-2 font-medium">Név</th><th className="px-2 font-medium">Kezdés</th><th className="px-2 font-medium">Vége</th><th className="pl-2 font-medium text-right">Nettó</th></tr></thead>
              <tbody>{rows.map((r) => (<tr key={r.employeeId} className="border-t border-slate-800"><td className="py-2 pr-2"><div className="text-slate-200">{r.name}</div><div className="text-[10px] text-slate-500">{deptLabel(r.dept)}</div></td><td className="px-2 tabular-nums text-slate-300">{timeStr(r.inMs)}</td><td className="px-2 tabular-nums">{r.open ? <span className="text-amber-300">folyamatban</span> : <span className="text-slate-300">{timeStr(r.outMs)}</span>}</td><td className="pl-2 text-right tabular-nums text-slate-100 font-medium">{fmtDur(r.paid)}</td></tr>))}</tbody>
              <tfoot><tr className="border-t border-slate-700"><td className="py-2 text-slate-400" colSpan={3}>Összesen · {rows.length} fő</td><td className="pl-2 text-right font-bold text-amber-300">{fmtDur(totalPaid)}</td></tr></tfoot>
            </table>
          </Card>)}
        <button onClick={() => setShowExport((v) => !v)} className="text-[11px] text-slate-400 hover:text-slate-200 mt-2">{showExport ? "Szöveges adatsor elrejtése" : "Szöveges adatsor (CSV) megnyitása másoláshoz"}</button>
        {showExport && <textarea readOnly value={csv} onFocus={(e) => e.target.select()} rows={Math.min(10, rows.length + 3)} className="w-full mt-1.5 bg-slate-950/60 border border-slate-700/60 rounded-lg p-2.5 text-[11px] text-slate-300 font-mono outline-none resize-none" />}
        <div className="text-[10px] text-slate-600 mt-2">A nettó óra a szüneteket már nem tartalmazza. A „Vágólapra" pontosvesszős CSV-t másol (Excelbe illeszthető); a szöveges adatsorban a szünet perc és a tizedes óraszám is szerepel.</div>
      </div>
    );
  }

  function updateDuty(idx, patch) { setDutyManagers((p) => p.map((d, i) => (i === idx ? { ...d, ...patch } : d))); }
  function genInviteCode(empId) { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); setActivationCodes((p) => ({ ...p, [empId]: code })); setInviteEmp(empId); }
  function activateMe() {
    const code = (activationCodes[meId] || "").toUpperCase();
    if (!code) { flash("Ehhez a fiókhoz még nem készült aktiváló kód — kérd a vezetődtől.", "warn"); return; }
    if (activateInput.trim().toUpperCase() !== code) { flash("Hibás kód. Ellenőrizd a vezetődnél.", "warn"); return; }
    setPeople((p) => p.map((x) => (x.id === meId ? { ...x, account: "active" } : x)));
    setActivationCodes((p) => { const n = { ...p }; delete n[meId]; return n; });
    setActivateInput(""); flash("Fiók aktiválva — üdv a fedélzeten! 🎉", "ok");
  }
  function addNewEmp() {
    const name = newName.trim(); if (!name) { flash("Adj meg egy nevet.", "warn"); return; }
    const id = Math.max(0, ...people.map((p) => p.id)) + 1;
    const dept = newDept || me.depts[0];
    setPeople((p) => [...p, { id, name, role: newRole.trim() || "Felszolgáló", dept, depts: [dept], rate: Number(newRate) || 2000, color: PALETTE[id % PALETTE.length], level: "employee", specialty: null, account: "pending" }]);
    flash(`${shortName(name)} felvéve — aktiválásra vár.`, "ok");
    setNewName(""); setNewRole(""); setNewRate(""); setNewDept(""); setOnboardOpen(false);
  }
  function deactivateEmp(id) { setPeople((p) => p.map((x) => (x.id === id ? { ...x, account: "disabled" } : x))); setActivationCodes((p) => { const n = { ...p }; delete n[id]; return n; }); flash(`${shortName(emp(id).name)} hozzáférése letiltva.`, "warn"); }
  function reactivateEmp(id) { setPeople((p) => p.map((x) => (x.id === id ? { ...x, account: "active" } : x))); flash(`${shortName(emp(id).name)} hozzáférése visszaállítva.`, "ok"); }
  function DisabledGate() {
    return (
      <div className="max-w-sm mx-auto pt-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-slate-800"><Lock className="w-8 h-8 text-slate-400" /></div>
        <div className="text-lg font-bold text-white">A fiók le van tiltva</div>
        <div className="text-sm text-slate-400">Ehhez a fiókhoz jelenleg nincs hozzáférés. Ha úgy gondolod, hogy ez tévedés, fordulj a vezetődhöz.</div>
      </div>
    );
  }
  function ActivationGate() {
    return (
      <div className="max-w-sm mx-auto pt-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: BRAND.soft }}><UserPlus className="w-8 h-8" style={{ color: BRAND.red }} /></div>
        <div>
          <div className="text-lg font-bold text-white">Üdv, {firstName(me.name)}!</div>
          <div className="text-sm text-slate-400 mt-1.5">A fiókod aktiválásra vár. Kérd a vezetődtől az aktiváló kódot, és írd be ide. (Éles rendszerben a vezető QR-jét olvasod be.)</div>
        </div>
        <div className="text-left">
          <div className="text-xs text-slate-400 mb-1.5">Aktiváló kód</div>
          <input value={activateInput} onChange={(e) => setActivateInput(e.target.value.toUpperCase())} maxLength={6} placeholder="pl. 7F3A2C" className="w-full text-center font-mono text-lg bg-slate-800/60 border border-slate-700/60 rounded-xl py-3 text-white placeholder:text-slate-600 outline-none focus:border-amber-400/50" style={{ letterSpacing: "0.3em" }} />
        </div>
        <button onClick={activateMe} className="w-full py-3.5 rounded-xl font-semibold text-white" style={{ background: BRAND.red }}>Aktiválás</button>
        <div className="text-[11px] text-slate-600">A kód egyszer használatos. Ha lejárt, kérj újat a vezetődtől. Aktiválás után a telefonodon bejelentkezve maradsz.</div>
      </div>
    );
  }
  function removeDuty(idx) { setDutyManagers((p) => p.filter((_, i) => i !== idx)); }
  function addDuty() { if (!addDutyId) return; const id = Number(addDutyId); setDutyManagers((p) => p.some((d) => d.id === id) ? p : [...p, { id, slot: "all" }]); setAddDutyId(""); }
  function DutyManagerCard({ editable }) {
    const eligible = people.filter((p) => (p.level === "manager" || p.level === "admin") && !dutyManagers.some((d) => d.id === p.id));
    const multi = dutyManagers.length > 1;
    return (
      <Card className="p-3.5">
        <div className="flex items-center gap-2 mb-2.5"><div className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-amber-300" /></div><div className="text-[11px] text-slate-400 uppercase tracking-wide">Mai felelős üzletvezető{multi ? "k" : ""}</div></div>
        <div className="space-y-1.5">
          {dutyManagers.length === 0 && <div className="text-xs text-slate-500">Nincs kijelölve.</div>}
          {dutyManagers.map((d, idx) => { const p = emp(d.id); return (
            <div key={idx} className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
              <Avatar id={d.id} size="w-7 h-7" />
              <div className="min-w-0 flex-1"><div className="text-sm text-slate-200 truncate">{p ? p.name : "—"}</div><div className="text-[10px] text-slate-500 truncate">{p?.role}</div></div>
              {editable
                ? <><select value={d.slot} onChange={(e) => updateDuty(idx, { slot: e.target.value })} className="bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400/50">{Object.entries(DUTY_SLOT).map(([k, v]) => <option key={k} value={k} className="bg-slate-800">{v}</option>)}</select><button onClick={() => removeDuty(idx)} className="text-slate-500 hover:text-rose-300 shrink-0"><X className="w-4 h-4" /></button></>
                : (d.slot !== "all" && <Badge tone="amber">{DUTY_SLOT[d.slot]}</Badge>)}
            </div>); })}
        </div>
        {editable && <div className="flex items-center gap-1.5 mt-2">
          <select value={addDutyId} onChange={(e) => setAddDutyId(e.target.value)} className="flex-1 min-w-0 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none focus:border-amber-400/50"><option value="">+ üzletvezető hozzáadása…</option>{eligible.map((m) => <option key={m.id} value={m.id} className="bg-slate-800">{m.name} – {m.role}</option>)}</select>
          <button onClick={addDuty} disabled={!addDutyId} className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 text-xs font-semibold disabled:opacity-40">Hozzáad</button>
        </div>}
      </Card>
    );
  }
  // Tulajdonosi műszerfal — csak olvasható
  function OwnerTab() {
    const today = new Date(now);
    const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
    const liveCount = entries.filter((e) => e.checkOut == null).length;
    const todayEntries = entries.filter((e) => sameDay(e.date, today));
    const todayCost = todayEntries.reduce((s, e) => s + (paidMs(e) / 3600000) * (emp(e.employeeId)?.rate || 0), 0);
    const todayHoursMs = todayEntries.reduce((s, e) => s + paidMs(e), 0);
    const weekCost = EMPLOYEES.reduce((s, e) => s + (weekMinutes(e.id) / 60) * e.rate, 0);
    const days = weekDatesFor(0);
    const dayData = days.map((d) => { const es = entries.filter((e) => sameDay(e.date, d)); const cost = es.reduce((s, e) => s + (paidMs(e) / 3600000) * (emp(e.employeeId)?.rate || 0), 0); return { d, cost, isToday: sameDay(d, today) }; });
    const maxCost = Math.max(1, ...dayData.map((x) => x.cost));
    const fmtFtShort = (n) => n >= 1000 ? `${Math.round(n / 1000)}e` : Math.round(n).toString();
    const selIsToday = ownerDay === todayIndex;
    const deptStaff = OPS_DEPTS.map((dep) => {
      const dayShifts = shifts.filter((s) => (s.weekOffset ?? 0) === 0 && s.dayIndex === ownerDay && empDept(s.employeeId) === dep);
      const ppl = [...new Set(dayShifts.map((s) => s.employeeId))];
      const headcount = EMPLOYEES.filter((e) => e.dept === dep).length;
      const liveIds = selIsToday ? entries.filter((e) => e.checkOut == null && empDept(e.employeeId) === dep).map((e) => e.employeeId) : [];
      const scheduled = ppl.length;
      const primary = selIsToday ? liveIds.length : scheduled;
      const pct = Math.min(100, Math.round((primary / Math.max(1, headcount)) * 100));
      return { dep, Icon: DEPARTMENTS.find((d) => d.id === dep).icon, ppl, dayShifts, headcount, liveIds, scheduled, primary, pct };
    });
    const totalPrimary = deptStaff.reduce((s, d) => s + d.primary, 0);
    const totalSched = deptStaff.reduce((s, d) => s + d.scheduled, 0);
    const dutyNames = dutyManagers.map((d) => shortName(emp(d.id)?.name || "")).filter(Boolean);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${BRAND.redDark}, #4a0a0a)`, boxShadow: `0 8px 28px ${BRAND.ring}` }}>
          <div className="flex items-center gap-2 text-amber-200/90 text-xs"><Crown className="w-4 h-4" /> Tulajdonosi áttekintés · csak olvasható</div>
          <div className="text-lg font-bold mt-1">{RESTAURANT.name}</div>
          <div className="text-xs text-white/70 capitalize">{today.toLocaleDateString("hu-HU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>

        {DutyManagerCard({ editable: false })}

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Users className="w-4 h-4 text-sky-400" /> Napi felállás</div><Badge tone="green">{selIsToday ? `${totalPrimary} fő bent` : `${totalSched} fő beosztva`}</Badge></div>
          <div className="grid grid-cols-7 gap-1 mb-4">{DAYS_SHORT.map((d, i) => { const on = i === ownerDay; const isToday = i === todayIndex; return <button key={i} onClick={() => setOwnerDay(i)} className={`py-1.5 rounded-lg text-xs font-medium transition ${on ? "bg-amber-500 text-slate-900" : isToday ? "bg-slate-700 text-amber-300" : "bg-slate-800 text-slate-400"}`}>{d}</button>; })}</div>

          <div className="relative">
            <div className="flex justify-center"><div className="rounded-xl px-3 py-2 text-center" style={{ maxWidth: 260, background: BRAND.soft, boxShadow: `inset 0 0 0 1px ${BRAND.ring}` }}><div className="text-xs font-bold text-white">{RESTAURANT.name}</div><div className="text-[10px] text-slate-300">{DAYS_FULL[ownerDay]}{selIsToday ? " · ma" : ""}</div>{selIsToday && dutyNames.length > 0 && <div className="text-[10px] text-amber-200/90 mt-0.5">Felelős: {dutyNames.join(", ")}</div>}</div></div>
            <div className="bg-slate-700 mx-auto" style={{ width: 1, height: 16 }} />
            <div className="relative" style={{ height: 16 }}>
              <div className="absolute border-t border-slate-700" style={{ top: 0, left: "16.66%", right: "16.66%" }} />
              <div className="absolute bg-slate-700" style={{ top: 0, left: "16.66%", width: 1, height: 16 }} />
              <div className="absolute bg-slate-700" style={{ top: 0, left: "50%", width: 1, height: 16 }} />
              <div className="absolute bg-slate-700" style={{ top: 0, left: "83.33%", width: 1, height: 16 }} />
            </div>
            <div className="grid grid-cols-3 gap-2">{deptStaff.map((d) => { const barCol = d.pct < 40 ? "#38bdf8" : d.pct < 75 ? "#34d399" : "#f59e0b"; return (
              <div key={d.dep} className="flex flex-col items-center">
                <div className="w-full rounded-xl bg-slate-800/70 ring-1 ring-slate-700 p-2 text-center">
                  <d.Icon className="w-4 h-4 mx-auto text-slate-300" />
                  <div className="text-xl font-bold text-white tabular-nums leading-tight mt-0.5">{d.primary}</div>
                  <div className="text-[9px] text-slate-400 leading-tight">{deptLabel(d.dep)}</div>
                  <div className="text-[9px] text-slate-500">{selIsToday ? `${d.scheduled} beosztva` : `${d.headcount} fő`}</div>
                  <div className="mt-1 rounded-full bg-slate-700 overflow-hidden" style={{ height: 6 }}><div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: barCol }} /></div>
                  <div className="text-[8px] text-slate-500 mt-0.5">{d.pct}% kihasználtság</div>
                </div>
                <div className="w-full mt-1.5 space-y-1">{d.ppl.length === 0 ? <div className="text-[9px] text-slate-600 text-center py-1">pihenőnap</div> : d.ppl.map((pid) => { const inNow = d.liveIds.includes(pid); const sh = d.dayShifts.find((s) => s.employeeId === pid); return (
                  <div key={pid} className={`flex items-center gap-1 rounded-lg px-1 py-1 ${inNow ? "bg-emerald-500/10 ring-1 ring-emerald-400/25" : "bg-slate-800/50"}`}><Avatar id={pid} size="w-5 h-5" /><div className="min-w-0 leading-tight flex-1"><div className="text-[9px] text-slate-200 truncate">{firstName(emp(pid).name)}</div>{sh && <div className="text-[8px] text-slate-500 tabular-nums">{sh.start}–{sh.end}</div>}</div>{inNow && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}</div>); })}</div>
              </div>); })}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500 mt-3 justify-center">{selIsToday && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> most bent van</span>}<span>a sáv a kihasználtság: dolgozó / teljes létszám</span></div>
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-3.5"><div className="flex items-center gap-2 text-xs text-slate-400"><Banknote className="w-4 h-4 text-amber-300" /> Mai bérköltség</div><div className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{ft(todayCost)}</div></Card>
          <Card className="p-3.5"><div className="flex items-center gap-2 text-xs text-slate-400"><Clock className="w-4 h-4 text-sky-400" /> Mai ledolgozott óra</div><div className="text-2xl font-bold text-white mt-1 tabular-nums">{fmtDur(todayHoursMs)}</div></Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-sm font-medium text-slate-200"><BarChart3 className="w-4 h-4 text-sky-400" /> Heti bérköltség</div><div className="text-sm font-bold text-amber-300">{ft(weekCost)}</div></div>
          <div className="flex items-end justify-between gap-1.5 h-32">{dayData.map((x, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(4, (x.cost / maxCost) * 100)}%`, background: x.isToday ? BRAND.red : "rgba(148,163,184,0.35)" }} title={ft(x.cost)} />
              </div>
              <div className={`text-[10px] ${x.isToday ? "text-white font-semibold" : "text-slate-500"}`}>{DAYS_SHORT[i]}</div>
              <div className={`text-[9px] tabular-nums ${x.isToday ? "text-amber-300" : "text-slate-600"}`}>{x.cost > 0 ? fmtFtShort(x.cost) : "–"}</div>
            </div>))}</div>
          <div className="text-[10px] text-slate-600 mt-2 text-center">Tényleges (ledolgozott idő alapú) bérköltség napi bontásban · az aktuális hét</div>
        </Card>
      </div>
    );
  }

  // Figyelmeztető számlálók (teendők) — szerepfüggő
  const annForMe = announcements.filter((a) => annVisible(a, me));
  const unreadAnn = annForMe.filter((a) => !seenAnn.includes(a.id)).length;
  const cPendingSwaps = swaps.filter((w) => w.status === "pending" && inDept(w.fromEmployeeId)).length;
  const cPendingOff = timeOff.filter((t) => t.status === "pending" && inDept(t.employeeId)).length;
  const cFlagged = entries.filter((e) => e.flagged && inDept(e.employeeId)).length;
  const cOpenSwapsForMe = swaps.filter((w) => w.status === "open" && w.shiftId && w.fromEmployeeId !== userId && emp(w.fromEmployeeId)?.dept === me.dept).length;
  const cMyActiveSanctions = sanctions.filter((s) => s.status === "active" && s.employeeId === userId).length;
  function tabCount(id) {
    switch (id) {
      case "central": return unreadAnn;
      case "work": return cMyActiveSanctions;
      case "swaps": return myLevel === "employee" ? cOpenSwapsForMe : cPendingSwaps;
      case "overview": return cFlagged;
      case "schedule": return myLevel === "employee" ? 0 : cPendingOff;
      case "team": return cPendingSwaps;
      case "admin": return cPendingSwaps + cPendingOff + cFlagged;
      default: return 0;
    }
  }

  // Vezetői beléptetés-panel: új dolgozó felvétele + fiók-állapotok kezelése
  function OnboardingPanel() {
    const list = people.filter((p) => p.level === "employee" && inDept(p.id)).sort((a, b) => (a.account === "pending" ? -1 : 0) - (b.account === "pending" ? -1 : 0) || a.name.localeCompare(b.name));
    const sm = { pending: { label: "Aktiválásra vár", tone: "amber" }, active: { label: "Aktív", tone: "green" }, disabled: { label: "Letiltva", tone: "slate" } };
    const inp = "w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-400/50";
    return (
      <div className="space-y-3">
        {!onboardOpen ? (
          <button onClick={() => { setNewDept(me.depts[0]); setOnboardOpen(true); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:border-slate-500 text-sm"><Plus className="w-4 h-4" /> Új dolgozó felvétele</button>
        ) : (
          <Card className="p-3.5 space-y-2.5">
            <div className="text-sm font-medium text-slate-200">Új dolgozó</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Teljes név" className={inp} />
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Munkakör (pl. Felszolgáló)" className={inp} />
            <div className="flex gap-2">
              <select value={newDept} onChange={(e) => setNewDept(e.target.value)} className={inp}>{me.depts.map((d) => <option key={d} value={d} className="bg-slate-800">{deptLabel(d)}</option>)}</select>
              <input type="number" inputMode="numeric" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="Órabér (Ft)" className={inp} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addNewEmp} className="flex-1 py-2.5 rounded-lg text-white font-medium" style={{ background: BRAND.red }}>Felvesz</button>
              <button onClick={() => { setOnboardOpen(false); setNewName(""); setNewRole(""); setNewRate(""); }} className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300">Mégse</button>
            </div>
            <div className="text-[11px] text-slate-500">Felvétel után a fiók „aktiválásra vár" lesz — add ki neki az aktiváló kódot a listából.</div>
          </Card>
        )}
        <div className="space-y-2">
          {list.map((p) => { const s = sm[p.account] || sm.active; return (
            <Card key={p.id} className="p-3 flex items-center gap-2.5">
              <Avatar id={p.id} size="w-8 h-8" />
              <div className="min-w-0 flex-1"><div className="text-sm text-slate-200 truncate">{p.name}</div><div className="text-[11px] text-slate-500 truncate">{p.role} · {deptLabel(p.dept)}</div></div>
              <Badge tone={s.tone}>{s.label}</Badge>
              {p.account === "pending" && <button onClick={() => genInviteCode(p.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-medium shrink-0">Kód</button>}
              {p.account === "active" && <button onClick={() => deactivateEmp(p.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-rose-300 hover:bg-slate-700 shrink-0">Letiltás</button>}
              {p.account === "disabled" && <button onClick={() => reactivateEmp(p.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-emerald-300 hover:bg-slate-700 shrink-0">Visszaállítás</button>}
            </Card>); })}
        </div>
      </div>
    );
  }

  // Vezetői "Csapat" fül: órák, szankciók és cserék egy helyen
  function ManagerTeamTab() {
    const pendingCount = people.filter((p) => p.account === "pending" && p.level === "employee" && inDept(p.id)).length;
    const items = [
      { id: "hours", label: "Órák", icon: BarChart3 },
      { id: "sanctions", label: "Szankciók", icon: Gavel },
      { id: "swaps", label: "Cserék", icon: Repeat, count: cPendingSwaps },
      { id: "onboard", label: "Beléptetés", icon: UserPlus, count: pendingCount },
    ];
    return (
      <div>
        <SubTabs items={items} value={mgrTeamSub} onChange={setMgrTeamSub} />
        {mgrTeamSub === "hours" ? <HoursManageTab /> : mgrTeamSub === "sanctions" ? <SanctionsManageTab /> : mgrTeamSub === "swaps" ? <SwapsManageTab /> : OnboardingPanel()}
      </div>
    );
  }
  const empTabs = [
    { id: "central", label: "Központ", icon: Home, view: CentralTab },
    { id: "clock", label: "Bélyegzés", icon: Clock, view: ClockTab },
    { id: "work", label: "Beosztás", icon: CalendarDays, view: EmployeeWorkTab },
    { id: "swaps", label: "Cserék", icon: Repeat, view: SwapsTab },
  ];
  const mgrTabs = [
    { id: "central", label: "Központ", icon: Home, view: CentralTab },
    { id: "overview", label: "Áttekintés", icon: LayoutDashboard, view: OverviewTab },
    { id: "schedule", label: "Beosztás", icon: CalendarDays, view: ScheduleManageTab },
    { id: "team", label: "Csapat", icon: Users, view: ManagerTeamTab },
  ];
  const adminTabs = [
    { id: "central", label: "Központ", icon: Home, view: CentralTab },
    { id: "admin", label: "Admin", icon: Crown, view: AdminTab },
    { id: "schedule", label: "Beosztás", icon: CalendarDays, view: ScheduleManageTab },
    { id: "hours", label: "Órák", icon: BarChart3, view: HoursManageTab },
    { id: "sanctions", label: "Szankció", icon: Gavel, view: SanctionsManageTab },
    { id: "swaps", label: "Cserék", icon: Repeat, view: SwapsManageTab },
  ];
  const ownerTabs = [
    { id: "owner", label: "Áttekintés", icon: LayoutDashboard, view: OwnerTab },
  ];
  const tabs = myLevel === "employee" ? empTabs : myLevel === "manager" ? mgrTabs : myLevel === "owner" ? ownerTabs : adminTabs;
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  const noticeStyle = { ok: "bg-emerald-500/90", warn: "bg-rose-500/90", info: "bg-slate-700/95" };
  const editEmps = shiftEdit ? EMPLOYEES.filter((e) => e.dept === viewDept) : [];
  const assignEmps = EMPLOYEES.filter((e) => e.dept === viewDept);
  const showDeptPills = (myLevel === "manager" || myLevel === "admin") && myDepts.length > 1;
  const annRoles = [...new Set(EMPLOYEES.filter((e) => e.dept === viewDept).map((e) => e.role))];

  /* naptár a szabadnaphoz */
  const cm = new Date(calMonth);
  const calY = cm.getFullYear(), calMo = cm.getMonth();
  const firstOffset = (new Date(calY, calMo, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calY, calMo + 1, 0).getDate();
  const canPrev = calMonth > CUR_MONTH, canNext = calMonth < MAX_MONTH;
  const gotoMonth = (delta) => { const d = new Date(calY, calMo + delta, 1); setCalMonth(dayKey(d)); };

  if (!loaded) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-sans text-sm">Betöltés…</div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-start justify-center p-0 sm:p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-800 overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:h-[860px] relative">

        <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${BRAND.red}, ${BRAND.redDark})` }} />
        <div className="px-4 pt-3.5 pb-3 bg-slate-900 border-b border-slate-800/80" style={{ backgroundImage: `radial-gradient(120% 90% at 0% 0%, ${BRAND.soft}, transparent 55%)` }}>
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2.5"><button onClick={goBack} aria-label="Vissza" className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${canGoBack ? "bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95" : "bg-slate-800/40 text-slate-600"}`}><ChevronLeft className="w-5 h-5" /></button><div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-extrabold shrink-0" style={{ background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.redDark})`, boxShadow: `0 4px 16px ${BRAND.ring}` }}>P</div><div className="min-w-0"><div className="text-[15px] font-bold text-white leading-tight tracking-tight truncate">{BRAND.name}</div><div className="text-[11px] text-slate-500 leading-tight truncate">{RESTAURANT.name} · operatív központ</div></div></div><Badge tone={LEVEL_META[myLevel].tone}>{LEVEL_META[myLevel].label}</Badge></div>
          <div className="flex items-center gap-2 mb-1"><span className="text-xs text-slate-500 shrink-0">Belépve:</span>
            <select value={meId} onChange={(e) => setMeId(Number(e.target.value))} className="flex-1 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none">
              <optgroup label="Alkalmazottak">{EMPLOYEES.map((e) => <option key={e.id} value={e.id}>{e.name} – {e.role}</option>)}</optgroup>
              <optgroup label="Részlegvezetők">{MANAGEMENT.filter((m) => m.level === "manager").map((m) => <option key={m.id} value={m.id}>{m.name} – {m.role}</option>)}</optgroup>
              {ADMIN_IN_APP && <optgroup label="Admin">{MANAGEMENT.filter((m) => m.level === "admin").map((m) => <option key={m.id} value={m.id}>{m.name} – {m.role}</option>)}</optgroup>}
              <optgroup label="Tulajdonos">{MANAGEMENT.filter((m) => m.level === "owner").map((m) => <option key={m.id} value={m.id}>{m.name} – {m.role}</option>)}</optgroup>
            </select>
          </div>
          {showDeptPills ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 pt-1"><span className="text-xs text-slate-500 shrink-0">Részleg:</span>{myDepts.map((d) => <DeptPill key={d} id={d} active={viewDept === d} onClick={() => { setViewDept(d); setExpandedEmp(null); setConfirmDeptClose(false); }} />)}</div>
          ) : (
            <div className="text-xs text-slate-500 pt-0.5">{myLevel === "employee" ? `${me.role} · ${deptLabel(me.dept)}` : myLevel === "owner" ? `${me.role} · teljes cég` : `Részleg: ${deptLabel(viewDept)}`}</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">{me.account === "pending" ? ActivationGate() : me.account === "disabled" ? DisabledGate() : active.view()}</div>

        {notice && <div className={`absolute left-1/2 -translate-x-1/2 bottom-24 ${noticeStyle[notice.tone]} text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-[92%] text-center backdrop-blur`}>{notice.msg}</div>}

        {dragUI && <div className="fixed z-[60] pointer-events-none px-2.5 py-1 rounded-lg bg-amber-500 text-slate-900 text-[11px] font-bold shadow-xl" style={{ left: dragUI.x + 14, top: dragUI.y + 14 }}>{dragUI.label}</div>}
        {dragUI?.del && <div data-cell="trash" className={`fixed left-1/2 -translate-x-1/2 bottom-28 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition ${dragUI.overKey === "trash" ? "bg-rose-500 text-white scale-105" : "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40"}`}><Trash2 className="w-4 h-4" /> Húzd ide a törléshez</div>}

        {tabs.length > 1 && me.account !== "pending" && me.account !== "disabled" && <div className="absolute bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-0.5 py-2 grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>{tabs.map((t) => { const on = tab === t.id; const n = tabCount(t.id); return <button key={t.id} onClick={() => { if (t.id === "central") markAnnSeen(); setTab(t.id); }} className="relative flex flex-col items-center gap-1 py-1.5 rounded-lg transition" style={on ? { color: BRAND.red } : undefined}>{on && <span className="absolute -top-2 h-0.5 w-7 rounded-full" style={{ background: BRAND.red }} />}<div className="relative"><t.icon className={`w-5 h-5 ${on ? "" : "text-slate-500"}`} />{n > 0 && !on && <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-slate-900">{n > 9 ? "9+" : n}</span>}</div><span className={`text-[9px] font-medium ${on ? "" : "text-slate-500"}`}>{t.label}</span></button>; })}</div>}

        {/* QR scanner */}
        {scan && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur flex flex-col items-center justify-center p-6">
            <div className="text-center mb-6"><div className="text-white font-semibold text-lg">{scan.action === "in" ? "Becsekkolás" : "Kicsekkolás"}</div><div className="text-slate-400 text-sm">Olvasd be az étterem QR-kódját</div></div>
            <div className="relative w-56 h-56 rounded-2xl border-2 border-amber-400/40 overflow-hidden bg-slate-900 flex items-center justify-center"><QrCode className="w-28 h-28 text-slate-700" /><div className={`absolute inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.6)] ${scanning ? "animate-bounce" : ""}`} style={{ top: scanning ? "50%" : "10%", transition: "top .3s" }} />{[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"], ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, b], i) => <span key={i} className={`absolute ${pos} w-6 h-6 ${b} border-amber-400 rounded-sm`} />)}</div>
            <div className="text-xs text-slate-500 mt-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Helyszín igazolva ({distance != null ? Math.round(distance) + " m" : "?"})</div>
            <button onClick={confirmScan} disabled={scanning} className="mt-6 w-full max-w-xs flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 disabled:opacity-60"><Scan className="w-5 h-5" /> {scanning ? "Beolvasás…" : "QR beolvasása"}</button>
            <button onClick={() => setScan(null)} className="mt-3 text-sm text-slate-400 hover:text-slate-200">Mégse</button>
          </div>
        )}

        {/* Aktiváló kód (vezető mutatja a dolgozónak) */}
        {inviteEmp && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5 text-amber-300" /> Aktiváló kód</div><button onClick={() => setInviteEmp(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-2 mt-1"><Avatar id={inviteEmp} size="w-9 h-9" /><div className="text-left"><div className="text-sm text-slate-200">{emp(inviteEmp).name}</div><div className="text-xs text-slate-500">{emp(inviteEmp).role} · {deptLabel(emp(inviteEmp).dept)}</div></div></div>
              <div className="text-sm text-slate-400 max-w-xs">Mutasd meg ezt a dolgozónak — ő a saját telefonján a „Csatlakozom" képernyőn írja be a kódot (éles rendszerben a QR-t olvassa be).</div>
              <div className="w-44 h-44 rounded-2xl bg-white flex items-center justify-center"><QrCode className="w-28 h-28 text-slate-900" /></div>
              <div className="text-[10px] text-slate-500 -mt-2">Éles rendszerben itt a beolvasható QR jelenik meg</div>
              <div><div className="text-xs text-slate-400 mb-1">Aktiváló kód</div><div className="text-3xl font-bold text-white font-mono" style={{ letterSpacing: "0.3em" }}>{activationCodes[inviteEmp]}</div></div>
              <button onClick={() => genInviteCode(inviteEmp)} className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700">Új kód generálása</button>
              <div className="text-[11px] text-slate-600 max-w-xs">A kód egyszer használatos. Amint a dolgozó beírja, a fiókja aktívvá válik és azonnal beléphet.</div>
            </div>
          </div>
        )}

        {/* Szankció kiszabása */}
        {assignOpen && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><Gavel className="w-5 h-5 text-orange-400" /> Szankció · {deptLabel(viewDept)}</div><button onClick={() => setAssignOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div><div className="text-xs text-slate-400 mb-2">1. Alkalmazott</div><div className="flex flex-wrap gap-2">{assignEmps.map((e) => <button key={e.id} onClick={() => setAssignEmp(e.id)} className={`text-sm px-3 py-1.5 rounded-full transition ${assignEmp === e.id ? `${C[e.color].soft} ${C[e.color].text} ring-1 ${C[e.color].border}` : "text-slate-300 bg-slate-800"}`}>{e.name}</button>)}</div></div>
              <div><div className="text-xs text-slate-400 mb-2">2. Típus</div>
                {[{ k: "warning", lab: "Írásbeli figyelmeztetés", col: "text-amber-300", f: (t) => t.warning }, { k: "general", lab: "Általános szabálysértések", col: "text-amber-300", f: (t) => t.cat === "general" && !t.warning }, { k: "serious", lab: "Súlyosabb szabálysértések", col: "text-rose-300", f: (t) => t.cat === "serious" }].map((g) => { const list = SANCTION_CATALOG.filter(g.f); if (!list.length) return null; return (
                  <div key={g.k} className="mb-2.5">
                    <div className={`text-[11px] font-medium mb-1.5 ${g.col}`}>{g.lab}</div>
                    <div className="space-y-2">{list.map((t) => { const sel = assignType === t.id; return (
                      <button key={t.id} onClick={() => { setAssignType(t.id); setAssignAmount(""); }} className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border transition text-left ${sel ? "bg-orange-500/10 border-orange-400/50" : "bg-slate-800/60 border-slate-700/60"}`}><span className="text-sm text-slate-200 min-w-0">{t.label}</span><span className="text-sm font-bold text-slate-300 shrink-0 text-right">{t.warning ? "—" : t.fine > 0 ? ft(t.fine) : (t.variable ? VAR_LABEL[t.variable] : "—")}{t.variable && t.fine > 0 ? " +" : ""}</span></button>); })}</div>
                  </div>); })}
              </div>
              {assignType && (() => { const t = SANCTION_CATALOG.find((x) => x.id === assignType); return (<>
                {t.variable && <div><div className="text-xs text-slate-400 mb-2">{VAR_LABEL[t.variable]} (Ft)</div><input type="number" value={assignAmount} onChange={(e) => setAssignAmount(e.target.value)} placeholder="Összeg" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-orange-400/50" /></div>}
                {(t.consequences?.length > 0 || t.note) && <div className="text-xs px-3 py-2.5 rounded-xl bg-slate-800/60 ring-1 ring-slate-700/60 space-y-1.5">{t.consequences?.length > 0 && <div className="flex flex-wrap gap-1.5">{t.consequences.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300">{CONSEQ[c]}</span>)}</div>}{t.note && <div className="text-slate-500">{t.note}</div>}</div>}
              </>); })()}
              <div><div className="text-xs text-slate-400 mb-2">{assignType === "figyelmeztetes" ? "3. A figyelmeztetés szövege / indoklás" : "3. Megjegyzés (opcionális)"}</div><textarea value={assignNote} onChange={(e) => setAssignNote(e.target.value)} rows={3} placeholder={assignType === "figyelmeztetes" ? "Pl. mire vonatkozik a figyelmeztetés, korábbi előzmények…" : "Pl. dátum, körülmények…"} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-orange-400/50 resize-none" /></div>
            </div>
            <div className="p-4 border-t border-slate-800"><button onClick={assignSanction} disabled={!assignEmp || !assignType} className={`w-full py-3.5 rounded-xl font-semibold transition ${assignEmp && assignType ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-slate-700/50 text-slate-500 cursor-not-allowed"}`}>{assignType === "figyelmeztetes" ? "Írásbeli figyelmeztetés rögzítése" : "Szankció rögzítése"}</button></div>
          </div>
        )}

        {/* Műszak szerkesztő */}
        {shiftEdit && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><CalendarDays className="w-5 h-5 text-orange-400" /> {shiftEdit.id ? "Műszak szerkesztése" : "Új műszak"} · {deptLabel(viewDept)}</div><button onClick={() => setShiftEdit(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-orange-500/10 text-orange-200 ring-1 ring-orange-400/20"><CalendarDays className="w-3.5 h-3.5 shrink-0" /> {weekTag(shiftEdit.weekOffset ?? 0)} · {weekRangeLabel(shiftEdit.weekOffset ?? 0)}</div>
              <div><div className="text-xs text-slate-400 mb-2">Nap</div><div className="flex flex-wrap gap-2">{DAYS_SHORT.map((d, i) => <button key={i} onClick={() => setShiftEdit((s) => ({ ...s, dayIndex: i }))} className={`text-sm w-11 py-1.5 rounded-lg transition ${shiftEdit.dayIndex === i ? "bg-orange-500 text-white font-medium" : "text-slate-300 bg-slate-800"}`}>{d}</button>)}</div></div>
              <div><div className="text-xs text-slate-400 mb-2">Dolgozó</div><div className="flex flex-wrap gap-2">{editEmps.map((e) => <button key={e.id} onClick={() => setShiftEdit((s) => ({ ...s, employeeId: e.id }))} className={`text-sm px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${shiftEdit.employeeId === e.id ? `${C[e.color].soft} ${C[e.color].text} ring-1 ${C[e.color].border}` : "text-slate-300 bg-slate-800"}`}>{e.specialty && <SpecIcon id={e.specialty} className="w-3.5 h-3.5" />}{e.name}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-slate-400 mb-2">Kezdés</div><input type="time" value={shiftEdit.start} onChange={(e) => setShiftEdit((s) => ({ ...s, start: e.target.value }))} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-orange-400/50" /></div><div><div className="text-xs text-slate-400 mb-2">Vége</div><input type="time" value={shiftEdit.end} onChange={(e) => setShiftEdit((s) => ({ ...s, end: e.target.value }))} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-orange-400/50" /></div></div>
              {VENUE_DEPTS.includes(emp(shiftEdit.employeeId)?.dept) && (
                <div><div className="text-xs text-slate-400 mb-2">Egység</div><div className="grid grid-cols-2 gap-2">{UNITS.map((u) => { const UI = u.icon; const on = (shiftEdit.unit ?? "pastamore") === u.id; return <button key={u.id} onClick={() => setShiftEdit((s) => ({ ...s, unit: u.id }))} className={`flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border transition ${on ? "bg-orange-500/15 border-orange-400/50 text-orange-200" : "bg-slate-800/60 border-slate-700/60 text-slate-300"}`}><UI className="w-3.5 h-3.5" /> {u.label}</button>; })}</div></div>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex gap-2">{shiftEdit.id && <button onClick={() => deleteShift(shiftEdit.id)} className="px-4 py-3.5 rounded-xl bg-rose-500/15 text-rose-300 font-medium hover:bg-rose-500/25">Törlés</button>}<button onClick={saveShift} className="flex-1 py-3.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">{shiftEdit.id ? "Mentés" : "Hozzáadás"}</button></div>
          </div>
        )}

        {/* Alkalmazott szerkesztése (admin törzsadat) */}
        {empEdit && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-sky-400" /> {empEdit.id == null ? "Új alkalmazott" : "Alkalmazott adatai"}</div><button onClick={() => setEmpEdit(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div><div className="text-xs text-slate-400 mb-2">Név</div><input value={empEdit.name} onChange={(e) => setEmpEdit((s) => ({ ...s, name: e.target.value }))} placeholder="Teljes név" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-sky-400/50" /></div>

              <div><div className="text-xs text-slate-400 mb-2">Munkakör</div>
                <div className="flex flex-wrap gap-1.5">{roles.map((r) => <button key={r.id} onClick={() => setEmpEdit((s) => ({ ...s, role: r.label, level: r.level, dept: r.dept, depts: r.level === "employee" ? [r.dept] : ((s.depts || []).filter((d) => OPS_DEPTS.includes(d)).length ? s.depts.filter((d) => OPS_DEPTS.includes(d)) : (OPS_DEPTS.includes(r.dept) ? [r.dept] : OPS_DEPTS.slice())) }))} className={`text-[11px] px-2.5 py-1.5 rounded-full transition ${empEdit.role === r.label ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40" : "bg-slate-800 text-slate-400"}`}>{r.label}</button>)}</div>
              </div>

              <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg bg-slate-800/60 ring-1 ring-slate-700/60"><Shield className="w-4 h-4 text-amber-400 shrink-0" /> Jogosultság: <Badge tone={LEVEL_META[empEdit.level].tone}>{LEVEL_META[empEdit.level].label}</Badge> <span className="text-slate-500">· egység: {deptLabel(empEdit.dept)} — a munkakörből</span></div>

              {empEdit.level !== "employee" && (
                <div><div className="text-xs text-slate-400 mb-2">Felügyelt részlegek</div><div className="flex gap-2">{OPS_DEPTS.map((d) => { const on = empEdit.depts?.includes(d); const DIcon = DEPARTMENTS.find((x) => x.id === d).icon; return <button key={d} onClick={() => setEmpEdit((s) => { const set = new Set(s.depts ?? []); set.has(d) ? set.delete(d) : set.add(d); return { ...s, depts: OPS_DEPTS.filter((x) => set.has(x)) }; })} className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition ${on ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40" : "bg-slate-800 text-slate-400"}`}><DIcon className="w-3.5 h-3.5" /> {deptLabel(d)}</button>; })}</div></div>
              )}

              {empEdit.level === "employee" && (
                <div><div className="text-xs text-slate-400 mb-2">Specializáció (piktogram)</div><div className="flex flex-wrap gap-2"><button onClick={() => setEmpEdit((s) => ({ ...s, specialty: null }))} className={`text-xs px-3 py-1.5 rounded-full ${!empEdit.specialty ? "bg-slate-700 text-slate-200 ring-1 ring-slate-500" : "bg-slate-800 text-slate-400"}`}>Nincs</button>{Object.entries(SPECIALTIES).map(([id, sp]) => { const I = sp.icon; return <button key={id} onClick={() => setEmpEdit((s) => ({ ...s, specialty: id }))} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition ${empEdit.specialty === id ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40" : "bg-slate-800 text-slate-400"}`}><I className="w-3.5 h-3.5" /> {sp.label}</button>; })}</div></div>
              )}

              <div><div className="text-xs text-slate-400 mb-2">Órabér (Ft)</div><input type="number" value={empEdit.rate} onChange={(e) => setEmpEdit((s) => ({ ...s, rate: e.target.value }))} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-sky-400/50" /></div>

              <div><div className="text-xs text-slate-400 mb-2">Szín (avatar / jelölés)</div><div className="flex gap-2">{PALETTE.map((col) => <button key={col} onClick={() => setEmpEdit((s) => ({ ...s, color: col }))} className={`w-8 h-8 rounded-full ${C[col].dot} ${empEdit.color === col ? "ring-2 ring-offset-2 ring-offset-slate-950 ring-white" : "opacity-70"}`} />)}</div></div>
            </div>
            <div className="p-4 border-t border-slate-800 flex gap-2">{empEdit.id != null && <button onClick={() => deleteEmp(empEdit.id)} className="px-4 py-3.5 rounded-xl bg-rose-500/15 text-rose-300 font-medium hover:bg-rose-500/25 flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Törlés</button>}<button onClick={saveEmp} className="flex-1 py-3.5 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600">{empEdit.id == null ? "Felvétel" : "Mentés"}</button></div>
          </div>
        )}

        {/* Munkakör → jogosultság szerkesztése */}
        {roleEdit && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-amber-400" /> {roleEdit.id == null ? "Új munkakör" : "Munkakör szerkesztése"}</div><button onClick={() => setRoleEdit(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div><div className="text-xs text-slate-400 mb-2">Munkakör megnevezése</div><input value={roleEdit.label} onChange={(e) => setRoleEdit((s) => ({ ...s, label: e.target.value }))} placeholder="pl. Éttermi üzletvezető" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-400/50" /></div>
              <div><div className="text-xs text-slate-400 mb-2">Részleg / szervezeti egység</div><div className="grid grid-cols-2 gap-2">{ALL_DEPTS.map((d) => { const DIcon = DEPARTMENTS.find((x) => x.id === d).icon; return <button key={d} onClick={() => setRoleEdit((s) => ({ ...s, dept: d }))} className={`flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition ${roleEdit.dept === d ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40" : "bg-slate-800 text-slate-400"}`}><DIcon className="w-3.5 h-3.5" /> {deptLabel(d)}</button>; })}</div></div>
              <div><div className="text-xs text-slate-400 mb-2">Jogosultsági kör</div><div className="space-y-2">{["employee", "manager", "admin"].map((lv) => <button key={lv} onClick={() => setRoleEdit((s) => ({ ...s, level: lv }))} className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left ${roleEdit.level === lv ? "bg-amber-500/10 border-amber-400/50" : "bg-slate-800/60 border-slate-700/60"}`}><div><div className="text-sm text-slate-200">{LEVEL_META[lv].label}</div><div className="text-[11px] text-slate-500">{lv === "employee" ? "Saját műszak, bélyegzés, szabadnap-kérés" : lv === "manager" ? "Részleg beosztása, jóváhagyások, szankciók" : "Cégszintű áttekintés és törzsadat-kezelés"}</div></div>{roleEdit.level === lv && <Check className="w-4 h-4 text-amber-300" />}</button>)}</div></div>
              {roleEdit.id != null && <div className="text-[11px] text-slate-500">A szint módosítása az összes ilyen munkakörű dolgozóra azonnal érvényesül.</div>}
            </div>
            <div className="p-4 border-t border-slate-800 flex gap-2">{roleEdit.id != null && <button onClick={() => deleteRole(roleEdit.id)} className="px-4 py-3.5 rounded-xl bg-rose-500/15 text-rose-300 font-medium hover:bg-rose-500/25 flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Törlés</button>}<button onClick={saveRole} className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400">{roleEdit.id == null ? "Létrehozás" : "Mentés"}</button></div>
          </div>
        )}

        {/* Szabadnap kérése – naptár */}
        {offModal && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><Bed className="w-5 h-5 text-amber-400" /> Szabadnapot kérek</div><button onClick={() => setOffModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-xs text-slate-400">Válaszd ki a kért napokat — akár 6 hónappal előre. A számok a még <span className="text-emerald-300">kikérhető szabadnapok</span> számát mutatják a részlegeden.</div>
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3"><button disabled={!canPrev} onClick={() => gotoMonth(-1)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button><div className="text-sm font-medium text-slate-100 capitalize">{cm.toLocaleDateString("hu-HU", { year: "numeric", month: "long" })}</div><button disabled={!canNext} onClick={() => gotoMonth(1)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button></div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 mb-1">{DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstOffset }).map((_, i) => <div key={`b${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dnum = i + 1; const k = dayKey(new Date(calY, calMo, dnum).getTime());
                    const horizon = k < TODAY_KEY || k > MAX_OFF_KEY;
                    const cap = offCapFor(k); const remaining = offRemainingFor(k, me.dept);
                    const blackout = cap === 0; const full = !blackout && remaining === 0;
                    const mineReq = timeOff.some((t) => t.employeeId === userId && t.date === k && t.status !== "declined");
                    const sel = offDays.includes(k); const isToday = k === TODAY_KEY;
                    const disabled = horizon || blackout || full || mineReq;
                    return <button key={dnum} disabled={disabled} onClick={() => setOffDays((p) => sel ? p.filter((x) => x !== k) : [...p, k])} className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center leading-none transition ${sel ? "bg-amber-500 text-slate-900 font-semibold" : horizon ? "text-slate-700" : blackout ? "bg-rose-500/15 text-rose-300/70" : full ? "bg-slate-800/40 text-slate-600" : mineReq ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40" : `bg-slate-800 hover:bg-slate-700 ${isToday ? "text-amber-300 ring-1 ring-amber-400/40" : "text-slate-300"}`}`}><span>{dnum}</span>{!horizon && !sel && (blackout ? <span className="text-[7px] mt-0.5">zárt</span> : mineReq ? <span className="text-[7px] mt-0.5">kért</span> : <span className={`text-[8px] mt-0.5 ${full ? "text-rose-400" : "text-emerald-400"}`}>{remaining}</span>)}</button>;
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-2.5 pt-2.5 border-t border-slate-700/50"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> szabad hely</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> betelt / zárt</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> már kérted</span></div>
              </Card>
              {offDays.length > 0 && (<div><div className="text-xs text-slate-400 mb-2">Kijelölt napok ({offDays.length})</div><div className="flex flex-wrap gap-2">{[...offDays].sort((a, b) => a - b).map((k) => <button key={k} onClick={() => setOffDays((p) => p.filter((x) => x !== k))} className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-200 capitalize">{fullDate(k)} <X className="w-3 h-3" /></button>)}</div></div>)}
              <div><div className="text-xs text-slate-400 mb-2">Indoklás (opcionális)</div><textarea value={offNote} onChange={(e) => setOffNote(e.target.value)} rows={2} placeholder="Pl. orvosi vizsgálat, családi program…" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-400/50 resize-none" /></div>
              <div className="text-xs text-slate-500 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-400/70" /> A kérést a részlegvezető bírálja el – figyelembe veheti, de nem garantált.</div>
            </div>
            <div className="p-4 border-t border-slate-800"><button onClick={submitTimeOff} disabled={offDays.length === 0} className={`w-full py-3.5 rounded-xl font-semibold transition ${offDays.length ? "bg-amber-500 text-slate-900 hover:bg-amber-400" : "bg-slate-700/50 text-slate-500 cursor-not-allowed"}`}>Kérés elküldése{offDays.length > 0 && ` (${offDays.length} nap)`}</button></div>
          </div>
        )}

        {/* Közlemény írása */}
        {annOpen && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between"><div className="text-white font-semibold flex items-center gap-2"><Megaphone className="w-5 h-5 text-amber-400" /> Új közlemény</div><button onClick={() => setAnnOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div><div className="text-xs text-slate-400 mb-2">Kinek szól? (láthatóság)</div><div className="flex flex-wrap gap-2">{[["all", "Mindenki"], ["dept", `Részleg: ${deptLabel(viewDept)}`], ["role", "Munkakör"]].map(([v, l]) => <button key={v} onClick={() => setAnnScopeType(v)} className={`text-sm px-3 py-1.5 rounded-full transition ${annScopeType === v ? "bg-amber-500 text-slate-900 font-medium" : "text-slate-300 bg-slate-800"}`}>{l}</button>)}</div>{annScopeType === "role" && <div className="mt-2 flex flex-wrap gap-2">{annRoles.map((r) => <button key={r} onClick={() => setAnnRole(r)} className={`text-xs px-3 py-1.5 rounded-full transition ${annRole === r ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40" : "text-slate-300 bg-slate-800"}`}>{r}</button>)}</div>}</div>
              <div><div className="text-xs text-slate-400 mb-2">Cím</div><input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Pl. Új nyári étlap" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-400/50" /></div>
              <div><div className="text-xs text-slate-400 mb-2">Üzenet</div><textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={4} placeholder="Részletek…" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-400/50 resize-none" /></div>
              <button onClick={() => setAnnPinned((v) => !v)} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${annPinned ? "bg-amber-400/15 text-amber-300" : "bg-slate-800 text-slate-300"}`}><Pin className="w-4 h-4" /> Kiemelt közlemény {annPinned ? "✓" : ""}</button>
            </div>
            <div className="p-4 border-t border-slate-800"><button onClick={postAnnouncement} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400"><Send className="w-4 h-4" /> Közzététel</button></div>
          </div>
        )}

      </div>
    </div>
  );
}
