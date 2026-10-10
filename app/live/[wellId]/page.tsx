"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ReplayBar } from "@/components/ReplayBar";
import { Tracks } from "@/components/Tracks";
import { LookAhead } from "@/components/LookAhead";
import { AlertCard } from "@/components/AlertCard";
import { useApp } from "@/components/AppProvider";
import { PATHS, formationAt, nextFormation } from "@/lib/data";
import { frameAt } from "@/lib/telemetry";
import { TIER_ORDER } from "@/lib/alerts";

const Well3D = dynamic(() => import("@/components/Well3D"), { ssr: false });

function mdAt(tvd: number) {
  const s = PATHS["demo-p1"];
  const i = Math.max(1, s.findIndex((x) => x.tvd >= tvd));
  const a = s[i - 1], b = s[i];
  return a.md + ((tvd - a.tvd) / (b.tvd - a.tvd || 1)) * (b.md - a.md);
}

export default function Cockpit() {
  const { depth, triggered, units, dark, role, playing } = useApp();
  const [view, setView] = useState<"tracks" | "3d">("tracks");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("view") === "3d") setView("3d"); }, []);
  const f = frameAt(depth);
  const fm = formationAt(depth);
  const nx = nextFormation(depth);
  const u = (m: number) => (units === "metric" ? [Math.round(m).toLocaleString("en"), "m"] : [Math.round(m * 3.28084).toLocaleString("en"), "ft"]);
  const [md, mdU] = u(mdAt(depth));
  const [tvd] = u(depth);
  const ropv = units === "metric" ? f.rop.toFixed(1) : (f.rop * 3.28084).toFixed(0);
  const latest = [...triggered].sort((a, b) => b.triggerDepth - a.triggerDepth).slice(0, 3);
  const [nxd] = nx ? u(nx.top - depth) : ["—"];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Cockpit</h1>
          <p>What is under the bit, and does now look like past trouble. Advisory only: eRTMAC alarms stay authoritative.</p>
        </div>
        <span className="hz" style={{ ["--c" as string]: "var(--accent)" }}>{f.state.toLowerCase()}</span>
      </div>
      <ReplayBar />
      <div className="kpis" data-tour="v-kpis">
        <div className="kpi"><div className="kpi__label">Bit depth MD</div><div className="kpi__value mono" data-ghost="88,888">{md}<span className="kpi__unit">{mdU}</span></div><div className="kpi__sub mono">TVD {tvd} {mdU}</div></div>
        <div className="kpi"><div className="kpi__label">ROP</div><div className="kpi__value mono" data-ghost="88.8">{ropv}<span className="kpi__unit">{units === "metric" ? "m/h" : "ft/h"}</span></div><div className="kpi__sub">{f.rop < 15 ? "dropping" : "steady"}</div></div>
        <div className="kpi"><div className="kpi__label">Rig state</div><div className="kpi__value sm">{f.state}</div><div className="kpi__sub">WOB {f.wob.toFixed(0)} kN · {f.rpm.toFixed(0)} rpm</div></div>
        <div className="kpi"><div className="kpi__label">Formation</div><div className="kpi__value sm">{fm.name}</div><div className="kpi__sub">{fm.lith}</div></div>
        <div className="kpi"><div className="kpi__label">Next</div><div className="kpi__value sm">{nx?.name ?? "TD"}</div><div className="kpi__sub mono">in {nxd} {mdU} ± 12 {mdU}</div></div>
        <div className="kpi"><div className="kpi__label">Data</div><div className="kpi__value sm">{playing ? "0.4 s" : "paused"}</div><div className="kpi__sub">eRTMAC replay · frame OK</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="seg">
              <button className={view === "tracks" ? "on" : ""} onClick={() => setView("tracks")}>Depth tracks</button>
              <button className={view === "3d" ? "on" : ""} onClick={() => setView("3d")}>3D well</button>
            </div>
            <span className="eyebrow">depth runs downward · shaded bands are projected hazard intervals</span>
          </div>
          <div className="panel" data-tour="v-tracks" style={{ padding: view === "tracks" ? 8 : 0, height: 500, overflow: "hidden" }}>
            {view === "tracks" ? <Tracks depth={depth} /> : <Well3D dark={dark} bitTvd={depth} showFormations showEvents={false} />}
          </div>
        </div>
        <LookAhead depth={depth} />
      </div>

      <div className="row" style={{ margin: "18px 0 8px" }}>
        <h3 style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink2)", fontWeight: 500 }}>Latest alerts</h3>
        <span className="spacer" />
        <Link href="/live/demo-p1/alerts" style={{ color: "var(--accent)", fontSize: 13 }}>Open alert feed →</Link>
      </div>
      <div data-tour="v-alerts">
        {latest.length === 0 ? (
          <div className="panel empty">Nothing yet. Press Play; advisories appear when offsets saw trouble ahead.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, latest.length)}, 1fr)`, gap: 12 }}>
            {[...latest].sort((a, b) => TIER_ORDER[b.tier] - TIER_ORDER[a.tier]).map((a) => <AlertCard key={a.id} def={a} compact />)}
          </div>
        )}
      </div>
      {role === "CON" && <p className="eyebrow" style={{ marginTop: 12 }}>Restricted contractor view · assigned well only · watermark on · documents and exports hidden.</p>}
    </>
  );
}
