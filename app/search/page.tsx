"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dropdown, Search, Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from "@carbon/react";
import { motion } from "framer-motion";
import { HazardChip } from "@/components/ui";
import { useApp } from "@/components/AppProvider";
import { DOCS, EVENTS, FORMATIONS, LESSONS, OFFSET_ROWS, wellById, type Hazard } from "@/lib/data";

const TYPES = ["Any", "Mud loss", "Stuck pipe", "Kick", "Torque spike", "Cementing"];
const TYPE_ID: Record<string, string> = { "Mud loss": "mudloss", "Stuck pipe": "stuck", "Kick": "kick", "Torque spike": "torque", "Cementing": "cement" };

export default function SearchPage() {
  const { openEvidence } = useApp();
  const [q, setQ] = useState("");
  const [fm, setFm] = useState("Any");
  const [ty, setTy] = useState("Any");
  const events = useMemo(() => EVENTS.filter((e) => {
    const f = FORMATIONS.find((x) => x.id === e.form)!.name;
    return (fm === "Any" || f === fm) && (ty === "Any" || e.type === TYPE_ID[ty]) && (q === "" || (e.text + wellById(e.wellId)!.name + f).toLowerCase().includes(q.toLowerCase()));
  }), [q, fm, ty]);
  const lessons = LESSONS.filter((l) => l.title.toLowerCase().includes(q.toLowerCase()) && (fm === "Any" || l.form === fm));
  const wells = OFFSET_ROWS.filter((w) => (w.name + w.field).toLowerCase().includes(q.toLowerCase()));
  const docs = DOCS.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()));
  const empty = <div className="panel empty">No results in your scope. Try “LCM”, “coal” or remove a filter.</div>;

  return (
    <>
      <div className="page-title">
        <div><h1>Knowledge search</h1><p>Faceted search across events, lessons, wells and documents, limited to what your role and assets allow.</p></div>
      </div>
      <div className="row" style={{ marginBottom: 12, alignItems: "flex-end" }}>
        <div data-tour="s-bar" style={{ flex: 1 }}><Search size="lg" labelText="Search" placeholder="Search events, lessons, wells, documents — e.g. LCM Barail" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div style={{ width: 200 }}><Dropdown id="sf" label="Formation" titleText="Formation" items={["Any", ...FORMATIONS.map((f) => f.name)]} selectedItem={fm} onChange={({ selectedItem }) => setFm(selectedItem!)} /></div>
        <div style={{ width: 200 }}><Dropdown id="st" label="Event type" titleText="Event type" items={TYPES} selectedItem={ty} onChange={({ selectedItem }) => setTy(selectedItem!)} /></div>
      </div>
      <div className="row" style={{ marginBottom: 8, gap: 6 }}>
        {fm !== "Any" && <Tag filter onClose={() => setFm("Any")}>Formation: {fm}</Tag>}
        {ty !== "Any" && <Tag filter onClose={() => setTy("Any")}>Type: {ty}</Tag>}
      </div>
      <div data-tour="s-tabs"><Tabs>
        <TabList aria-label="Result groups">
          <Tab>Events ({events.length})</Tab><Tab>Lessons ({lessons.length})</Tab><Tab>Wells ({wells.length})</Tab><Tab>Documents ({docs.length})</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {events.length === 0 ? empty : events.map((e, i) => (
              <motion.div key={e.id} className="ev" style={{ cursor: "pointer" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}
                onClick={() => openEvidence({ title: `${wellById(e.wellId)!.name} · ${e.tvd} m`, subtitle: "Similar events in the drawer", events: EVENTS.filter((x) => x.type === e.type && x.form === e.form).slice(0, 6) })}>
                <div className="ev__top"><b>{wellById(e.wellId)!.name} · {FORMATIONS.find((f) => f.id === e.form)!.name}</b><HazardChip id={e.type as Hazard} /></div>
                <div>{e.text}</div>
              </motion.div>
            ))}
          </TabPanel>
          <TabPanel>{lessons.length === 0 ? empty : lessons.map((l) => <div key={l.id} className="ev"><div className="ev__top"><b>{l.title}</b><Tag type={l.status === "Published" ? "green" : "magenta"} size="sm">{l.status}</Tag></div><span className="eyebrow">{l.form} · linked to {l.wells.length} offset wells</span></div>)}</TabPanel>
          <TabPanel>{wells.length === 0 ? empty : wells.map((w) => <div key={w.id} className="ev"><div className="ev__top"><b>{w.name}</b><span className="mono">rel {w.relevance.toFixed(2)}</span></div><span className="eyebrow">{w.field} · spud {w.spud} · TD {w.td} m · {w.nEvents} events</span></div>)}</TabPanel>
          <TabPanel>{docs.length === 0 ? empty : docs.map((d) => <Link key={d.id} href={`/documents/${d.id}`} className="ev" style={{ textDecoration: "none", color: "inherit" }}><div className="ev__top"><b>{d.title}</b><Tag size="sm" type="gray">{d.classification}</Tag></div><span className="eyebrow">{d.type} · {d.fields.length} extracted fields</span></Link>)}</TabPanel>
        </TabPanels>
      </Tabs></div>
    </>
  );
}
