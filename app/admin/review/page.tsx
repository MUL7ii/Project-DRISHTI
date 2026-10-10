"use client";

import { useState } from "react";
import { Tag } from "@carbon/react";
import { motion } from "framer-motion";
import { DocView } from "@/components/DocView";
import { DOCS } from "@/lib/data";

export default function ReviewQueue() {
  const queue = DOCS.filter((d) => d.fields.some((f) => f.conf < 0.8));
  const [sel, setSel] = useState(queue[0]?.id);
  const doc = DOCS.find((d) => d.id === sel)!;
  const first = doc?.fields.find((f) => f.conf < 0.8);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Review queue</h1>
          <p>Fields below the confidence threshold wait here. Nothing reaches the repository without a human check. Sorted by lowest confidence.</p>
        </div>
        <Tag type="magenta">{queue.length} documents need review</Tag>
      </div>
      <div className="row" data-tour="q-queue" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        {queue.map((d, i) => {
          const min = Math.min(...d.fields.map((f) => f.conf));
          return (
            <motion.button key={d.id} onClick={() => setSel(d.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="ev" style={{ width: 200, cursor: "pointer", borderColor: sel === d.id ? "var(--cds-focus)" : undefined, textAlign: "left", color: "inherit", font: "inherit" }}>
              <b>{d.title.replace("DDR ", "")}</b>
              <span className="eyebrow">lowest field {Math.round(min * 100)}%</span>
            </motion.button>
          );
        })}
      </div>
      {doc && <DocView key={doc.id} doc={doc} initialLine={first?.line} />}
    </>
  );
}
