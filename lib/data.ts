// Representative data for the DRISHTI prototype. Shaped like the planned API (Doc 04/05).
// Nothing here is real OIL data.

export type Hazard = "mudloss" | "stuck" | "kick" | "torque" | "cement";
export const HAZARDS: { id: Hazard; label: string; css: string }[] = [
  { id: "mudloss", label: "Mud loss", css: "var(--hz-mudloss)" },
  { id: "stuck", label: "Stuck pipe", css: "var(--hz-stuck)" },
  { id: "kick", label: "Kick / overpressure", css: "var(--hz-kick)" },
  { id: "torque", label: "Torque spike", css: "var(--hz-torque)" },
  { id: "cement", label: "Cementing issue", css: "var(--hz-cement)" },
];
export const hz = (id: Hazard) => HAZARDS.find((h) => h.id === id)!;

// ---------- Formations (planned-well tops, TVDSS m) ----------
export type Formation = { id: string; name: string; top: number; base: number; lith: string; color: string };
export const FORMATIONS: Formation[] = [
  { id: "dhk", name: "Dhekiajuli", top: 0, base: 400, lith: "Sandstone / clay", color: "#a8a35f" },
  { id: "nam", name: "Namsang", top: 400, base: 900, lith: "Sandstone", color: "#f2d16b" },
  { id: "tip", name: "Tipam", top: 900, base: 1500, lith: "Sandstone", color: "#e3c04f" },
  { id: "gir", name: "Girujan", top: 1500, base: 2350, lith: "Clay / claystone", color: "#a8a35f" },
  { id: "bar", name: "Barail", top: 2350, base: 3150, lith: "Shale, sand, coal", color: "#7d8f7a" },
  { id: "kop", name: "Kopili", top: 3150, base: 3450, lith: "Shale", color: "#6b7d68" },
  { id: "syl", name: "Sylhet", top: 3450, base: 3700, lith: "Limestone", color: "#8cb8d8" },
];
export const formationAt = (d: number) => FORMATIONS.find((f) => d >= f.top && d < f.base) ?? FORMATIONS[FORMATIONS.length - 1];
export const nextFormation = (d: number) => FORMATIONS.find((f) => f.top > d);

export const COAL = { top: 2405, base: 2432 };
export const LOSS_ZONE = { top: 2450, base: 2480 };

// ---------- RNG ----------
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Wells ----------
export type Station = { md: number; tvd: number; x: number; y: number }; // x east, y north (m), tvd down
export type Well = {
  id: string;
  name: string;
  field: string;
  asset: string;
  spud: number;
  td: number;
  kop: number;
  inc: number;
  az: number;
  surf: { x: number; y: number };
  status: "planned" | "drilling" | "completed";
  shift: number; // formation-top shift vs planned (m)
  scores: { formations: number; recency: number };
  classification: "Internal" | "Restricted";
};

function makePath(w: Pick<Well, "td" | "kop" | "inc" | "az" | "surf">): Station[] {
  const out: Station[] = [];
  const azr = (w.az * Math.PI) / 180;
  let hd = 0;
  for (let tvd = 0; tvd <= w.td; tvd += 50) {
    if (tvd > w.kop) {
      const build = Math.min(1, (tvd - w.kop) / 500);
      const incr = ((w.inc * build) * Math.PI) / 180;
      hd += 50 * Math.tan(incr);
    }
    const md = tvd + hd * 0.12;
    out.push({ md, tvd, x: w.surf.x + hd * Math.sin(azr), y: w.surf.y + hd * Math.cos(azr) });
  }
  return out;
}

const polar = (deg: number, km: number) => ({
  x: km * 1000 * Math.sin((deg * Math.PI) / 180),
  y: km * 1000 * Math.cos((deg * Math.PI) / 180),
});

export const PLANNED: Well = {
  id: "demo-p1",
  name: "DEMO-P1",
  field: "Upper Assam · Eastern Fields",
  asset: "Eastern Fields",
  spud: 2026,
  td: 3700,
  kop: 700,
  inc: 32,
  az: 70,
  surf: { x: 0, y: 0 },
  status: "drilling",
  shift: 0,
  scores: { formations: 1, recency: 1 },
  classification: "Internal",
};

