"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Modal, TextArea, Tag } from "@carbon/react";
import { Checkmark, Edit, ArrowUp, Launch } from "@carbon/icons-react";
import { motion } from "framer-motion";
import { useApp } from "./AppProvider";
import { TierBadge, HazardChip } from "./ui";
import { can } from "@/lib/rbac";
import { wellById } from "@/lib/data";
import type { AlertDef } from "@/lib/alerts";

export function AlertCard({ def, compact = false }: { def: AlertDef; compact?: boolean }) {
  const { depth, alertState, actOnAlert, openEvidence, role, pushToast } = useApp();
  const st = alertState[def.id]?.status ?? "open";
  const [modal, setModal] = useState<null | "ack" | "note" | "esc">(null);
  const [note, setNote] = useState("");
  const dist = Math.max(0, Math.round(def.top - depth));
  const restricted = role === "CON";
  const acts = can(role, "alert", "acknowledge");
  const wells = new Set(def.evidence.map((e) => e.wellId)).size;

  return (
    <motion.div data-tour="a-card" className={`alert-card ${def.tier === "warning" && st === "open" ? "alert-card--warning" : ""}`} style={{ ["--tc" as string]: `var(--tier-${def.tier})` }}
      initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.28 }} layout>
      <div className="row" style={{ gap: 10 }}>
        <TierBadge tier={def.tier} />
        <HazardChip id={def.hazard} />
        <span className="spacer" />
        {st !== "open" && <Tag type={st === "escalated" ? "red" : "green"} size="sm">{st === "escalated" ? "escalated" : "acknowledged"}</Tag>}
        <span className="alert-card__meta mono">{dist > 0 ? `${dist} m ahead of bit` : "at / past bit"}</span>
      </div>
      <h4>{def.title}</h4>
      <div className="alert-card__meta">{wells} offsets · {def.evidence.length} events · {def.hazard === "pattern" ? "FlyHash v1.0" : "LightGBM v0.3"}</div>

      {!compact && (
        <>
          <div className="eyebrow" style={{ marginTop: 12 }}>Why it fired</div>
          <ul>{def.why.map((w) => <li key={w}>{w}</li>)}</ul>
          <div className="eyebrow">What the offsets saw</div>
          <ul>
            {def.evidence.slice(0, 5).map((e) => (
              <li key={e.id}>
                <b style={{ color: "var(--ink)" }}>{wellById(e.wellId)?.name}</b> · {e.tvd} m · NPT {e.npt} h — {e.action}
                {!restricted && <> · <Link href={`/documents/${e.docId}?line=${e.line}`} style={{ color: "var(--accent)" }}>source</Link></>}
              </li>
            ))}
          </ul>
          <div className="eyebrow">What they did about it (advisory)</div>
          <ul>{def.recs.map((r) => <li key={r.action}><b style={{ color: "var(--ink)" }}>{r.action}</b> — {r.outcome} <span className="eyebrow">({r.src})</span></li>)}</ul>
          {alertState[def.id]?.note && <p className="eyebrow">Annotation: “{alertState[def.id].note}”</p>}
        </>
      )}

      <div className="row" data-tour="a-actions" style={{ marginTop: 8, flexWrap: "wrap" }}>
        <Button size="sm" kind="tertiary" renderIcon={Launch} onClick={() => openEvidence({ title: def.title, subtitle: `${def.top}–${def.base} m`, events: def.evidence, drivers: def.why.slice(-1) })}>Open evidence</Button>
        {acts && st === "open" && (
          <>
            <Button size="sm" renderIcon={Checkmark} onClick={() => setModal("ack")}>Acknowledge</Button>
            <Button size="sm" kind="secondary" renderIcon={Edit} onClick={() => setModal("note")}>Annotate</Button>
            {can(role, "alert", "escalate") && <Button size="sm" kind="danger--tertiary" renderIcon={ArrowUp} onClick={() => setModal("esc")}>Escalate</Button>}
          </>
        )}
        {restricted && <span className="eyebrow">Advisory view — actions and documents are not available to contractors.</span>}
      </div>

      <Modal size="sm" open={modal === "ack"} modalHeading={def.tier === "warning" ? "Confirm acknowledgement of a Warning" : "Acknowledge alert"} primaryButtonText={def.tier === "warning" ? "Yes, I have reviewed the evidence" : "Acknowledge"} secondaryButtonText="Cancel" danger={def.tier === "warning"}
        onRequestClose={() => setModal(null)} onRequestSubmit={() => { actOnAlert(def.id, { status: "acknowledged", by: "R. Gogoi", at: Date.now() }); setModal(null); pushToast({ kind: "success", title: "Acknowledged", subtitle: def.title }); }}>
        <p>{def.tier === "warning" ? "Warning alerts have no one-key acknowledge. Confirm you have opened the evidence and briefed the driller. DRISHTI is advisory; eRTMAC alarms are unaffected." : "This records you have seen the alert. Add an annotation afterwards to say what was done."}</p>
      </Modal>
      <Modal size="sm" open={modal === "note"} modalHeading="Annotate alert" primaryButtonText="Save annotation" secondaryButtonText="Cancel" primaryButtonDisabled={note.trim().length < 3}
        onRequestClose={() => setModal(null)} onRequestSubmit={() => { actOnAlert(def.id, { status: "acknowledged", note, by: "R. Gogoi", at: Date.now() }); setModal(null); setNote(""); }}>
        <TextArea id={`note-${def.id}`} labelText="What was done, or why not relevant (required)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
      <Modal size="sm" open={modal === "esc"} modalHeading="Escalate to superintendent" primaryButtonText="Escalate" danger secondaryButtonText="Cancel"
        onRequestClose={() => setModal(null)} onRequestSubmit={() => { actOnAlert(def.id, { status: "escalated", by: "R. Gogoi", at: Date.now() }); setModal(null); pushToast({ kind: "info", title: "Escalated to D. Das", subtitle: def.title }); }}>
        <p>D. Das (Superintendent) will be notified with this evidence card.</p>
      </Modal>
    </motion.div>
  );
}
