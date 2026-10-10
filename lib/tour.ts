import type { Role } from "./rbac";

export type Step = {
  id: string;
  title: string;
  body: string;
  target?: string; // data-tour value
  route?: string;
  role?: Role;
  seek?: number; // jump replay to this depth (m)
  play?: boolean;
  reset?: boolean; // restart replay
  section: string;
};

const P = "/planning/demo-p1";
const L = "/live/demo-p1";

export const STEPS: Step[] = [
  { id: "welcome", section: "Start", role: "PE", route: "/planning", reset: true, title: "Welcome to DRISHTI",
    body: "Drishti means sight. It sits beside eRTMAC and shows what every nearby well already went through, before and while you drill. This 3-minute guide walks through each screen. Skip any time." },
  { id: "rail", section: "Start", target: "rail", title: "Navigation", body: "Three areas: Planning (office), Live (rig or RTOC) and Evidence (search, Ask, documents). One well, DEMO-P1, follows you everywhere." },
  { id: "modes", section: "Start", target: "modes", title: "Mode switch", body: "Jump between Planning, Live and Evidence. The selected well stays the same." },
  { id: "role", section: "Start", target: "role", title: "Role switcher", body: "Demo only. Each role sees a different DRISHTI: planners get offsets and reports, drilling engineers get the cockpit, stewards get the review queue, contractors get a restricted view. Same permission file the backend will use." },
  { id: "ask", section: "Start", target: "ask", title: "Ask DRISHTI", body: "A side panel on any page. Plain-English questions, answers built only from retrieved records, every claim cited." },
  { id: "bell", section: "Start", target: "bell", title: "Alert bell", body: "Takes the colour of the highest open alert tier. Caution and Warning also raise a toast. DRISHTI never plays sound; audible alarms stay with eRTMAC." },
  { id: "tools", section: "Start", target: "tools", title: "Theme, units, guide", body: "Dark for control rooms, light for offices. Metric or field units per user. Reopen this guide from here." },

  { id: "p-wells", section: "Planning", route: "/planning", target: "p-wells", title: "Pick the planned well", body: "Search and filter planned wells by asset. DEMO-P1 is already drilling, so it doubles as our live well." },
  { id: "p-radius", section: "Planning", target: "p-radius", title: "Search radius", body: "1 to 20 km. The offset count updates while you drag. Filters for formation and event type narrow what counts." },
  { id: "p-preview", section: "Planning", target: "p-preview", title: "Area preview", body: "Offsets inside the ring are lit; the rest fade. Wells are ranked by real 3D path, not surface distance." },
  { id: "p-open", section: "Planning", target: "p-open", title: "Open the offset review", body: "Takes you to ranking, ladder and risk register in sequence." },

  { id: "o-view", section: "Offsets", route: `${P}/offsets`, target: "o-view", title: "Plan map and 3D", body: "Plan map shows surface locations and projected paths. Hover a well for its card; click to tick it for comparison." },
  { id: "o-radius", section: "Offsets", target: "o-radius", title: "Radius, live", body: "Same slider, same behaviour. Wells outside the radius fade out of the table too." },
  { id: "o-table", section: "Offsets", target: "o-table", title: "Ranking", body: "Trajectory-aware relevance: 3D path proximity, shared formations, recency and event density. Distance and minimum path separation are computed from the well paths." },
  { id: "o-rel", section: "Offsets", target: "o-rel", title: "Why this rank", body: "Open the breakdown on any row to see each factor and its weight. Nothing is a black box." },
  { id: "o-compare", section: "Offsets", target: "o-compare", title: "Compare up to four", body: "Tick offsets, then Compare to open them side by side on the ladder." },
  { id: "o-3d", section: "Offsets", route: `${P}/offsets?view=3d`, target: "o-view", title: "3D wells", body: "Drag to orbit, scroll to zoom. Planned well in teal, offsets shaded by relevance, coloured dots are events at their true depth, translucent slabs are formations." },

  { id: "l-layers", section: "Ladder", route: `${P}/ladder`, target: "l-layers", title: "Layers", body: "Toggle formations, casing, cement, mud and events independently." },
  { id: "l-plot", section: "Ladder", target: "l-plot", title: "Casing, cement and mud ladder", body: "Every well on one TVDSS axis. Tie lines join formation tops across wells so you see thickness change. Move over the plot for a shared depth cursor; click an event tag for its evidence." },

  { id: "r-grid", section: "Risk", route: `${P}/risk`, target: "r-grid", title: "Risk register", body: "Depth interval by hazard. Each cell shows the level and how many of 14 offsets support it. Hatched cells mean not enough evidence, never 'low'." },
  { id: "r-notes", section: "Risk", target: "r-notes", title: "Review and mitigate", body: "Add notes and planned mitigations, tick intervals as reviewed. Click any cell to open its evidence and model drivers." },
  { id: "r-gen", section: "Risk", target: "r-gen", title: "Offset Well Review", body: "Generates the report for the superintendent. Approval locks it as the Live baseline for this well." },

  { id: "v-replay", section: "Live", role: "DE", route: L, reset: true, target: "v-replay", title: "Replay controls", body: "The demo drives a compressed replay of a well. Play, pause, restart and change speed. The purple tag always says it is a replay." },
  { id: "v-kpis", section: "Live", target: "v-kpis", title: "Instrument panel", body: "Bit depth (MD and TVD), ROP, rig state, current formation, the next formation with distance and uncertainty, and data freshness." },
  { id: "v-tracks", section: "Live", seek: 2440, play: false, target: "v-tracks", title: "Depth tracks", body: "Depth runs downward. Torque spikes through the coal, flow-out falls and pit volume drops in the loss zone. Shaded bands are hazard intervals projected from offsets. Switch to the 3D well tab for the bit in space." },
  { id: "v-look", section: "Live", target: "v-look", title: "Look-ahead strip", body: "The next 300 m below the bit, one lane per hazard, with offset events projected onto your path. Click a dashed interval for its evidence." },
  { id: "v-alerts", section: "Live", target: "v-alerts", title: "Latest alerts", body: "Three tiers: Advisory, Caution, Warning. Each card carries the evidence count and distance from the bit." },

  { id: "a-tabs", section: "Alerts", route: `${L}/alerts`, target: "a-tabs", title: "Alert feed", body: "Open alerts first, then by tier. Filter by open or handled." },
  { id: "a-card", section: "Alerts", target: "a-card", title: "Evidence on the card", body: "Why it fired, which offsets saw it, and what they did about it with outcomes. Wording is advisory, never an order." },
  { id: "a-actions", section: "Alerts", target: "a-actions", title: "Act on it", body: "Acknowledge (a Warning needs a confirm step), annotate (a reason is required), escalate to the superintendent, or open the evidence drawer." },

  { id: "p-toggle", section: "Deja-vu", route: `${L}/patterns?brain=1`, target: "p-toggle", title: "Deja-vu Engine", body: "Does now look like the lead-up to past trouble? This switch shows how the fruit-fly circuit that recognises smells does the matching." },
  { id: "p-brain", section: "Deja-vu", target: "p-brain", title: "The fly brain", body: "Five stages: smell, relay neurons, random expansion, winner-take-all, memory match. A real FlyHash runs on a synthetic drilling window; signals you see are the computed ones." },
  { id: "p-controls", section: "Deja-vu", target: "p-controls", title: "Drive the animation", body: "Step through stages, pause, or press New drilling window to see a different hash and different neighbours." },
  { id: "p-table", section: "Deja-vu", target: "p-table", title: "Nearest windows", body: "The 10 nearest past windows, their overlap, and what followed. Six or more incidents out of ten raises a Caution." },
  { id: "p-immune", section: "Deja-vu", target: "p-immune", title: "Immune Watch", body: "Negative selection: flags behaviour unlike anything normal for the current rig state. Kept low priority unless another signal agrees." },

  { id: "s-bar", section: "Evidence", role: "PE", route: "/search", target: "s-bar", title: "Knowledge search", body: "Events, lessons, wells and documents in one place, limited to what your role and assets allow." },
  { id: "s-tabs", section: "Evidence", target: "s-tabs", title: "Grouped results", body: "Click an event to open similar events in the drawer, or jump to its source page." },
  { id: "k-chat", section: "Evidence", route: "/ask", target: "k-chat", title: "Ask DRISHTI", body: "Try a suggested question. Numbered pills open the exact report page. Ask something off-topic and it says 'no matching evidence' rather than guessing." },
  { id: "d-page", section: "Evidence", route: "/documents/ddr-nhk-118?line=3", target: "d-page", title: "Document viewer", body: "The report page with the extracted regions outlined, opened at the cited line." },
  { id: "d-fields", section: "Evidence", target: "d-fields", title: "Extracted fields", body: "Each field carries a confidence bar and a status. Low-confidence values wait for a human." },

  { id: "q-queue", section: "Admin", role: "KS", route: "/admin/review", target: "q-queue", title: "Review queue", body: "The steward clears low-confidence extractions. Nothing enters the repository without a human check." },
  { id: "q-fields", section: "Admin", target: "d-fields", title: "Approve, edit, reject", body: "Click a field to see its source region. Rejected values are re-extracted with the steward's note. Every action is audited." },

  { id: "c-cockpit", section: "Roles", role: "CON", route: L, target: "v-kpis", title: "Contractor view", body: "Restricted to the assigned well: cockpit, look-ahead and advisories only. No documents, no exports, username watermark on screen." },
  { id: "done", section: "Done", role: "PE", route: "/planning", title: "You are set", body: "That is DRISHTI: history that speaks before the bit gets there. Use Guide in the sidebar to replay this tour any time." },
];