const O = (
  id: string, name: string, field: string, deg: number, km: number, spud: number, td: number,
  kop: number, inc: number, az: number, shift: number, fm: number,
): Well => ({
  id, name, field, asset: "Eastern Fields", spud, td, kop, inc, az, surf: polar(deg, km), status: "completed",
  shift, scores: { formations: fm / 7, recency: (spud - 2004) / 22 }, classification: "Internal",
});

export const OFFSETS: Well[] = [
  O("nhk-118", "NHK-118", "Nahorkatiya", 22, 0.9, 2019, 3650, 650, 30, 64, 12, 7),
  O("nhk-121", "NHK-121", "Nahorkatiya", 68, 1.4, 2021, 3720, 720, 34, 78, -18, 7),
  O("hgj-064", "HGJ-64", "Hugrijan", 118, 2.1, 2017, 3600, 600, 28, 55, 30, 7),
  O("mkm-033", "MKM-33", "Makum", 205, 2.6, 2015, 3680, 800, 36, 92, -25, 6),
  O("nhk-097", "NHK-97", "Nahorkatiya", 300, 2.9, 2012, 3580, 550, 26, 40, 45, 6),
  O("hgj-071", "HGJ-71", "Hugrijan", 145, 3.4, 2020, 3740, 700, 33, 62, 8, 7),
  O("mkm-040", "MKM-40", "Makum", 250, 3.9, 2018, 3660, 750, 31, 88, -34, 6),
  O("bgn-012", "BGN-12", "Baghjan", 10, 4.2, 2016, 3620, 900, 22, 110, 55, 5),
  O("nhk-130", "NHK-130", "Nahorkatiya", 85, 4.5, 2023, 3750, 680, 35, 71, -5, 7),
  O("dgb-215", "DGB-215", "Digboi", 335, 5.1, 2013, 3560, 620, 27, 30, 62, 5),
  O("hgj-080", "HGJ-80", "Hugrijan", 170, 5.8, 2022, 3700, 710, 34, 66, -14, 6),
  O("mkm-052", "MKM-52", "Makum", 225, 6.3, 2010, 3540, 500, 24, 100, -48, 5),
  O("kht-009", "KHT-09", "Khoraghat", 45, 7.0, 2014, 3610, 950, 20, 20, 70, 4),
  O("bgn-019", "BGN-19", "Baghjan", 355, 7.6, 2024, 3690, 720, 32, 350, 20, 5),
];
export const ALL_WELLS = [PLANNED, ...OFFSETS];
export const wellById = (id: string) => ALL_WELLS.find((w) => w.id === id);

export const PATHS: Record<string, Station[]> = Object.fromEntries(ALL_WELLS.map((w) => [w.id, makePath(w)]));

// Real geometry: minimum 3D separation of each offset from the planned path in the target section
const targetPlanned = PATHS["demo-p1"].filter((s) => s.tvd >= 2000);
function minSep(id: string) {
  const p = PATHS[id].filter((s) => s.tvd >= 2000);
  let m = Infinity;
  for (const a of p) for (const b of targetPlanned) {
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.tvd - b.tvd);
    if (d < m) m = d;
  }
  return m;
}

// ---------- Events ----------
export type EvType = Hazard | "fishing";
export type Ev = {
  id: string; wellId: string; type: EvType; form: string; rel: number; npt: number;
  action: string; outcome: "success" | "partial" | "failed"; tvd: number; proj: number; conf: number;
  docId: string; line: number; text: string;
};

