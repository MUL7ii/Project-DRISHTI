// Deterministic synthetic eRTMAC telemetry, indexed by bit depth (replay).
import { COAL, LOSS_ZONE } from "./data";

export const D0 = 2280;
export const D_END = 2520;
export const RATE = 0.2; // m of hole per replay-second (compressed for the demo)

const n = (d: number, k: number) => 0.5 * Math.sin(d * 13.7 + k) + 0.5 * Math.sin(d * 37.1 + k * 2.3);
const ss = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

export type Frame = {
  depth: number; rop: number; wob: number; rpm: number; torque: number; spp: number;
  flowIn: number; flowOut: number; pit: number; dce: number | null; state: "Drilling" | "Connection";
};

export function frameAt(d: number): Frame {
  const inCoal = ss((d - (COAL.top - 6)) / 8) * (1 - ss((d - (COAL.base + 4)) / 8));
  const inLoss = ss((d - LOSS_ZONE.top) / 10) * (1 - ss((d - (LOSS_ZONE.base + 8)) / 10));
  const spike = inCoal * Math.max(0, Math.sin(d * 2.9)) ** 4 * 14;
  const rop = 24 + 3 * n(d, 1) - 14 * inCoal - 4 * inLoss;
  const wob = 118 + 8 * n(d, 2) + 20 * inCoal * Math.abs(n(d, 9));
  const rpm = 112 + 3 * n(d, 3);
  const torque = 14 + 0.0035 * (d - D0) * 10 + 1.2 * n(d, 4) + 7 * inCoal + spike;
  const spp = 205 + 0.05 * (d - D0) + 2 * n(d, 5) - 16 * ss((d - LOSS_ZONE.top) / 18);
  const flowIn = 2200;
  const flowOut = flowIn * (0.995 - 0.19 * inLoss) + 8 * n(d, 6);
  const pit = 46 + 0.06 * n(d, 7) - 3.4 * ss((d - (LOSS_ZONE.top + 2)) / 30);
  const shale = d < COAL.top - 8;
  const dce = shale ? 1.22 + 0.0011 * (d - D0) - 0.13 * ss((d - 2372) / 22) + 0.008 * n(d, 8) : null;
  const state = (d - D0) % 28.5 < 0.9 ? "Connection" : "Drilling";
  return { depth: d, rop, wob, rpm, torque, spp, flowIn, flowOut, pit, dce, state };
}

export function series(from: number, to: number, step = 0.5): Frame[] {
  const out: Frame[] = [];
  for (let d = from; d <= to; d += step) out.push(frameAt(d));
  return out;
}

export const TRACKS: { key: keyof Frame; label: string; unit: string; min: number; max: number }[] = [
  { key: "wob", label: "WOB", unit: "kN", min: 80, max: 180 },
  { key: "rpm", label: "RPM", unit: "rpm", min: 90, max: 130 },
  { key: "torque", label: "Torque", unit: "kN·m", min: 8, max: 44 },
  { key: "spp", label: "SPP", unit: "bar", min: 170, max: 240 },
  { key: "flowOut", label: "Flow out", unit: "L/min", min: 1600, max: 2300 },
  { key: "pit", label: "Pit vol", unit: "m³", min: 41, max: 48 },
  { key: "dce", label: "dc-exp", unit: "", min: 1.1, max: 1.7 },
];
