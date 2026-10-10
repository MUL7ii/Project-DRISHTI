"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Tag } from "@carbon/react";
import { Close, DocumentView } from "@carbon/icons-react";
import { useApp } from "./AppProvider";
import { HazardChip } from "./ui";
import { can } from "@/lib/rbac";
import { wellById } from "@/lib/data";

export function EvidenceDrawer() {
  const { evidence, openEvidence, role } = useApp();
  return (
    <AnimatePresence>
      {evidence && (
        <motion.aside className="drawer" initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: "tween", duration: 0.24, ease: [0.2, 0, 0.38, 0.9] }} aria-label="Evidence">
          <div className="drawer__head">
            <div style={{ flex: 1 }}>
              <div className="eyebrow">EVIDENCE</div>
              <h3>{evidence.title}</h3>
              {evidence.subtitle && <div className="eyebrow" style={{ marginTop: 4 }}>{evidence.subtitle}</div>}
            </div>
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription="Close" onClick={() => openEvidence(null)} />
          </div>
          <div className="drawer__body">
            {evidence.drivers && (
              <div style={{ marginBottom: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>MODEL DRIVERS</div>
                {evidence.drivers.map((d) => <Tag key={d} type="cool-gray" size="sm">{d}</Tag>)}
              </div>
            )}
            <div className="eyebrow" style={{ marginBottom: 6 }}>{evidence.events.length} OFFSET EVENTS · {new Set(evidence.events.map((e) => e.wellId)).size} WELLS</div>
            {evidence.events.length === 0 && <div className="empty">No offset events in this interval.</div>}
            {evidence.events.map((e, i) => (
              <motion.div key={e.id} className="ev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="ev__top">
                  <b>{wellById(e.wellId)?.name}</b>
                  <HazardChip id={e.type} />
                </div>
                <div className="mono" style={{ fontSize: 12 }}>{e.tvd.toLocaleString("en")} m TVDSS · NPT {e.npt} h · {e.outcome}</div>
                <div>{e.action}.</div>
                {can(role, "document", "view") ? (
                  <Link href={`/documents/${e.docId}?line=${e.line}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--cds-link-primary)", fontSize: 12 }}>
                    <DocumentView size={14} /> {e.docId.toUpperCase()} · page 1
                  </Link>
                ) : (
                  <span className="eyebrow">Source pages hidden for your role</span>
                )}
              </motion.div>
            ))}
            {evidence.note && <p className="eyebrow" style={{ marginTop: 12 }}>{evidence.note}</p>}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