type Row = [string, EvType, string, number, number, string, "success" | "partial" | "failed"];
const EV_ROWS: Row[] = [
  ["nhk-118", "stuck", "bar", 0.08, 14, "Spotted lube pill, jarred up; pipe freed", "success"],
  ["nhk-118", "mudloss", "bar", 0.14, 6, "Pumped LCM pill 15 ppb; losses cured after 2 pills", "success"],
  ["nhk-121", "torque", "bar", 0.07, 2, "Reduced WOB, backreamed the interval", "success"],
  ["nhk-121", "mudloss", "bar", 0.15, 10, "Pumped LCM pill 15 ppb; cured after 2 pills", "success"],
  ["hgj-064", "stuck", "bar", 0.09, 22, "Spotted pill twice, jarred; freed after 22 h", "success"],
  ["hgj-064", "cement", "bar", 0.98, 24, "Poor bond on CBL; remedial squeeze at 9-5/8 in shoe", "partial"],
  ["mkm-033", "stuck", "bar", 0.085, 31, "Fishing unsuccessful; sidetracked", "failed"],
  ["mkm-033", "mudloss", "bar", 0.13, 18, "LCM ineffective; set cement plug and drilled ahead", "partial"],
  ["mkm-033", "stuck", "kop", 0.3, 16, "Differential sticking; freed with spotting fluid", "success"],
  ["nhk-097", "torque", "bar", 0.075, 3, "Circulated bottoms up, reduced RPM", "success"],
  ["nhk-097", "mudloss", "bar", 0.155, 7, "LCM sweep 12 ppb; losses cured", "success"],
  ["hgj-071", "stuck", "bar", 0.1, 9, "Worked pipe, reduced mud weight 0.02 sg; freed", "success"],
  ["hgj-071", "mudloss", "bar", 0.145, 12, "Lost 400 bbl; LCM plus reduced pump rate cured", "success"],
  ["mkm-040", "torque", "kop", 0.55, 4, "Torque spikes in shale; reamed section", "success"],
  ["mkm-040", "cement", "bar", 0.98, 12, "Channeling suspected; extra centralisers on offset run", "partial"],
  ["bgn-012", "kick", "kop", 0.35, 20, "Gas influx, weighted up to 1.62 sg and circulated out", "success"],
  ["nhk-130", "torque", "bar", 0.08, 2, "Torque rose 30%; cleaned hole, resumed", "success"],
  ["nhk-130", "mudloss", "bar", 0.16, 5, "LCM 15 ppb cured losses in one pill", "success"],
  ["dgb-215", "kick", "kop", 0.4, 8, "Minor gas show; increased mud weight 0.05 sg", "success"],
  ["dgb-215", "fishing", "kop", 0.6, 20, "Twist-off; fished BHA in 20 h", "success"],
  ["hgj-080", "cement", "bar", 0.97, 8, "Losses during cementing; lightweight slurry on next job", "partial"],
  ["hgj-080", "torque", "kop", 0.5, 3, "Torque spikes, reduced WOB", "success"],
  ["mkm-052", "stuck", "bar", 0.095, 12, "Pack-off at coal; reamed and freed", "success"],
  ["kht-009", "mudloss", "tip", 0.5, 9, "Shallow loss in Tipam; LCM cured", "success"],
  ["bgn-019", "torque", "bar", 0.07, 2, "Torque spike at coal; short trip", "success"],
];

const OFFSET_TOPS = (shift: number, fid: string) => {
  const f = FORMATIONS.find((x) => x.id === fid)!;
  return { top: f.top + shift, base: f.base + shift };
};
export const topsFor = (wellId: string) => {
  const w = wellById(wellId)!;
  return FORMATIONS.map((f) => ({ ...f, top: f.top + w.shift, base: f.base + w.shift }));
};

const fmtT = (i: number) => `${String(6 + ((i * 3) % 14)).padStart(2, "0")}:${["00", "30", "15", "45"][i % 4]}`;

export const EVENTS: Ev[] = EV_ROWS.map((r, i) => {
  const [wellId, type, form, rel, npt, action, outcome] = r;
  const w = wellById(wellId)!;
  const t = OFFSET_TOPS(w.shift, form);
  const tvd = Math.round(t.top + rel * (t.base - t.top));
  const pf = FORMATIONS.find((f) => f.id === form)!;
  const proj = Math.round(pf.top + rel * (pf.base - pf.top));
  const label: Record<EvType, string> = {
    mudloss: "Lost circulation", stuck: "Pipe stuck", kick: "Gas influx (kick)", torque: "Torque spikes",
    cement: "Cement job problem", fishing: "Fishing operation",
  };
  const fname = pf.name;
  return {
    id: `ev-${String(i + 1).padStart(3, "0")}`, wellId, type, form, rel, npt, action, outcome, tvd, proj,
    conf: 0.72 + ((i * 37) % 27) / 100, docId: `ddr-${wellId}`, line: 0,
    text: `${fmtT(i)}  ${label[type]} at ${tvd.toLocaleString("en")} m TVDSS in ${fname}. ${action}. NPT ${npt} h.`,
  };
});
export const evOf = (id: string) => EVENTS.find((e) => e.id === id)!;

