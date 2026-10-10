"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Toggle } from "@carbon/react";
import { motion } from "framer-motion";
import { useApp } from "@/components/AppProvider";
import { CASING, EVENTS, FORMATIONS, HAZARDS, MUD, OFFSET_ROWS, PLANNED, formationAt, topsFor, wellById, wellShoeShift } from "@/lib/data";

const PX = 0.19;
const TOP = 74;
const AX = 54;
const COLW = 240;
const MW = 40; // mud track
const BX = 50; // body offset in column
const BW = 100;
const TG = 158; // tag offset
const H = 3700 * PX + TOP + 24;
const HEX: Record<string, string> = { mudloss: "#33b1ff", stuck: "#ff832b", kick: "#ff7eb6", torque: "#f1c21b", cement: "#3ddbd9", fishing: "#a8a8a8" };
const SHORT: Record<string, string> = { mudloss: "Loss", stuck: "Stuck", kick: "Kick", torque: "Torque", cement: "Cement", fishing: "Fish" };
const LITH: Record<string, string> = { dhk: "clay", nam: "sand", tip: "sand", gir: "clay", bar: "shale", kop: "shale", syl: "lime" };
const STRING_W = [36, 26, 17];

const pp = (d: number) => 1.03 + 0.00016 * d + (d > 3150 ? 0.16 : 0) + (d > 2380 && d < 2440 ? 0.03 : 0);
const fg = (d: number) => 1.42 + 0.00022 * d;
const mwAt = (d: number) => (MUD.find((m) => d >= m.top && d < m.base) ?? MUD[MUD.length - 1]).mw;

