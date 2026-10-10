"use client";

import { COAL, EVENTS, FORMATIONS, HAZARDS, LOSS_ZONE, riskAt } from "@/lib/data";
import { useApp } from "./AppProvider";
import { HazardGlyph } from "./icons";

const SPAN = 300;
const H = 560;

// Vertical depth band from the bit to +300 m, one lane per hazard.
export function LookAhead({ depth }: { depth: number }) {
  const { openEvidence } = useApp();
  const y = (d: number) => ((d - depth) / SPAN) * (H - 40) + 30;
  const lanes = HAZARDS;
  const LW = 36;
  const x0 = 76;
  const steps = 60;
  return (
    <div className="panel" data-tour="v-look" style={{ padding: 8 }}>
      <h3 style={{ padding: "4px 8px 0" }}>Look-ahead · +{SPAN} m <span className="eyebrow">from offsets</span></h3>
      <svg viewBox={`0 0 ${x0 + lanes.length * LW + 12} ${H}`} style={{ width: "100%", height: H }}>
        {/* formation column */}
        {FORMATIONS.filter((f) => f.base > depth && f.top < depth + SPAN).map((f) => {
          const a = Math.max(depth, f.top), b = Math.min(depth + SPAN, f.base);
          return (
            <g key={f.id}>
              <rect x={0} y={y(a)} width={64} height={y(b) - y(a)} fill={f.color} fillOpacity={0.3} stroke="var(--cds-border-subtle)" strokeWidth={0.5} />
              <text x={4} y={y(a) + (a === depth ? 62 : 12)} fontSize={9}>{f.name}</text>
            </g>
          );
        })}
        {/* depth ticks */}
        {Array.from({ length: 7 }, (_, i) => Math.ceil(depth / 50) * 50 + i * 50).filter((d) => d < depth + SPAN).map((d) => (
          <g key={d}><line x1={64} x2={x0 + lanes.length * LW} y1={y(d)} y2={y(d)} stroke="var(--cds-border-subtle)" strokeWidth={0.5} /><text x={62} y={y(d) - 2} fontSize={9} textAnchor="end">{d}</text></g>
        ))}
        {/* hazard headers */}
        {lanes.map((h, i) => (
          <g key={h.id} transform={`translate(${x0 + i * LW + LW / 2 - 7},4)`}><foreignObject width={16} height={16}><div style={{ ["--c" as string]: h.css }}><HazardGlyph kind={h.id} size={14} /></div></foreignObject></g>
        ))}
        {/* risk bars */}
        {lanes.map((h, i) =>
          Array.from({ length: steps }, (_, k) => {
            const d = depth + (k / steps) * SPAN;
            const r = riskAt(h.id, d + SPAN / steps / 2);
            if (r < 0.06) return null;
            return <rect key={`${h.id}${k}`} x={x0 + i * LW + 4} y={y(d)} width={LW - 8} height={(H - 40) / steps + 0.6} fill={h.css} fillOpacity={0.15 + r * 0.8} />;
          }),
        )}
        {/* projected events */}
        {EVENTS.filter((e) => e.proj > depth && e.proj < depth + SPAN).map((e) => {
          const i = lanes.findIndex((h) => h.id === e.type);
          if (i < 0) return null;
          return (
            <circle key={e.id} cx={x0 + i * LW + LW / 2} cy={y(e.proj)} r={2.4} fill="var(--cds-background)" stroke={lanes[i].css} strokeWidth={1.2} />
          );
        })}
        {/* interactive intervals */}
        {[["Barail coal", COAL, "stuck"], ["Barail sand, loss zone", LOSS_ZONE, "mudloss"]].map(([label, z, h]) => {
          const zz = z as { top: number; base: number };
          if (zz.base < depth || zz.top > depth + SPAN) return null;
          const evs = EVENTS.filter((e) => (h === "stuck" ? (e.type === "stuck" || e.type === "torque") && e.form === "bar" && e.proj < 2440 : e.type === "mudloss" && e.form === "bar"));
          return (
            <g key={label as string} style={{ cursor: "pointer" }} onClick={() => openEvidence({ title: label as string, subtitle: `${zz.top}–${zz.base} m · projected from offsets`, events: evs })}>
              <rect x={0} y={y(Math.max(zz.top, depth))} width={x0 + lanes.length * LW} height={Math.max(4, y(zz.base) - y(Math.max(zz.top, depth)))} fill="var(--cds-interactive)" fillOpacity={0.06} stroke="var(--cds-interactive)" strokeDasharray="3 3" strokeWidth={0.8} />
            </g>
          );
        })}
        {/* bit marker */}
        <g>
          <line x1={0} x2={x0 + lanes.length * LW} y1={30} y2={30} stroke="var(--cds-text-primary)" strokeWidth={1.5} />
          <path d="M0,24 l10,6 l-10,6 z" fill="var(--cds-text-primary)" />
          <text x={14} y={44} fontSize={9} style={{ fill: "var(--cds-text-primary)" }}>BIT {Math.round(depth)}</text>
        </g>
      </svg>
    </div>
  );
}