// ---------- Offset ranking ----------
export type OffsetRow = Well & {
  distKm: number; sep: number; relevance: number; sub: { path: number; formations: number; recency: number; events: number };
  counts: Record<EvType, number>; nEvents: number;
};
export const OFFSET_ROWS: OffsetRow[] = OFFSETS.map((w) => {
  const sep = minSep(w.id);
  const distKm = Math.hypot(w.surf.x, w.surf.y) / 1000;
  const evs = EVENTS.filter((e) => e.wellId === w.id);
  const counts = { mudloss: 0, stuck: 0, kick: 0, torque: 0, cement: 0, fishing: 0 } as Record<EvType, number>;
  evs.forEach((e) => counts[e.type]++);
  const sub = {
    path: Math.max(0, 1 - sep / 3500),
    formations: w.scores.formations,
    recency: w.scores.recency,
    events: Math.min(1, evs.filter((e) => e.form === "bar").length / 3),
  };
  const relevance = 0.4 * sub.path + 0.25 * sub.formations + 0.15 * sub.recency + 0.2 * sub.events;
  return { ...w, distKm, sep, sub, relevance, counts, nEvents: evs.length };
}).sort((a, b) => b.relevance - a.relevance);

// ---------- Documents ----------
export type DocField = { id: string; label: string; value: string; unit: string; conf: number; status: "auto" | "reviewed" | "needs_review"; line: number };
export type Doc = { id: string; wellId: string; title: string; type: string; date: string; classification: string; lines: string[]; fields: DocField[] };

const fillers = [
  "Operations summary — 24 h report.",
  "Drilling ahead with rotary assembly, parameters within programme.",
  "Circulated bottoms up, no gas shows above background.",
  "Pumped sweep and tripped for bit change as per plan.",
  "Mud properties checked; MW/viscosity in range.",
  "Rig service and BOP function test completed.",
];
export const DOCS: Doc[] = OFFSETS.map((w, di) => {
  const evs = EVENTS.filter((e) => e.wellId === w.id);
  const lines: string[] = [];
  const fields: DocField[] = [];
  lines.push(`${w.name}  DAILY DRILLING REPORT   ${String(1 + (di * 2) % 27).padStart(2, "0")}-Mar-${w.spud}   Rig ${100 + di * 7}   OIL / Upper Assam`);
  lines.push(fillers[di % fillers.length]);
  evs.forEach((e, k) => {
    lines.push(fillers[(di + k + 1) % fillers.length]);
    e.line = lines.length;
    lines.push(e.text);
    fields.push({ id: `f-${e.id}`, label: `${e.type === "mudloss" ? "Mud loss" : e.type === "stuck" ? "Stuck pipe" : e.type === "kick" ? "Kick" : e.type === "torque" ? "Torque spike" : e.type === "cement" ? "Cementing" : "Fishing"} depth`, value: e.tvd.toLocaleString("en"), unit: "m TVDSS", conf: e.conf, status: e.conf < 0.8 ? "needs_review" : "auto", line: e.line });
    fields.push({ id: `n-${e.id}`, label: "NPT", value: String(e.npt), unit: "h", conf: Math.min(0.99, e.conf + 0.08), status: "auto", line: e.line });
  });
  lines.push("Next 24 h: continue drilling ahead per programme.");
  return { id: `ddr-${w.id}`, wellId: w.id, title: `DDR ${w.name} · ${w.spud}`, type: "Daily Drilling Report", date: `${w.spud}-03-${String(1 + (di * 2) % 27).padStart(2, "0")}`, classification: w.classification, lines, fields };
});
export const docById = (id: string) => DOCS.find((d) => d.id === id);

