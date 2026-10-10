"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { EVENTS, HAZARDS, OFFSET_ROWS, PATHS, PLANNED, fmt } from "@/lib/data";
import { relColor } from "./ui";

const EXT = 9; // km half-extent
const px = (km: number) => (km / EXT) * 50 + 50;
const HEX: Record<string, string> = { mudloss: "#33b1ff", stuck: "#ff832b", kick: "#ff7eb6", torque: "#f1c21b", cement: "#3ddbd9", fishing: "#a8a8a8" };

// deterministic terrain hints: contour loops and a river, so the plan reads as a place, not a graph
function contours() {
  const out: string[] = [];
  const hills = [{ x: 28, y: 66, r: 5 }, { x: 74, y: 28, r: 4 }, { x: 62, y: 78, r: 3 }];
  hills.forEach((h, hi) => {
    for (let k = 1; k <= 6; k++) {
      const r0 = h.r * k * 0.9 + 2;
      let d = "";
      for (let a = 0; a <= 360; a += 8) {
        const t = (a * Math.PI) / 180;
        const r = r0 * (1 + 0.14 * Math.sin(3 * t + hi + k * 0.3) + 0.07 * Math.sin(5 * t + hi * 2));
        d += `${a === 0 ? "M" : "L"}${(h.x + Math.cos(t) * r).toFixed(2)},${(h.y + Math.sin(t) * r * 0.8).toFixed(2)}`;
      }
      out.push(d + "Z");
    }
  });
  return out;
}

