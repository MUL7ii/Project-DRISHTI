"use client";

import { Play, Pause, Restart } from "@carbon/icons-react";
import { useApp } from "./AppProvider";
import { D0, D_END } from "@/lib/telemetry";

// A transport strip, like the front of a tape deck.
export function ReplayBar() {
  const { playing, setPlaying, speed, setSpeed, restart, depth, ended } = useApp();
  const pct = ((depth - D0) / (D_END - D0)) * 100;
  return (
    <div className="panel row" data-tour="v-replay" style={{ padding: "8px 14px", marginBottom: 12, gap: 14 }}>
      <span className="hz" style={{ ["--c" as string]: "#b58cff", color: "#b58cff", borderColor: "#b58cff66" }}>replay · compressed</span>
      <button className={`chip-btn ${playing ? "on" : ""}`} onClick={() => setPlaying(!playing)} disabled={ended} style={{ minWidth: 92, justifyContent: "center" }}>
        {playing ? <Pause size={14} /> : <Play size={14} />}{playing ? "Pause" : ended ? "Finished" : depth > D0 ? "Resume" : "Play"}
      </button>
      <button className="chip-btn" onClick={restart}><Restart size={14} />Restart</button>
      <div className="seg" aria-label="Speed">
        {[1, 2, 5, 10, 30, 60].map((s) => <button key={s} className={speed === s ? "on" : ""} onClick={() => setSpeed(s)}>{s}×</button>)}
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div className="mini-bar" style={{ height: 6 }}><i style={{ width: `${pct}%`, background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} /></div>
        <div className="eyebrow mono" style={{ marginTop: 3, fontSize: 10 }}>{D0} → {D_END} m · synthetic Upper Assam data</div>
      </div>
    </div>
  );
}
