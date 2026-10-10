"use client";

import { useEffect, useState } from "react";
import { Button, Tag, TextInput } from "@carbon/react";
import { Checkmark, Close, Edit } from "@carbon/icons-react";
import { motion } from "framer-motion";
import { useApp } from "./AppProvider";
import { can } from "@/lib/rbac";
import { wellById, type Doc } from "@/lib/data";

export function DocView({ doc, initialLine }: { doc: Doc; initialLine?: number }) {
  const { role, pushToast } = useApp();
  const [active, setActive] = useState<number | null>(initialLine ?? null);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => { setActive(initialLine ?? null); }, [initialLine, doc.id]);
  const hitLines = new Set(doc.fields.map((f) => f.line));
  const steward = can(role, "extraction", "approve");
  const well = wellById(doc.wellId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
      <motion.div data-tour="d-page" className="docpage" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h5>OIL INDIA LIMITED · {doc.type.toUpperCase()}</h5>
        <div style={{ color: "var(--ink3)", marginBottom: 8 }}>Well {well?.name} · {doc.date} · Class: {doc.classification} · (representative data)</div>
        {doc.lines.map((l, i) => (
          <div key={i} className={`line ${hitLines.has(i) ? "line--hit" : ""} ${active === i ? "line--active" : ""}`} onClick={() => hitLines.has(i) && setActive(i)}>
            <span style={{ color: "#8d8d8d", marginRight: 8 }}>{String(i).padStart(2, "0")}</span>{l}
          </div>
        ))}
        <div style={{ position: "absolute", right: 14, bottom: 8, color: "#8d8d8d" }}>page 1 / 1</div>
      </motion.div>

      <div>
        <div className="panel" data-tour="d-fields">
          <h3>Extracted fields <Tag type="gray" size="sm">{doc.fields.length}</Tag></h3>
          {doc.fields.map((f, i) => {
            const st = status[f.id] ?? f.status;
            const low = f.conf < 0.8;
            return (
              <motion.div key={f.id} className="ev" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                style={{ borderColor: active === f.line ? "var(--cds-focus)" : undefined, cursor: "pointer" }} onClick={() => setActive(f.line)}>
                <div className="ev__top"><span className="eyebrow">{f.label}</span>
                  <Tag size="sm" type={st === "reviewed" ? "green" : st === "rejected" ? "red" : low ? "magenta" : "gray"}>{st === "reviewed" ? "reviewed" : st === "rejected" ? "rejected" : low ? "needs review" : "auto"}</Tag>
                </div>
                {edit === f.id ? (
                  <TextInput id={`e-${f.id}`} size="sm" labelText="Value" hideLabel value={vals[f.id] ?? f.value} onChange={(e) => setVals({ ...vals, [f.id]: e.target.value })} />
                ) : (
                  <div className="mono" style={{ fontSize: 16 }}>{vals[f.id] ?? f.value} <span className="eyebrow">{f.unit}</span></div>
                )}
                <div className="row" style={{ gap: 8 }}>
                  <div className="mini-bar" style={{ flex: 1 }}><i style={{ width: `${f.conf * 100}%`, background: low ? "var(--tier-caution)" : "var(--cds-support-success)" }} /></div>
                  <span className="mono" style={{ fontSize: 12 }}>{Math.round(f.conf * 100)}%</span>
                </div>
                {steward && st !== "reviewed" && (
                  <div className="row" style={{ gap: 4, marginTop: 4 }}>
                    <Button size="sm" renderIcon={Checkmark} onClick={(e) => { e.stopPropagation(); setEdit(null); setStatus({ ...status, [f.id]: "reviewed" }); pushToast({ kind: "success", title: "Field approved", subtitle: `${f.label} — audited` }); }}>Approve</Button>
                    <Button size="sm" kind="secondary" renderIcon={Edit} onClick={(e) => { e.stopPropagation(); setEdit(edit === f.id ? null : f.id); }}>{edit === f.id ? "Done" : "Edit"}</Button>
                    <Button size="sm" kind="danger--ghost" renderIcon={Close} onClick={(e) => { e.stopPropagation(); setStatus({ ...status, [f.id]: "rejected" }); pushToast({ kind: "info", title: "Rejected — will re-extract", subtitle: "Steward note attached" }); }}>Reject</Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
