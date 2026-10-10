"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button, Checkbox, Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, Toggle, Toggletip, ToggletipButton, ToggletipContent } from "@carbon/react";
import { Compare, Information } from "@carbon/icons-react";
import { OffsetMap } from "@/components/OffsetMap";
import { HazardChip, relColor } from "@/components/ui";
import { useApp } from "@/components/AppProvider";
import { OFFSET_ROWS, fmt, type Hazard } from "@/lib/data";

const Well3D = dynamic(() => import("@/components/Well3D"), { ssr: false });

export default function Offsets() {
  const router = useRouter();
  const sp = useSearchParams();
  const { dark } = useApp();
  const [radius, setRadius] = useState(8);
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [view, setView] = useState<"map" | "3d">("map");
  const [showEv, setShowEv] = useState(true);
  useEffect(() => { setView(sp.get("view") === "3d" ? "3d" : "map"); }, [sp]);
  const rows = OFFSET_ROWS.filter((w) => w.distKm <= radius);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Offset map</h1>
          <p>{rows.length} offsets within {radius} km of DEMO-P1, ranked by how close their real paths run through the target section. Tick up to four to compare.</p>
        </div>
        <div className="row" style={{ gap: 18 }}>
          <div data-tour="o-radius" style={{ width: 240 }}><Slider id="r2" labelText={`Radius · ${radius} km`} hideTextInput min={1} max={20} step={1} value={radius} onChange={({ value }) => setRadius(value)} /></div>
          <span data-tour="o-compare"><Button renderIcon={Compare} disabled={picked.length < 2} onClick={() => router.push(`/planning/demo-p1/ladder?ids=${picked.join(",")}`)}>Compare {picked.length ? `(${picked.length})` : ""}</Button></span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)", gap: 14 }}>
        <div data-tour="o-view">
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="seg">
              <button className={view === "map" ? "on" : ""} onClick={() => setView("map")}>Plan map</button>
              <button className={view === "3d" ? "on" : ""} onClick={() => setView("3d")}>3D wells</button>
            </div>
            {view === "3d" && <Toggle id="ev3d" size="sm" labelText="" labelA="Events off" labelB="Events on" toggled={showEv} onToggle={setShowEv} />}
          </div>
          {view === "map" ? (
            <OffsetMap radiusKm={radius} hoverId={hover} onHover={setHover} selectedIds={picked} onSelect={toggle} height={580} />
          ) : (
            <div style={{ height: 580 }}><Well3D dark={dark} hoverId={hover} onHover={setHover} onSelect={toggle} selectedIds={picked} showEvents={showEv} showFormations /></div>
          )}
        </div>
        <div className="panel" data-tour="o-table" style={{ padding: 0, overflow: "auto", maxHeight: 620 }}>
          <Table size="sm" stickyHeader>
            <TableHead>
              <TableRow>
                <TableHeader />
                <TableHeader>Well</TableHeader><TableHeader>km</TableHeader><TableHeader>Sep m</TableHeader><TableHeader>Relevance</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((w, i) => (
                <TableRow key={w.id} onMouseEnter={() => setHover(w.id)} onMouseLeave={() => setHover(null)} style={{ background: hover === w.id ? "var(--panel2)" : undefined }}>
                  <TableCell style={{ width: 32 }}><Checkbox id={`c-${w.id}`} labelText="" hideLabel checked={picked.includes(w.id)} onChange={() => toggle(w.id)} disabled={!picked.includes(w.id) && picked.length >= 4} /></TableCell>
                  <TableCell style={{ minWidth: 150 }}>
                    <b style={{ whiteSpace: "nowrap" }}>{w.name}</b> <span className="eyebrow mono">#{i + 1}</span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {(["mudloss", "stuck", "kick", "torque", "cement"] as Hazard[]).filter((h) => w.counts[h] > 0).map((h) => <HazardChip key={h} id={h} count={w.counts[h]} compact />)}
                    </div>
                  </TableCell>
                  <TableCell className="mono">{w.distKm.toFixed(1)}</TableCell>
                  <TableCell className="mono">{fmt(w.sep)}</TableCell>
                  <TableCell style={{ minWidth: 118 }}>
                    <div className="row" style={{ gap: 6 }} data-tour={i === 0 ? "o-rel" : undefined}>
                      <div className="mini-bar" style={{ flex: 1 }}><i style={{ width: `${w.relevance * 100}%`, background: relColor(w.relevance) }} /></div>
                      <span className="mono" style={{ fontSize: 12 }}>{w.relevance.toFixed(2)}</span>
                      <Toggletip align="left">
                        <ToggletipButton label="Relevance breakdown"><Information size={14} /></ToggletipButton>
                        <ToggletipContent>
                          <p style={{ fontWeight: 600, marginBottom: 6 }}>Why {w.name} ranks here</p>
                          {([["3D path proximity ×0.40", w.sub.path], ["Shared formations ×0.25", w.sub.formations], ["Recency ×0.15", w.sub.recency], ["Event density ×0.20", w.sub.events]] as const).map(([l, v]) => (
                            <div key={l} style={{ marginBottom: 6 }}><div style={{ fontSize: 12 }}>{l} <b className="mono">{v.toFixed(2)}</b></div><div className="mini-bar"><i style={{ width: `${v * 100}%`, background: "var(--accent)" }} /></div></div>
                          ))}
                        </ToggletipContent>
                      </Toggletip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={5}><div className="empty">No offsets inside {radius} km. Widen the radius to 4 km.</div></TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="eyebrow" style={{ marginTop: 12 }}>
        <Tag type="gray" size="sm">1 restricted offset also contributes</Tag> &nbsp;Scores use every relevant offset; details you are not cleared for stay hidden.
      </div>
    </>
  );
}
