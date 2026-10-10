"use client";

import { useState } from "react";
import { Tab, TabList, Tabs } from "@carbon/react";
import { AnimatePresence } from "framer-motion";
import { ReplayBar } from "@/components/ReplayBar";
import { AlertCard } from "@/components/AlertCard";
import { useApp } from "@/components/AppProvider";
import { TIER_ORDER } from "@/lib/alerts";

export default function Alerts() {
  const { triggered, alertState } = useApp();
  const [tab, setTab] = useState(0);
  const list = [...triggered]
    .filter((a) => tab === 0 || (tab === 1 ? (alertState[a.id]?.status ?? "open") === "open" : (alertState[a.id]?.status ?? "open") !== "open"))
    .sort((a, b) => {
      const ao = (alertState[a.id]?.status ?? "open") === "open" ? 1 : 0, bo = (alertState[b.id]?.status ?? "open") === "open" ? 1 : 0;
      return bo - ao || TIER_ORDER[b.tier] - TIER_ORDER[a.tier] || b.triggerDepth - a.triggerDepth;
    });
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Alert feed</h1>
          <p>Unacknowledged first, then by tier. Every alert ends acknowledged, escalated or expired, and the outcome becomes new evidence.</p>
        </div>
      </div>
      <ReplayBar />
      <div data-tour="a-tabs"><Tabs selectedIndex={tab} onChange={({ selectedIndex }) => setTab(selectedIndex)}>
        <TabList aria-label="Filter">
          <Tab>All ({triggered.length})</Tab>
          <Tab>Open ({triggered.filter((a) => (alertState[a.id]?.status ?? "open") === "open").length})</Tab>
          <Tab>Handled</Tab>
        </TabList>
      </Tabs></div>
      <div style={{ display: "grid", gap: 12, marginTop: 16, maxWidth: 980 }}>
        <AnimatePresence initial={false}>{list.map((a) => <AlertCard key={a.id} def={a} />)}</AnimatePresence>
        {list.length === 0 && <div className="panel empty">{triggered.length === 0 ? "No alerts yet. Start the replay from the cockpit or with Play above." : "Nothing in this view."}</div>}
      </div>
    </>
  );
}