// ---------- Risk register (100 m intervals) ----------
export type RiskCell = { level: number; n: number; drivers: string[] } | null;
const evAt = (hz_: Hazard, top: number, base: number) => EVENTS.filter((e) => e.type === hz_ && e.proj >= top && e.proj < base);
export const RISK_INTERVALS = Array.from({ length: 12 }, (_, i) => ({ top: 2100 + i * 100, base: 2200 + i * 100 }));
export const RISK_REGISTER: Record<Hazard, RiskCell[]> = Object.fromEntries(
  HAZARDS.map((h) => [
    h.id,
    RISK_INTERVALS.map(({ top, base }) => {
      const near = EVENTS.filter((e) => e.type === h.id && e.proj >= top - 60 && e.proj < base + 60);
      const n = new Set(near.map((e) => e.wellId)).size;
      let r = 0;
      for (let d = top; d < base; d += 10) r = Math.max(r, riskAt(h.id, d));
      const level = r > 0.8 ? 3 : r > 0.5 ? 2 : r > 0.18 ? 1 : 0;
      if (n > 0 && n < 3 && level === 0) return null; // too few offsets to call it
      if (h.id === 'kick' && n > 0 && n < 3) return null;
      const es = near.filter((e) => e.proj >= top && e.proj < base);
      return {
        level, n: level === 0 ? 0 : n,
        drivers: level === 0 ? ['No offset events near this depth'] : [n + ' of 14 offsets have events within 60 m', 'Formation: ' + formationAt((top + base) / 2).name, 'Mean NPT ' + (es.length ? (es.reduce((a, e) => a + e.npt, 0) / es.length).toFixed(1) : '—') + ' h'],
      };
    }),
  ]),
) as Record<Hazard, RiskCell[]>;

// Continuous look-ahead risk (0..1) from offset events projected on the planned well
export function riskAt(h: Hazard, depth: number): number {
  let r = 0;
  for (const e of EVENTS) if (e.type === h) r += Math.exp(-(((depth - e.proj) / 22) ** 2)) * 0.45;
  return Math.min(1, r);
}
export const eventsNear = (h: Hazard, top: number, base: number) => EVENTS.filter((e) => e.type === h && e.proj >= top - 15 && e.proj <= base + 15);

// ---------- Ladder data ----------
export const CASING = [
  { size: "13-3/8″", shoe: 1500, cementTop: 300 },
  { size: "9-5/8″", shoe: 3150, cementTop: 1300 },
  { size: "7″ liner", shoe: 3700, cementTop: 2900 },
];
export const MUD = [
  { top: 0, base: 400, mw: 1.1 },
  { top: 400, base: 1500, mw: 1.16 },
  { top: 1500, base: 3150, mw: 1.3 },
  { top: 3150, base: 3700, mw: 1.55 },
];
export const wellShoeShift = (id: string) => (id === "demo-p1" ? 0 : ((id.length * 13) % 40) - 20);

// ---------- Lessons ----------
export const LESSONS = [
  { id: "ls-1", title: "Barail coal: reduce WOB and ream before connections", wells: ["nhk-118", "hgj-064", "mkm-052"], form: "Barail", status: "Published" },
  { id: "ls-2", title: "Lost circulation in Barail sand: LCM 15 ppb pill cures most losses", wells: ["nhk-118", "nhk-121", "nhk-130"], form: "Barail", status: "Published" },
  { id: "ls-3", title: "Add centralisers on 9-5/8 in string to avoid channeling", wells: ["mkm-040", "hgj-064"], form: "Barail", status: "Published" },
  { id: "ls-4", title: "Watch dc-exponent reversal entering Kopili shale", wells: ["bgn-012", "dgb-215"], form: "Kopili", status: "Awaiting approval" },
];

// ---------- Planned wells for P1 ----------
export const PLANNED_WELLS = [
  { id: "demo-p1", name: "DEMO-P1", asset: "Eastern Fields", target: "Barail / Kopili", status: "Drilling · 2,280 m" },
  { id: "demo-p2", name: "DEMO-P2", asset: "Eastern Fields", target: "Tipam sand", status: "Planned" },
  { id: "demo-p3", name: "DEMO-P3", asset: "Western Fields", target: "Sylhet", status: "Planned" },
  { id: "demo-p4", name: "DEMO-P4", asset: "Rajasthan", target: "Girujan", status: "Planned" },
];

export const fmt = (n: number, d = 0) => n.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