export function OffsetMap({ radiusKm, hoverId, onHover, selectedIds = [], onSelect, height = 520, compact = false }: {
  radiusKm: number; hoverId?: string | null; onHover?: (id: string | null) => void; selectedIds?: string[];
  onSelect?: (id: string) => void; height?: number; compact?: boolean;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const topo = useMemo(contours, []);
  const hover = OFFSET_ROWS.find((w) => w.id === hoverId);
  const ticks = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
  const rings = [2, 4, 6, 8];

  return (
    <div style={{ position: "relative" }} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }} onMouseLeave={() => setPos(null)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height, display: "block", background: "var(--cds-layer-01)" }} role="img" aria-label="Plan map of offset wells">
        <defs>
          <radialGradient id="ringfill"><stop offset="60%" stopColor="var(--accent)" stopOpacity={0.02} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.14} /></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="0.7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <clipPath id="frame"><rect x="0" y="0" width="100" height="100" /></clipPath>
        </defs>
        <g clipPath="url(#frame)">
          {topo.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--ink3)" strokeOpacity={i % 6 === 5 ? 0.28 : 0.13} strokeWidth={i % 6 === 5 ? 0.22 : 0.12} />)}
          <path d="M-2,20 C14,26 20,44 38,46 S62,58 70,74 S90,92 104,90" fill="none" stroke="var(--tier-advisory)" strokeOpacity={0.28} strokeWidth={0.9} strokeLinecap="round" />
          <path d="M-2,20 C14,26 20,44 38,46 S62,58 70,74 S90,92 104,90" fill="none" stroke="var(--tier-advisory)" strokeOpacity={0.5} strokeWidth={0.25} strokeDasharray="0.6 0.9" />
          {ticks.map((t) => (
            <g key={t} stroke="var(--line)" strokeWidth={0.1}>
              <line x1={px(t)} y1={0} x2={px(t)} y2={100} /><line x1={0} y1={px(t)} x2={100} y2={px(t)} />
            </g>
          ))}
          {/* lease boundary */}
          <path d="M14,18 L60,10 L88,24 L92,62 L70,88 L28,84 L10,52Z" fill="none" stroke="var(--ink3)" strokeWidth={0.22} strokeDasharray="1.6 0.8 0.3 0.8" />
          <text x={15} y={16} fontSize={1.5} style={{ fill: "var(--ink3)" }}>EASTERN FIELDS · LEASE BLOCK</text>

          {rings.map((r) => (
            <g key={r}>
              <circle cx={50} cy={50} r={(r / EXT) * 50} fill="none" stroke="var(--line2)" strokeWidth={0.14} strokeDasharray="0.5 1" />
              {!compact && <text x={50 + (r / EXT) * 50 * 0.72} y={50 - (r / EXT) * 50 * 0.72 - 0.6} fontSize={1.6}>{r} km</text>}
            </g>
          ))}
          <motion.circle cx={50} cy={50} initial={{ r: 0 }} fill="url(#ringfill)" stroke="var(--accent)" strokeWidth={0.32} strokeDasharray="1.2 0.5"
            animate={{ r: (Math.min(radiusKm, 20) / EXT) * 50 }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />

          {/* offsets */}
          {OFFSET_ROWS.map((w, i) => {
            const inR = w.distKm <= radiusKm;
            const on = hoverId === w.id;
            const sel = selectedIds.includes(w.id);
            const st = PATHS[w.id].filter((s) => s.tvd > 0);
            const d = "M" + st.map((s) => `${px(s.x / 1000).toFixed(2)},${px(-s.y / 1000).toFixed(2)}`).join(" L");
            const col = relColor(w.relevance);
            const sx = px(w.surf.x / 1000), sy = px(-w.surf.y / 1000);
            const arc = 2 * Math.PI * 2.1;
            return (
              <motion.g key={w.id} initial={{ opacity: 0 }} animate={{ opacity: inR ? 1 : 0.14 }} transition={{ delay: i * 0.03 }}
                onMouseEnter={() => onHover?.(w.id)} onMouseLeave={() => onHover?.(null)} onClick={() => onSelect?.(w.id)} style={{ cursor: "pointer" }}>
                <motion.path d={d} fill="none" stroke={sel ? "var(--ink)" : col} strokeWidth={on || sel ? 0.75 : 0.4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.1 + i * 0.05 }} filter={on ? "url(#glow)" : undefined} />
                {/* relevance donut around the pad */}
                <circle cx={sx} cy={sy} r={2.1} fill="var(--bg2)" stroke="var(--line2)" strokeWidth={0.35} />
                <circle cx={sx} cy={sy} r={2.1} fill="none" stroke={col} strokeWidth={0.5} strokeDasharray={`${arc * w.relevance} ${arc}`} transform={`rotate(-90 ${sx} ${sy})`} strokeLinecap="round" />
                <circle cx={sx} cy={sy} r={0.6} fill={sel ? "var(--ink)" : col} />
                {sel && <circle cx={sx} cy={sy} r={3.2} fill="none" stroke="var(--ink)" strokeWidth={0.2} strokeDasharray="0.5 0.5" />}
                {(!compact || on || sel) && (
                  <g transform={`translate(${sx + 2.8},${sy + 0.5})`}>
                    <rect x={-0.6} y={-1.7} width={w.name.length * 1.05 + 1.2} height={2.6} rx={0.7} fill="var(--panel)" fillOpacity={0.85} stroke={on ? "var(--accent)" : "var(--line2)"} strokeWidth={0.12} />
                    <text x={0} y={0.1} fontSize={1.5} style={{ fill: on ? "var(--ink)" : "var(--ink2)", fontWeight: on ? 600 : 400 }}>{w.name}</text>
                  </g>
                )}
              </motion.g>
            );
          })}

          {/* event dots along paths */}
          {!compact && EVENTS.map((e) => {
            const w = OFFSET_ROWS.find((x) => x.id === e.wellId);
            if (!w || w.distKm > radiusKm) return null;
            const st = PATHS[e.wellId];
            const j = Math.max(1, st.findIndex((s) => s.tvd >= e.tvd));
            const a = st[j - 1], b = st[j];
            const f = (e.tvd - a.tvd) / (b.tvd - a.tvd || 1);
            return <circle key={e.id} cx={px((a.x + (b.x - a.x) * f) / 1000)} cy={px(-(a.y + (b.y - a.y) * f) / 1000)} r={0.55} fill={HEX[e.type]} stroke="var(--bg2)" strokeWidth={0.15} />;
          })}

          {/* planned well */}
          <path d={"M" + PATHS[PLANNED.id].filter((s) => s.tvd > 0).map((s) => `${px(s.x / 1000).toFixed(2)},${px(-s.y / 1000).toFixed(2)}`).join(" L")} fill="none" stroke="var(--accent)" strokeWidth={0.9} strokeLinecap="round" filter="url(#glow)" />
          <motion.circle cx={50} cy={50} initial={{ r: 2.4 }} fill="none" stroke="var(--accent)" strokeWidth={0.25} animate={{ r: [2.4, 5], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 2.2 }} />
          <rect x={48.6} y={48.6} width={2.8} height={2.8} rx={0.5} fill="var(--accent)" />
          <text x={52} y={48.4} fontSize={1.9} style={{ fill: "var(--accent)", fontWeight: 600 }}>DEMO-P1</text>

          {/* edge scale + compass + scale bar */}
          {ticks.filter((t) => t !== 0 && !compact).map((t) => <text key={t} x={px(t)} y={99} fontSize={1.3} textAnchor="middle">{t > 0 ? `+${t}` : t}</text>)}
          <g transform="translate(92,10)">
            <circle r={4} fill="var(--panel)" fillOpacity={0.8} stroke="var(--line2)" strokeWidth={0.2} />
            <path d="M0,-3.2 L1,0 L0,3.2 L-1,0Z" fill="var(--ink3)" /><path d="M0,-3.2 L1,0 L-1,0Z" fill="var(--accent)" />
            <text y={-4.8} fontSize={1.6} textAnchor="middle" style={{ fill: "var(--ink)" }}>N</text>
          </g>
          <g transform="translate(6,94)">
            <rect width={(2 / EXT) * 50} height={0.7} fill="var(--ink2)" /><rect width={(1 / EXT) * 50} height={0.7} fill="var(--bg2)" stroke="var(--ink2)" strokeWidth={0.1} />
            <text y={-0.8} fontSize={1.4}>0 — 2 km</text>
          </g>
        </g>
      </svg>

      {!compact && (
        <div className="row" style={{ position: "absolute", left: 12, top: 12, gap: 6, flexWrap: "wrap", maxWidth: "70%" }}>
          <span className="hz" style={{ background: "var(--panel)" }}>radius {radiusKm} km</span>
          <span className="hz" style={{ background: "var(--panel)" }}>{OFFSET_ROWS.filter((w) => w.distKm <= radiusKm).length} offsets</span>
        </div>
      )}
      {!compact && (
        <div className="panel" style={{ position: "absolute", right: 12, bottom: 12, padding: "8px 10px", fontSize: 11, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", maxWidth: "62%" }}>
          <span style={{ color: "var(--ink3)" }}>relevance</span>
          <span style={{ width: 70, height: 6, borderRadius: 3, background: "linear-gradient(90deg, var(--line2), var(--accent))" }} />
          {HAZARDS.slice(0, 5).map((h) => <span key={h.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ink2)" }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: HEX[h.id] }} />{h.label.split(" ")[0].toLowerCase()}</span>)}
        </div>
      )}
      {hover && pos && !compact && (
        <div className="panel" style={{ position: "absolute", left: Math.min(pos.x + 16, 9999), top: pos.y + 16, padding: "10px 12px", pointerEvents: "none", minWidth: 190, zIndex: 5 }}>
          <b style={{ fontSize: 13 }}>{hover.name}</b> <span className="eyebrow">{hover.field} · {hover.spud}</span>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink2)", marginTop: 4, lineHeight: 1.6 }}>
            relevance {hover.relevance.toFixed(2)}<br />surface {hover.distKm.toFixed(1)} km · path sep {fmt(hover.sep)} m<br />{hover.nEvents} events · TD {fmt(hover.td)} m
          </div>
        </div>
      )}
    </div>
  );
}
