"use client";

import { useState } from "react";
import { Button, Checkbox, Modal, TextInput, Tag } from "@carbon/react";
import { DocumentExport } from "@carbon/icons-react";
import { motion } from "framer-motion";
import { useApp } from "@/components/AppProvider";
import { HazardGlyph } from "@/components/icons";
import { HAZARDS, RISK_INTERVALS, RISK_REGISTER, eventsNear, type Hazard } from "@/lib/data";
import { can } from "@/lib/rbac";

const LABEL = ["Low", "Med", "High", "V.high"];

export default function Risk() {
  const { openEvidence, role, pushToast } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({ 3: "Plan lube pill + reduced WOB before coal. Geologist to confirm coal top ±15 m.", 4: "LCM 15 ppb pill ready before entering sand." });
  const [reviewed, setReviewed] = useState<Record<number, boolean>>({});
  const [modal, setModal] = useState(false);

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Risk register</h1>
          <p>Depth interval × hazard for DEMO-P1. Each cell shows the risk level and how many offsets support it. Hatched cells mean insufficient evidence, not low risk.</p>
        </div>
        {can(role, "review", "export") && <span data-tour="r-gen"><Button renderIcon={DocumentExport} onClick={() => setModal(true)}>Generate Offset Well Review</Button></span>}
      </div>
      <div className="panel">
        <div className="heat" data-tour="r-grid">
          <div className="heat__h">Interval (m TVDSS)</div>
          {HAZARDS.map((h) => (
            <div key={h.id} className="heat__h" style={{ ["--c" as string]: h.css }}><HazardGlyph kind={h.id} />{h.label}</div>
          ))}
          <div className="heat__h">Notes &amp; mitigation</div>
          {RISK_INTERVALS.map((iv, ri) => (
            <div key={ri} style={{ display: "contents" }}>
              <div className="heat__row">{iv.top}–{iv.base}</div>
              {HAZARDS.map((h, hi) => {
                const c = RISK_REGISTER[h.id as Hazard][ri];
                const key = `${ri}-${h.id}`;
                return (
                  <motion.button key={h.id} className={`cell ${c ? `cell--l${c.level}` : "cell--na"} ${sel === key ? "cell--sel" : ""}`}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ri * 0.03 + hi * 0.02 }}
                    aria-label={c ? `${h.label} ${LABEL[c.level]} ${c.n} of 14 offsets` : `${h.label} insufficient evidence`}
                    onClick={() => {
                      setSel(key);
                      openEvidence({
                        title: `${h.label} · ${iv.top}–${iv.base} m`, subtitle: c ? `${LABEL[c.level]} risk · supported by ${c.n} of 14 offsets` : "Insufficient evidence — fewer than 3 offsets with events here",
                        events: eventsNear(h.id, iv.top, iv.base), drivers: c?.drivers,
                        note: "1 restricted offset also contributes to this score but is not shown.",
                      });
                    }}>
                    {c ? <><b>{LABEL[c.level]}</b><span>{c.level === 0 ? "no events nearby" : c.n + " of 14 offsets"}</span></> : <><b>Insufficient</b><span>&lt; 3 offsets</span></>}
                  </motion.button>
                );
              })}
              <div className="row" data-tour={ri === 3 ? "r-notes" : undefined} style={{ padding: "2px 4px", gap: 6 }}>
                <Checkbox id={`rv-${ri}`} labelText="" hideLabel checked={!!reviewed[ri]} onChange={(_, { checked }) => setReviewed({ ...reviewed, [ri]: checked })} />
                <TextInput id={`nt-${ri}`} size="sm" labelText="Note" hideLabel placeholder="Add note or mitigation" value={notes[ri] ?? ""} readOnly={!can(role, "review", "edit")} onChange={(e) => setNotes({ ...notes, [ri]: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, gap: 12, flexWrap: "wrap" }}>
          {LABEL.map((l, i) => <span key={l} className="row" style={{ gap: 6, fontSize: 12 }}><i style={{ width: 14, height: 14, background: `var(--risk-${i})`, display: "inline-block" }} />{l}</span>)}
          <span className="row" style={{ gap: 6, fontSize: 12 }}><i className="cell--na" style={{ width: 14, height: 14, display: "inline-block" }} />Insufficient evidence</span>
          <Tag type="gray" size="sm">1 restricted offset also contributes</Tag>
        </div>
      </div>
      <Modal open={modal} modalHeading="Submit Offset Well Review" primaryButtonText="Submit to superintendent" secondaryButtonText="Cancel" onRequestClose={() => setModal(false)}
        onRequestSubmit={() => { setModal(false); pushToast({ kind: "success", title: "Offset Well Review submitted", subtitle: "Sent to D. Das for approval. Approval locks it as the Live baseline." }); }}>
        <p>The PDF (light theme) includes ranked offsets, the ladder snapshot, this risk register with your notes, and published lessons.</p>
        <p style={{ marginTop: 8 }} className="eyebrow">Once approved, this version becomes the Live Mode baseline for DEMO-P1.</p>
      </Modal>
    </>
  );
}
