"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Dropdown, Search, Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag } from "@carbon/react";
import { ArrowRight } from "@carbon/icons-react";
import { motion } from "framer-motion";
import { OffsetMap } from "@/components/OffsetMap";
import { FORMATIONS, OFFSET_ROWS, PLANNED_WELLS } from "@/lib/data";

export default function PlanningHome() {
  const [q, setQ] = useState("");
  const [asset, setAsset] = useState("All assets");
  const [radius, setRadius] = useState(5);
  const [sel, setSel] = useState("demo-p1");
  const wells = useMemo(() => PLANNED_WELLS.filter((w) => (asset === "All assets" || w.asset === asset) && w.name.toLowerCase().includes(q.toLowerCase())), [q, asset]);
  const count = OFFSET_ROWS.filter((w) => w.distKm <= radius).length;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Well &amp; area</h1>
          <p>Pick the planned well and the neighbourhood. DRISHTI ranks offsets by 3D path, not just surface distance.</p>
        </div>
        <span data-tour="p-open"><Button as={Link} href="/planning/demo-p1/offsets" renderIcon={ArrowRight}>Open offset review</Button></span>
      </div>
      <div className="grid-2">
        <div className="panel" data-tour="p-wells">
          <div className="row" style={{ marginBottom: 12 }}>
            <div style={{ flex: 1 }}><Search size="md" labelText="Search wells" placeholder="Search planned wells" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div style={{ width: 200 }}>
              <Dropdown id="asset" size="md" label="Asset" titleText="" hideLabel items={["All assets", "Eastern Fields", "Western Fields", "Rajasthan"]} selectedItem={asset} onChange={({ selectedItem }) => setAsset(selectedItem!)} />
            </div>
          </div>
          <Table size="lg">
            <TableHead><TableRow><TableHeader>Well</TableHeader><TableHeader>Asset</TableHeader><TableHeader>Target</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead>
            <TableBody>
              {wells.map((w) => (
                <TableRow key={w.id} onClick={() => setSel(w.id)} style={{ cursor: "pointer", background: sel === w.id ? "var(--cds-layer-selected-01)" : undefined }}>
                  <TableCell><b>{w.name}</b></TableCell><TableCell>{w.asset}</TableCell><TableCell>{w.target}</TableCell>
                  <TableCell><Tag type={w.status.startsWith("Drilling") ? "green" : "gray"} size="sm">{w.status}</Tag></TableCell>
                </TableRow>
              ))}
              {wells.length === 0 && <TableRow><TableCell colSpan={4}><div className="empty">No planned wells in your assets. Ask your line manager for access.</div></TableCell></TableRow>}
            </TableBody>
          </Table>

          <div data-tour="p-radius" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <Slider id="radius" labelText={`Search radius: ${radius} km`} hideTextInput min={1} max={20} step={1} value={radius} onChange={({ value }) => setRadius(value)} />
            <div className="row" style={{ alignItems: "flex-end" }}>
              <Dropdown id="fm" size="md" label="Formation" titleText="Formation" items={["Any", ...FORMATIONS.map((f) => f.name)]} initialSelectedItem="Any" />
              <Dropdown id="ev" size="md" label="Event type" titleText="Event type" items={["Any", "Mud loss", "Stuck pipe", "Kick", "Torque spike", "Cementing"]} initialSelectedItem="Any" />
            </div>
          </div>
        </div>

        <div className="panel" data-tour="p-preview">
          <h3>Area preview <Tag type="blue" size="sm">{count} offsets within {radius} km</Tag></h3>
          <OffsetMap radiusKm={radius} compact height={420} />
          <motion.p key={count} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow" style={{ marginTop: 8 }}>
            {count === 0 ? "Widen the radius to 4 km to find offsets." : `${count} of ${OFFSET_ROWS.length} known offsets are inside the ring.`}
          </motion.p>
        </div>
      </div>
    </>
  );
}
