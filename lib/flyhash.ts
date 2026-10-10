// Real FlyHash (Dasgupta et al. 2017): sparse random expansion + winner-take-all.
// Runs in the browser on a synthetic 5-minute window so the brain view shows the true hash.

export const D = 32; // input features (glomeruli)
export const M = 480; // Kenyon cells shown (2,000 in the full system)
export const C = 3; // inputs sampled by each Kenyon cell (~10%)
export const K = 24; // winners kept (5%)

export const FEATURES = (() => {
  const ch = ["WOB", "RPM", "Torque", "SPP", "Flow in", "Flow out", "Pit vol", "ROP"];
  const st = ["mean", "std", "slope", "max"];
  return ch.flatMap((c) => st.map((s) => `${c} ${s}`));
})();

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

export const PROJECTION: number[][] = (() => {
  const r = mulberry(7);
  return Array.from({ length: M }, () => {
    const s = new Set<number>();
    while (s.size < C) s.add(Math.floor(r() * D));
    return [...s];
  });
})();

export type Hash = { act: number[]; winners: number[] };
export function flyhash(v: number[]): Hash {
  const act = PROJECTION.map((idx) => idx.reduce((s, i) => s + v[i], 0));
  const order = act.map((a, i) => [a, i] as const).sort((a, b) => b[0] - a[0]);
  return { act, winners: order.slice(0, K).map((o) => o[1]).sort((a, b) => a - b) };
}
export function jaccard(a: number[], b: number[]) {
  const A = new Set(a);
  let inter = 0;
  for (const x of b) if (A.has(x)) inter++;
  return inter / (A.size + b.length - inter);
}

// current live window: rising torque & SPP, falling ROP (pre-incident-like)
export const QUERY: number[] = (() => {
  const r = mulberry(31);
  const v = Array.from({ length: D }, () => gauss(r) * 0.5);
  [8, 9, 10, 11, 12, 15, 30].forEach((i) => (v[i] += 1.7)); // torque mean/std/slope/max, SPP mean, SPP max, ROP slope handled below
  v[28] -= 1.6; // ROP mean down
  v[30] -= 3.2;
  return v;
})();

export type Neighbor = { id: string; well: string; depth: number; j: number; followed: string; incident: boolean; winners: number[] };
const WELLS = ["NHK-118", "HGJ-64", "MKM-33", "HGJ-71", "MKM-52", "NHK-121", "NHK-97", "NHK-130", "BGN-12", "KHT-09"];
export const LIBRARY: Neighbor[] = (() => {
  const qh = flyhash(QUERY).winners;
  const r = mulberry(99);
  return WELLS.map((w, i) => {
    const near = i < 7;
    const sigma = near ? 0.22 + 0.05 * i : 2.4;
    const v = near ? QUERY.map((x) => x + gauss(r) * sigma) : Array.from({ length: D }, () => gauss(r) * 1.2);
    const winners = flyhash(v).winners;
    const j = jaccard(qh, winners);
    const depth = 2400 + Math.round(r() * 30);
    return {
      id: `win-${1000 + i * 37}`, well: w, depth, j, winners,
      incident: near,
      followed: near ? ["Stuck pipe in 0.8 h", "Stuck pipe in 1.2 h", "Pack-off in 1.5 h", "Stuck pipe in 0.6 h", "Stuck pipe in 1.9 h", "Torque spike then stuck, 1.1 h", "Pack-off in 1.7 h"][i] : "No incident within 2 h",
    };
  }).sort((a, b) => b.j - a.j);
})();

export const NOVELTY = [
  { state: "Drilling", score: 0.14 },
  { state: "Connection", score: 0.09 },
  { state: "Circulating", score: 0.07 },
  { state: "Reaming", score: 0.38 },
];
