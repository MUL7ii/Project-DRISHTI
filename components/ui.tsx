"use client";

import { HazardGlyph } from "./icons";
import { HAZARDS, type Hazard } from "@/lib/data";
import type { Tier } from "@/lib/alerts";

// A tier is a lamp plus a word. Colour is never the only signal.
export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`tier tier--${tier}`} style={{ color: "var(--ink)" }}>
      <i className="lamp" style={{ ["--c" as string]: `var(--tier-${tier})` }} />
      {tier}
    </span>
  );
}

export function HazardChip({ id, count, compact }: { id: Hazard | "pattern" | "fishing"; count?: number; compact?: boolean }) {
  if (id === "pattern") return <span className="hz" style={{ ["--c" as string]: "var(--accent)" }}>pattern match</span>;
  if (id === "fishing") return <span className="hz">fishing{count != null ? ` · ${count}` : ""}</span>;
  const h = HAZARDS.find((x) => x.id === id)!;
  return (
    <span className="hz" style={{ ["--c" as string]: h.css }}>
      <HazardGlyph kind={id} />
      {compact ? (count ?? "") : h.label.toLowerCase()}
      {!compact && count != null ? ` · ${count}` : ""}
    </span>
  );
}

export const relColor = (r: number) => `color-mix(in srgb, var(--accent) ${Math.round(18 + r * 82)}%, var(--line2))`;
