// Tiny hazard glyphs (Carbon-style line icons). Colour is never the only signal.
export function HazardGlyph({ kind, size = 14 }: { kind: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, style: { color: "var(--c)" } } as const;
  switch (kind) {
    case "mudloss": return <svg {...p}><path d="M8 2c2.5 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1.5-4 4-7z" /></svg>;
    case "stuck": return <svg {...p}><rect x="3" y="7" width="10" height="7" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></svg>;
    case "kick": return <svg {...p}><path d="M8 14V3M4 7l4-4 4 4M3 14h10" /></svg>;
    case "torque": return <svg {...p}><path d="M13 8a5 5 0 1 1-2-4M13 2v3h-3" /></svg>;
    case "cement": return <svg {...p}><path d="M2 5l6-3 6 3-6 3zM2 8l6 3 6-3M2 11l6 3 6-3" /></svg>;
    default: return <svg {...p}><circle cx="8" cy="8" r="5" /></svg>;
  }
}
