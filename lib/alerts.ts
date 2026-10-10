import { COAL, EVENTS, LOSS_ZONE, type Ev, type Hazard } from "./data";

export type Tier = "advisory" | "caution" | "warning";
export type AlertDef = {
  id: string; tier: Tier; hazard: Hazard | "pattern"; triggerDepth: number; top: number; base: number;
  title: string; evidence: Ev[]; why: string[]; recs: { action: string; outcome: string; src: string }[];
};

const rate = (es: Ev[]) => `${es.filter((e) => e.outcome === "success").length} of ${es.length}`;

const coalStuck = EVENTS.filter((e) => e.form === "bar" && (e.type === "stuck" || e.type === "torque") && e.proj > COAL.top - 25 && e.proj < COAL.base + 10);
const stuckOnly = coalStuck.filter((e) => e.type === "stuck");
const losses = EVENTS.filter((e) => e.type === "mudloss" && e.form === "bar");
const lcm = losses.filter((e) => /LCM/.test(e.action));

export const ALERT_DEFS: AlertDef[] = [
  {
    id: "al-001", tier: "advisory", hazard: "stuck", triggerDepth: 2300, top: COAL.top, base: COAL.base,
    title: `Stuck pipe / torque risk · Barail coal ${COAL.top}–${COAL.base} m`,
    evidence: coalStuck,
    why: [`${new Set(coalStuck.map((e) => e.wellId)).size} offsets hit the coal seams at the same position in Barail`, "Model drivers: coal lithology (+), deviation 32° (+), mud weight margin (−)"],
    recs: [
      { action: "Reduce WOB and ream before each connection", outcome: `torque cleared in ${rate(coalStuck.filter((e) => e.type === "torque"))} offsets`, src: "NHK-121, NHK-97" },
      { action: "Spot lube pill and jar", outcome: `pipe freed in ${rate(stuckOnly)} stuck events`, src: "NHK-118, HGJ-64" },
    ],
  },
  {
    id: "al-002", tier: "caution", hazard: "pattern", triggerDepth: 2352, top: 2352, base: 2420,
    title: "Deja-vu match · 7 of 10 nearest windows preceded stuck pipe",
    evidence: stuckOnly,
    why: ["FlyHash: current 5-min window matches 10 historical windows (Jaccard 0.41–0.78)", "7 of 10 preceded an incident within 2 h", "Rising torque and SPP slope with falling ROP"],
    recs: [
      { action: "Pick up and circulate bottoms up before drilling further", outcome: `no incident in ${rate(EVENTS.filter((e) => e.type === "torque" && e.form === "bar"))} torque cases`, src: "NHK-121, NHK-130" },
    ],
  },
  {
    id: "al-003", tier: "warning", hazard: "mudloss", triggerDepth: 2438, top: LOSS_ZONE.top, base: LOSS_ZONE.base,
    title: `Lost-circulation risk · Barail sand ${LOSS_ZONE.top}–${LOSS_ZONE.base} m`,
    evidence: losses,
    why: [`${new Set(losses.map((e) => e.wellId)).size} offsets lost mud in this sand, 40–120 bbl/h`, "Model drivers: fractured sand (+), ECD margin (+)"],
    recs: [
      { action: "Pump LCM pill 15 ppb before entering the sand", outcome: `losses cured in ${rate(lcm)} LCM jobs`, src: "NHK-118, NHK-121, NHK-130" },
      { action: "Reduce pump rate and mud weight 0.02 sg", outcome: "cured in 1 of 1", src: "HGJ-71" },
    ],
  },
];
export const TIER_ORDER: Record<Tier, number> = { warning: 3, caution: 2, advisory: 1 };
