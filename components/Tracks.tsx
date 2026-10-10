"use client";

import { useMemo, useState } from "react";
import { COAL, FORMATIONS, LOSS_ZONE } from "@/lib/data";
import { TRACKS, frameAt } from "@/lib/telemetry";

const WIN = 140;
const TW = 108;
const AX = 52;
const H = 470;
const TOP = 34;

export function Tracks({ depth }: { depth: number }) {
  const [cur, setCur] = useState<number | null>(null);
  const from = depth - WIN;
  const y = (d: number) => TOP + ((d - from) / (WIN + 4)) * (H - TOP - 8);
  const data = useMemo(() => {
    const out = [];
    for (let d = Math.floor(from); d <= depth; d += 1) out.push(frameAt(d));
    return out;
  }, [Math.floor(depth / 1), from]);
  const W = AX + TRACKS.length * TW + 6;
  const hover = cur != null ? frameAt(Math.min(depth, cur)) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const py = ((e.clientY - r.top) / r.height) * H; setCur(from + ((py - TOP) / (H - TOP - 8)) * (WIN + 4)); }}
      onMouseLeave={() => setCur(null)}>
      {/* formation strip + depth axis */}
      {FORMATIONS.filter((f) => f.base > from && f.top < depth + 4).map((f) => (
        <rect key={f.id} x={AX - 10} y={y(Math.max(f.top, from))} width={6} height={y(Math.min(f.base, depth + 4)) - y(Math.max(f.top, from))} fill={f.color} fillOpacity={0.8} />
      ))}
      {Array.from({ length: 10 }, (_, i) => Math.ceil(from / 20) * 20 + i * 20).filter((d) => d <= depth + 2).map((d) => (
        <g key={d}><line x1={AX - 4} x2={W} y1={y(d)} y2={y(d)} stroke="var(--cds-border-subtle)" strokeWidth={0.5} /><text x={AX - 14} y={y(d) + 3} fontSize={10} textAnchor="end">{d}</text></g>
      ))}
      {[[COAL, "var(--hz-stuck)"], [LOSS_ZONE, "var(--hz-mudloss)"]].map(([z, c], i) => {
        const zz = z as { top: number; base: number };
        if (zz.base < from || zz.top > depth) return null;
        return <rect key={i} x={AX} y={y(Math.max(zz.top, from))} width={W - AX} height={y(Math.min(zz.base, depth)) - y(Math.max(zz.top, from))} fill={c as string} fillOpacity={0.09} />;
      })}
      {TRACKS.map((t, i) => {
        const x0 = AX + i * TW;
        const pts = data.filter((f) => f[t.key] != null).map((f) => `${x0 + 6 + (((f[t.key] as number) - t.min) / (t.max - t.min)) * (TW - 12)},${y(f.depth)}`).join(" ");
        return (
          <g key={t.key}>
            <rect x={x0} y={TOP - 4} width={TW} height={H - TOP - 4} fill="none" stroke="var(--cds-border-subtle)" />
            <text x={x0 + 6} y={14} fontSize={10} style={{ fill: "var(--cds-text-primary)" }}>{t.label}</text>
            <text x={x0 + 6} y={26} fontSize={8}>{t.min}–{t.max} {t.unit}</text>
            <polyline points={pts} fill="none" stroke={t.key === "flowOut" ? "var(--hz-mudloss)" : t.key === "torque" ? "var(--hz-torque)" : t.key === "dce" ? "var(--hz-kick)" : "var(--cds-interactive)"} strokeWidth={1.4} strokeLinejoin="round" />
            {hover && hover[t.key] != null && (
              <text x={x0 + TW - 5} y={TOP + 8} fontSize={9} textAnchor="end" style={{ fill: "var(--cds-text-primary)" }}>{(hover[t.key] as number).toFixed(t.key === "dce" ? 2 : 0)}</text>
            )}
          </g>
        );
      })}
      {/* bit */}
      <line x1={AX - 4} x2={W} y1={y(depth)} y2={y(depth)} stroke="var(--cds-text-primary)" strokeWidth={1.4} />
      {cur != null && cur > from && cur < depth + 4 && (
        <g pointerEvents="none"><line x1={AX - 4} x2={W} y1={y(cur)} y2={y(cur)} stroke="var(--cds-focus)" strokeDasharray="3 3" /><text x={W - 4} y={y(cur) - 3} fontSize={10} textAnchor="end" style={{ fill: "var(--cds-focus)" }}>{Math.round(cur)} m</text></g>
      )}
    </svg>
  );
}
