"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, Toggle } from "@carbon/react";
import { AnimatePresence, motion } from "framer-motion";
import { FlyBrain } from "@/components/FlyBrain";
import { LIBRARY, NOVELTY } from "@/lib/flyhash";

export default function Patterns() {
  const [brain, setBrain] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("brain") === "1") setBrain(true); }, []);
  const inc = LIBRARY.filter((l) => l.incident).length;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Deja-vu Engine &amp; Immune Watch</h1>
          <p>Does right now look like the lead-up to trouble we have seen? Deja-vu matches live windows to past incidents (FlyHash). Immune Watch flags behaviour that is unlike anything normal for this rig state.</p>
        </div>
        <span data-tour="p-toggle"><Toggle id="brain" labelText="How the fly brain thinks" labelA="Off" labelB="On" toggled={brain} onToggle={setBrain} /></span>
      </div>

      <AnimatePresence initial={false}>
        {brain && (
          <motion.div key="brain" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: [0.2, 0, 0.38, 0.9] }} style={{ overflow: "hidden", marginBottom: 16 }}>
            <div className="panel">
              <h3>Inside the Deja-vu Engine <Tag type="purple" size="sm">bio-inspired · Drosophila olfactory circuit</Tag></h3>
              <FlyBrain />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid-2" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <div className="panel" data-tour="p-table">
          <h3>Deja-vu · 10 nearest historical windows <Tag type="red" size="sm">{inc} of 10 preceded an incident</Tag></h3>
          <Table size="md">
            <TableHead><TableRow><TableHeader>Offset well</TableHeader><TableHeader>Depth</TableHeader><TableHeader>Overlap (Jaccard)</TableHeader><TableHeader>What followed</TableHeader></TableRow></TableHead>
            <TableBody>
              {LIBRARY.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} style={{ background: l.incident ? "color-mix(in srgb, var(--tier-warning) 8%, transparent)" : undefined }}>
                  <TableCell><b>{l.well}</b></TableCell>
                  <TableCell className="mono">{l.depth} m</TableCell>
                  <TableCell style={{ minWidth: 140 }}><div className="row" style={{ gap: 8 }}><div className="mini-bar" style={{ flex: 1 }}><i style={{ width: `${l.j * 100}%`, background: l.incident ? "var(--tier-warning)" : undefined }} /></div><span className="mono">{l.j.toFixed(2)}</span></div></TableCell>
                  <TableCell>{l.incident ? <Tag type="red" size="sm">{l.followed}</Tag> : <Tag type="gray" size="sm">No incident within 2 h</Tag>}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          <p className="eyebrow" style={{ marginTop: 8 }}>Rule: Caution when 6 or more of the 10 nearest windows preceded an incident within 2 h. Matches link back to their offset episodes.</p>
        </div>

        <div className="panel" data-tour="p-immune">
          <h3>Immune Watch · novelty by rig state</h3>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Negative selection: detectors that fire on anything unlike verified-normal drilling. Low priority unless corroborated.</p>
          {NOVELTY.map((n, i) => (
            <div key={n.state} style={{ marginBottom: 14 }}>
              <div className="row"><span style={{ fontSize: 13 }}>{n.state}</span><span className="spacer" /><span className="mono">{n.score.toFixed(2)}</span></div>
              <div className="mini-bar" style={{ height: 10 }}>
                <motion.i initial={{ width: 0 }} animate={{ width: `${n.score * 100}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }} style={{ background: n.score > 0.3 ? "var(--tier-caution)" : "var(--cds-interactive)" }} />
              </div>
            </div>
          ))}
          <Tag type="gray" size="sm">Reaming novelty 0.38 — corroborated by Deja-vu match, so surfaced</Tag>
        </div>
      </div>
    </>
  );
}
