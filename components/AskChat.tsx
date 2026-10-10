"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Tag, TextInput } from "@carbon/react";
import { Send, ThumbsUp, ThumbsDown } from "@carbon/icons-react";
import { motion } from "framer-motion";
import { EVENTS, wellById, type Ev } from "@/lib/data";

type Cite = { n: number; ev: Ev };
type Answer = { text: string; cites: Cite[] } | null;

export const SUGGESTED = [
  "What freed the pipe at the Barail coal in the offsets?",
  "Which offsets lost mud in the Barail sand and what cured it?",
  "Summarise cementing problems at the 9-5/8 in shoe.",
  "What NPT did kicks cause in Kopili?",
];

function answerFor(q: string): Answer {
  const s = q.toLowerCase();
  const pick = (f: (e: Ev) => boolean) => EVENTS.filter(f).map((ev, i) => ({ n: i + 1, ev }));
  const cite = (c: Cite[]) => c.map((x) => `[${x.n}]`).join("");
  if (/(stuck|pipe|freed|jar|coal)/.test(s)) {
    const c = pick((e) => e.type === "stuck" && e.form === "bar");
    const ok = c.filter((x) => x.ev.outcome === "success");
    return { cites: c, text: `In the Barail coal interval, ${c.length} offset stuck-pipe events were recorded across ${new Set(c.map((x) => x.ev.wellId)).size} wells. Pipe was freed in ${ok.length} of ${c.length}: ${ok.slice(0, 3).map((x) => `${wellById(x.ev.wellId)!.name} by "${x.ev.action.toLowerCase()}" ${cite([x])}`).join("; ")}. ${c.filter((x) => x.ev.outcome === "failed").map((x) => `${wellById(x.ev.wellId)!.name} was not freed and was sidetracked ${cite([x])}`).join("; ")}.` };
  }
  if (/(loss|lost|lcm|circulation|mud)/.test(s)) {
    const c = pick((e) => e.type === "mudloss" && e.form === "bar");
    const ok = c.filter((x) => /LCM/.test(x.ev.action) && x.ev.outcome === "success");
    return { cites: c, text: `${c.length} offsets lost circulation in the Barail sand at about the same relative position (2,450–2,480 m on DEMO-P1). LCM pills of 12–15 ppb cured the losses in ${ok.length} cases ${cite(ok)}. ${c.filter((x) => x.ev.outcome === "partial").map((x) => `${wellById(x.ev.wellId)!.name}: ${x.ev.action.toLowerCase()} ${cite([x])}`).join("; ")}.` };
  }
  if (/(cement|shoe|squeeze|bond)/.test(s)) {
    const c = pick((e) => e.type === "cement");
    return { cites: c, text: `${c.length} cementing problems were recorded at the 9-5/8 in shoe: ${c.map((x) => `${wellById(x.ev.wellId)!.name}: ${x.ev.action.toLowerCase()} (NPT ${x.ev.npt} h) ${cite([x])}`).join("; ")}. Two of the three lessons point to centralisers and lightweight slurry.` };
  }
  if (/(kick|gas|kopili|npt)/.test(s)) {
    const c = pick((e) => e.type === "kick");
    return { cites: c, text: `Two kicks were recorded in Kopili: ${c.map((x) => `${wellById(x.ev.wellId)!.name} at ${x.ev.tvd} m, NPT ${x.ev.npt} h, ${x.ev.action.toLowerCase()} ${cite([x])}`).join("; ")}. Two wells is thin evidence, so DRISHTI reports this as low-confidence.` };
  }
  return null;
}

export function AskChat({ compact = false }: { compact?: boolean }) {
  const [msgs, setMsgs] = useState<{ q: string; a: Answer; shown: number }[]>([]);
  const [q, setQ] = useState("");
  const end = useRef<HTMLDivElement>(null);

  const ask = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { q: text, a: answerFor(text), shown: 0 }]);
    setQ("");
  };
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last || !last.a) return;
    const total = last.a.text.split(" ").length;
    if (last.shown >= total) return;
    const id = setTimeout(() => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, shown: x.shown + 3 } : x))), 28);
    return () => clearTimeout(id);
  }, [msgs]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);

  const render = (m: { a: Answer; shown: number }) => {
    if (!m.a) return <>No matching evidence in the selected offsets. Try widening the radius from 5 km to 8 km, or ask about a hazard and formation.</>;
    const words = m.a.text.split(" ").slice(0, m.shown);
    return words.map((w, i) => {
      const mt = /^\[(\d+)\]/.exec(w);
      if (!mt) return <span key={i}>{w} </span>;
      const c = m.a!.cites.find((x) => x.n === Number(mt[1]));
      return c ? <span key={i}><Link className="cite" href={`/documents/${c.ev.docId}?line=${c.ev.line}`}>{c.n}</Link> </span> : <span key={i}>{w} </span>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: compact ? "100%" : "calc(100vh - 17rem)" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <Tag type="blue" size="sm">Well DEMO-P1</Tag><Tag type="blue" size="sm">Radius 5 km</Tag><Tag type="blue" size="sm">Formation: any</Tag>
      </div>
      <div className="chat" style={{ flex: 1, overflow: "auto", paddingRight: 4 }}>
        {msgs.length === 0 && (
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>TRY ONE OF THESE</p>
            {SUGGESTED.map((s) => (
              <Button key={s} kind="tertiary" size="sm" style={{ display: "block", marginBottom: 8, maxWidth: "100%" }} onClick={() => ask(s)}>{s}</Button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="chat">
            <div className="msg msg--user">{m.q}</div>
            <div className="msg msg--bot">
              {render(m)}
              {m.a && m.shown >= m.a.text.split(" ").length && (
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  <span className="eyebrow" style={{ alignSelf: "center", marginRight: 8 }}>{m.a.cites.length} sources · answered locally</span>
                  <Button kind="ghost" size="sm" hasIconOnly renderIcon={ThumbsUp} iconDescription="Useful" />
                  <Button kind="ghost" size="sm" hasIconOnly renderIcon={ThumbsDown} iconDescription="Not useful" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <TextInput id={`ask-${compact}`} labelText="Question" hideLabel placeholder="Ask about offsets, e.g. stuck pipe in Barail" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" hasIconOnly renderIcon={Send} iconDescription="Send" />
      </form>
    </div>
  );
}