function Ladder() {
  const sp = useSearchParams();
  const { openEvidence } = useApp();
  const ids = (sp.get("ids")?.split(",").filter(Boolean) ?? OFFSET_ROWS.slice(0, 4).map((w) => w.id)).slice(0, 4);
  const cols = useMemo(() => [PLANNED.id, ...ids], [ids.join()]);
  const [layers, setLayers] = useState({ form: true, casing: true, cement: true, mud: true, events: true, ties: true });
  const [cur, setCur] = useState<number | null>(null);
  const W = AX + cols.length * COLW + 8;
  const y = (d: number) => TOP + d * PX;
  const label: Record<string, string> = { form: "Formations", casing: "Casing", cement: "Cement", mud: "Mud window", events: "Events", ties: "Tie lines" };

  const topsByCol = cols.map((id) => topsFor(id));

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Casing · cement · mud</h1>
          <p>DEMO-P1 beside {ids.length} offsets on one TVDSS axis. Tie lines follow formation tops between wells. Hover for a depth cursor; click an event tag for its evidence.</p>
        </div>
        <div className="row" data-tour="l-layers" style={{ gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(Object.keys(layers) as (keyof typeof layers)[]).map((k) => (
            <Toggle key={k} id={`t-${k}`} size="sm" labelText={label[k]} hideLabel={false} labelA="" labelB="" toggled={layers[k]} onToggle={(v) => setLayers({ ...layers, [k]: v })} />
          ))}
        </div>
      </div>
      <div className="panel" data-tour="l-plot" style={{ overflow: "auto", maxHeight: "calc(100vh - 13rem)", padding: 10 }}>
        <svg width={W} height={H} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const yy = e.clientY - r.top; setCur(yy > TOP ? (yy - TOP) / PX : null); }} onMouseLeave={() => setCur(null)}>
          <defs>
            <linearGradient id="metal" x1="0" x2="1"><stop offset="0" stopColor="#5b6168" /><stop offset="0.45" stopColor="#c9ced2" /><stop offset="1" stopColor="#575c62" /></linearGradient>
            <linearGradient id="bore" x1="0" x2="1"><stop offset="0" stopColor="#050607" /><stop offset="0.5" stopColor="#141a1c" /><stop offset="1" stopColor="#050607" /></linearGradient>
            <pattern id="pt-sand" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="var(--ink3)" /><circle cx="6.5" cy="6" r="0.7" fill="var(--ink3)" /></pattern>
            <pattern id="pt-clay" width="12" height="7" patternUnits="userSpaceOnUse"><path d="M1 2h5M7 5.5h4" stroke="var(--ink3)" strokeWidth="0.8" /></pattern>
            <pattern id="pt-shale" width="14" height="5" patternUnits="userSpaceOnUse"><path d="M0 1.5h14M3 4h7" stroke="var(--ink3)" strokeWidth="0.6" /></pattern>
            <pattern id="pt-lime" width="16" height="9" patternUnits="userSpaceOnUse"><path d="M0 0.5h16M0 5h16M4 0.5v4.5M12 5v4" stroke="var(--ink3)" strokeWidth="0.6" fill="none" /></pattern>
            <pattern id="pt-coal" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#0a0a0a" /><circle cx="2" cy="2" r="0.5" fill="#555" /><circle cx="5" cy="4.5" r="0.4" fill="#444" /></pattern>
            <pattern id="pt-cem" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#7f8a94" fillOpacity="0.18" /><line x1="0" y1="0" x2="0" y2="6" stroke="#aeb7bf" strokeWidth="1.6" /></pattern>
          </defs>

          {/* axis */}
          {Array.from({ length: 38 }, (_, i) => i * 100).map((d) => (
            <g key={d}>
              <line x1={AX - 8} x2={W} y1={y(d)} y2={y(d)} stroke="var(--line)" strokeWidth={d % 500 === 0 ? 0.9 : 0.35} />
              {d % 200 === 0 && <text x={AX - 12} y={y(d) + 3} fontSize={10} textAnchor="end">{d}</text>}
            </g>
          ))}
          <text x={4} y={TOP - 6} fontSize={9}>TVDSS m</text>

          {/* tie lines between adjacent columns */}
          {layers.ties && layers.form && cols.slice(0, -1).map((_, ci) =>
            FORMATIONS.slice(1).map((f, fi) => {
              const a = topsByCol[ci][fi + 1].top, b = topsByCol[ci + 1][fi + 1].top;
              const x1 = AX + ci * COLW + BX + BW, x2 = AX + (ci + 1) * COLW + BX;
              const mx = (x1 + x2) / 2;
              return <path key={`${ci}-${f.id}`} d={`M${x1},${y(a)} C${mx},${y(a)} ${mx},${y(b)} ${x2},${y(b)}`} fill="none" stroke={f.color} strokeOpacity={0.55} strokeWidth={1} strokeDasharray="3 3" />;
            }),
          )}

          {cols.map((id, ci) => {
            const w = wellById(id)!;
            const x0 = AX + ci * COLW;
            const bx = x0 + BX + BW / 2;
            const tops = topsByCol[ci];
            const sh = wellShoeShift(id);
            const bar = tops[4];
            const coal = [bar.top + 0.069 * (bar.base - bar.top), bar.top + 0.103 * (bar.base - bar.top)];
            const loss = [bar.top + 0.125 * (bar.base - bar.top), bar.top + 0.163 * (bar.base - bar.top)];
            const evs = EVENTS.filter((e) => e.wellId === id).sort((a, b) => a.tvd - b.tvd);
            let lastY = -99;
            const placed = evs.map((e) => { const yy = Math.max(y(e.tvd), lastY + 16); lastY = yy; return { e, yy }; });
            return (
              <motion.g key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}>
                {/* header */}
                <text x={x0 + BX + BW / 2} y={20} fontSize={13} textAnchor="middle" style={{ fill: "var(--ink)", fontWeight: 600 }}>{w.name}</text>
                <text x={x0 + BX + BW / 2} y={34} fontSize={9} textAnchor="middle">{id === "demo-p1" ? "planned · drilling" : `spud ${w.spud} · TD ${w.td}`}</text>
                <text x={x0 + BX + BW / 2} y={46} fontSize={9} textAnchor="middle">{`incl ${w.inc}° · az ${w.az}°`}</text>
                <text x={x0 + MW / 2} y={TOP - 6} fontSize={8} textAnchor="middle">mud sg</text>

                {/* formations */}
                {layers.form && tops.map((f) => (
                  <g key={f.id}>
                    <rect x={x0 + BX} y={y(f.top)} width={BW} height={(f.base - f.top) * PX} fill={f.color} fillOpacity={0.28} />
                    <rect x={x0 + BX} y={y(f.top)} width={BW} height={(f.base - f.top) * PX} fill={`url(#pt-${LITH[f.id]})`} />
                    <line x1={x0 + BX} x2={x0 + BX + BW} y1={y(f.top)} y2={y(f.top)} stroke="var(--ink2)" strokeWidth={0.6} />
                    {ci === 0 && <text x={x0 + BX + 3} y={y(f.top) + 10} fontSize={8.5} style={{ fill: "var(--ink)" }}>{f.name}</text>}
                  </g>
                ))}
                {layers.form && <>
                  <rect x={x0 + BX} y={y(coal[0])} width={BW} height={(coal[1] - coal[0]) * PX} fill="url(#pt-coal)" />
                  <rect x={x0 + BX} y={y(loss[0])} width={BW} height={(loss[1] - loss[0]) * PX} fill="url(#pt-sand)" />
                  <rect x={x0 + BX} y={y(loss[0])} width={BW} height={(loss[1] - loss[0]) * PX} fill="#33b1ff" fillOpacity={0.16} />
                </>}
                {!layers.form && <rect x={x0 + BX} y={y(0)} width={BW} height={3700 * PX} fill="var(--bg2)" stroke="var(--line2)" />}
                <rect x={x0 + BX} y={y(0)} width={BW} height={3700 * PX} fill="none" stroke="var(--line2)" />

                {/* cement */}
                {layers.cement && CASING.map((c, k) => (
                  <rect key={c.size} x={bx - STRING_W[k] / 2 - 8} y={y(c.cementTop + sh)} width={STRING_W[k] + 16} height={(c.shoe - c.cementTop) * PX} fill="url(#pt-cem)" stroke="#aeb7bf" strokeOpacity={0.35} strokeWidth={0.5} />
                ))}

                {/* casing: nested steel pipes, bore shaded by mud */}
                {layers.casing && CASING.map((c, k) => {
                  const wdt = STRING_W[k];
                  const top = k === 2 ? 2900 + sh : 0;
                  const bot = c.shoe + sh;
                  return (
                    <g key={c.size}>
                      <rect x={bx - wdt / 2} y={y(top)} width={wdt} height={(bot - top) * PX} fill="url(#bore)" />
                      <rect x={bx - wdt / 2} y={y(top)} width={3.2} height={(bot - top) * PX} fill="url(#metal)" />
                      <rect x={bx + wdt / 2 - 3.2} y={y(top)} width={3.2} height={(bot - top) * PX} fill="url(#metal)" />
                      <path d={`M${bx - wdt / 2 - 1},${y(bot)} h${wdt + 2} l-3,6 h-${wdt - 4} z`} fill="#ff5b5b" />
                      <text x={bx + wdt / 2 + 3} y={y(bot) + 4} fontSize={8}>{c.size}</text>
                    </g>
                  );
                })}
                {layers.casing && <rect x={bx - 2} y={y(3150 + sh)} width={4} height={(w.td - 3150 - sh) * PX} fill="#050607" stroke="#3a3f45" strokeWidth={0.5} />}
                {layers.casing && <text x={bx} y={y(w.td) + 11} fontSize={8} textAnchor="middle">TD</text>}

                {/* mud window */}
                {layers.mud && (
                  <g>
                    <rect x={x0} y={y(0)} width={MW} height={3700 * PX} fill="var(--bg2)" stroke="var(--line)" />
                    {(() => {
                      const sx = (v: number) => x0 + 2 + ((v - 1.0) / 0.9) * (MW - 4);
                      const ds = Array.from({ length: 38 }, (_, i) => i * 100);
                      const poly = ds.map((d) => `${sx(pp(d))},${y(d)}`).join(" ") + " " + [...ds].reverse().map((d) => `${sx(fg(d))},${y(d)}`).join(" ");
                      return (
                        <>
                          <polygon points={poly} fill="var(--accent)" fillOpacity={0.12} />
                          <polyline points={ds.map((d) => `${sx(pp(d))},${y(d)}`).join(" ")} fill="none" stroke="#33b1ff" strokeWidth={1} />
                          <polyline points={ds.map((d) => `${sx(fg(d))},${y(d)}`).join(" ")} fill="none" stroke="#ff5b5b" strokeWidth={1} strokeDasharray="2 2" />
                          <polyline points={ds.flatMap((d) => [`${sx(mwAt(d) + (ci - 1) * 0.005)},${y(d)}`, `${sx(mwAt(d + 100) + (ci - 1) * 0.005)},${y(d + 100)}`]).join(" ")} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* events */}
                {layers.events && placed.map(({ e, yy }) => (
                  <g key={e.id} style={{ cursor: "pointer" }} onClick={() => openEvidence({ title: `${w.name} · ${HAZARDS.find((h) => h.id === e.type)?.label ?? "Fishing / other NPT"}`, subtitle: `${e.tvd} m TVDSS`, events: [e] })}>
                    <path d={`M${x0 + BX + BW},${y(e.tvd)} L${x0 + TG - 4},${yy}`} stroke={HEX[e.type]} strokeWidth={0.9} fill="none" />
                    <circle cx={x0 + BX + BW} cy={y(e.tvd)} r={2.6} fill={HEX[e.type]} />
                    <rect x={x0 + TG} y={yy - 7.5} width={72} height={15} rx={7.5} fill="var(--panel2)" stroke={HEX[e.type]} strokeWidth={0.9} />
                    <circle cx={x0 + TG + 8} cy={yy} r={3} fill={HEX[e.type]} />
                    <text x={x0 + TG + 15} y={yy + 3} fontSize={8.5} style={{ fill: "var(--ink)" }}>{SHORT[e.type]} {e.tvd}</text>
                  </g>
                ))}
              </motion.g>
            );
          })}

          {cur != null && (
            <g pointerEvents="none">
              <line x1={AX - 8} x2={W} y1={y(cur)} y2={y(cur)} stroke="var(--accent)" strokeWidth={1} />
              <rect x={2} y={y(cur) - 9} width={AX - 10} height={18} rx={4} fill="var(--accent)" />
              <text x={AX - 14} y={y(cur) + 4} textAnchor="end" fontSize={10} style={{ fill: "var(--accent-ink)" }}>{Math.round(cur)}</text>
              <text x={AX + 4} y={y(cur) - 4} fontSize={10} style={{ fill: "var(--accent)" }}>{formationAt(cur).name}</text>
            </g>
          )}
        </svg>
        <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 14, fontSize: 11, color: "var(--ink2)" }}>
          {HAZARDS.map((h) => <span key={h.id} className="row" style={{ gap: 5 }}><i style={{ width: 8, height: 8, borderRadius: "50%", background: HEX[h.id], display: "inline-block" }} />{h.label}</span>)}
          <span>▮ coal seam</span><span>⁘ loss-prone sand</span><span style={{ color: "#33b1ff" }}>— pore pressure</span><span style={{ color: "#ff5b5b" }}>┈ fracture</span><span>▬ mud weight</span>
          <span className="eyebrow">hatched ribbon = cement to top · red shoe = casing shoe</span>
        </div>
      </div>
    </>
  );
}

export default function LadderPage() {
  return <Suspense fallback={<div className="empty">Loading ladder…</div>}><Ladder /></Suspense>;
}
