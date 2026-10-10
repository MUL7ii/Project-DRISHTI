"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Tag } from "@carbon/react";
import { Play, Pause, SkipForward, SkipBack, Renew } from "@carbon/icons-react";
import { C, D, FEATURES, K, LIBRARY, M, PROJECTION, QUERY, flyhash, jaccard } from "@/lib/flyhash";

const STAGES = [
  { t: "1 · Smell", d: "A fly's antennae sense an odour. DRISHTI reads the last 5 minutes of drilling (WOB, RPM, torque, SPP, flow, pit, ROP) as 32 numbers." },
  { t: "2 · Glomeruli", d: "Each sensor type gets its own relay neuron. Values are centred so no single channel shouts over the rest." },
  { t: "3 · Random expansion", d: `The 32 signals fan out into ${M} Kenyon cells (2,000 in production) inside the mushroom body. Each cell listens to just ${C} random inputs. The wiring is fixed, so the code is repeatable.` },
  { t: "4 · Winner-take-all", d: `One inhibitory neuron (APL) silences all but the strongest 5%. Only ${K} cells stay lit: the sparse tag of this moment.` },
  { t: "5 · Memory match", d: "The tag is compared with tags of 10 stored windows from offset wells. Overlap (Jaccard) ranks them. 7 of 10 were followed by stuck pipe within 2 h." },
];
const DUR = 3400;
const PAL = ["#1fb6ff", "#ff4fb8", "#ffb020", "#3bd671", "#8a6bff", "#f5e04a", "#ff6a3d", "#22e0d0"];

function noisy(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5; };
}

// silhouette of a fly brain seen from the front: central brain, two optic lobes, esophageal hole, lower lobe
function shape(W: number, H: number) {
  const cx = W * 0.5, cy = H * 0.5;
  return {
    ell: [
      { x: cx, y: cy - 0.03 * H, rx: 0.135 * W, ry: 0.33 * H, rot: 0 },
      { x: cx - 0.155 * W, y: cy + 0.01 * H, rx: 0.085 * W, ry: 0.29 * H, rot: 0.14 },
      { x: cx + 0.155 * W, y: cy + 0.01 * H, rx: 0.085 * W, ry: 0.29 * H, rot: -0.14 },
      { x: cx, y: cy + 0.35 * H, rx: 0.075 * W, ry: 0.1 * H, rot: 0 },
    ],
    hole: { x: cx, y: cy + 0.1 * H, rx: 0.016 * W, ry: 0.055 * H, rot: 0 },
  };
}
type Ell = { x: number; y: number; rx: number; ry: number; rot: number };
const inEll = (px: number, py: number, e: Ell) => {
  const c = Math.cos(e.rot), s = Math.sin(e.rot);
  const dx = px - e.x, dy = py - e.y;
  const u = dx * c + dy * s, v = -dx * s + dy * c;
  return (u * u) / (e.rx * e.rx) + (v * v) / (e.ry * e.ry) <= 1;
};

export function FlyBrain() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(true);
  const [win, setWin] = useState(0);
  const st = useRef({ stage: 0, t0: 0, auto: true });
  st.current.auto = auto;

  const v = useMemo(() => { const r = noisy(win + 5); return QUERY.map((x) => (win === 0 ? x : x + r() * 0.5)); }, [win]);
  const hash = useMemo(() => flyhash(v), [v]);
  const scored = useMemo(() => LIBRARY.map((l) => ({ ...l, jj: jaccard(hash.winners, l.winners) })).sort((a, b) => b.jj - a.jj), [hash]);
  const winnersSet = useMemo(() => new Set(hash.winners), [hash]);
  const maxAct = useMemo(() => Math.max(...hash.act), [hash]);
  const minAct = useMemo(() => Math.min(...hash.act), [hash]);

  useEffect(() => { st.current.stage = stage; st.current.t0 = performance.now(); }, [stage]);

  useEffect(() => {
    const c = cv.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let W = 0, H = 0;
    let back: HTMLCanvasElement | null = null;

    const paintBackdrop = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      back = document.createElement("canvas");
      back.width = W * dpr; back.height = H * dpr;
      const b = back.getContext("2d")!;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sh = shape(W, H);
      const r = noisy(11);
      const rnd = () => r() + 0.5;
      const inside = (x: number, y: number) => sh.ell.some((e) => inEll(x, y, e)) && !inEll(x, y, sh.hole);
      for (const e of sh.ell) { b.beginPath(); b.ellipse(e.x, e.y, e.rx, e.ry, e.rot, 0, 7); b.fillStyle = "rgba(14,22,48,0.85)"; b.fill(); }
      for (const e of sh.ell.slice(1, 3)) {
        for (let k = 0; k < 560; k++) {
          const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
          const x0 = e.x + Math.cos(a) * e.rx * rr, y0 = e.y + Math.sin(a) * e.ry * rr;
          if (!inside(x0, y0)) continue;
          const x1 = e.x + Math.cos(a) * e.rx * 0.15, y1 = e.y + Math.sin(a) * e.ry * 0.15;
          b.strokeStyle = PAL[Math.floor(rnd() * PAL.length) % PAL.length] + "34";
          b.lineWidth = 0.6;
          b.beginPath(); b.moveTo(x0, y0); b.quadraticCurveTo((x0 + x1) / 2 + (rnd() - 0.5) * 24, (y0 + y1) / 2 + (rnd() - 0.5) * 24, x1, y1); b.stroke();
        }
      }
      for (let k = 0; k < 1000; k++) {
        const x = W * (0.24 + 0.52 * rnd()), y = H * (0.06 + 0.9 * rnd());
        if (!inside(x, y)) continue;
        const L = 20 + rnd() * 70, a = rnd() * Math.PI * 2;
        b.strokeStyle = PAL[Math.floor(rnd() * PAL.length) % PAL.length] + "44";
        b.lineWidth = 0.7;
        b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a) * L * 0.6 + (rnd() - 0.5) * 30, y + Math.sin(a) * L * 0.6 + (rnd() - 0.5) * 30, x + Math.cos(a) * L, y + Math.sin(a) * L); b.stroke();
      }
      for (let k = 0; k < 7000; k++) {
        const x = W * (0.24 + 0.52 * rnd()), y = H * (0.04 + 0.92 * rnd());
        if (!inside(x, y)) continue;
        b.fillStyle = PAL[Math.floor(rnd() * PAL.length) % PAL.length] + "b0";
        b.beginPath(); b.arc(x, y, 0.8 + rnd() * 1.8, 0, 7); b.fill();
      }
    };

    const resize = () => {
      const rc = c.parentElement!.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = rc.width; H = 470;
      c.width = W * dpr; c.height = H * dpr; c.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBackdrop();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c.parentElement!);

    const inY = (i: number) => H * (0.09 + (0.82 * i) / (D - 1));
    const kc = (k: number) => {
      const r = Math.sqrt((k + 0.5) / M), th = k * 2.39996;
      return [W * 0.5 + W * 0.105 * r * Math.cos(th), H * 0.36 + H * 0.19 * r * Math.sin(th)] as const;
    };
    const X_IN = () => W * 0.1, X_PN = () => W * 0.215;
    const pulses = Array.from({ length: 200 }, (_, i) => ({ k: (i * 37) % M, j: i % C, off: (i * 0.137) % 1 }));

    const frame = (now: number) => {
      const s = st.current;
      const p = Math.min(1, (now - s.t0) / DUR);
      if (s.auto && p >= 1 && s.stage < 4) setStage(s.stage + 1);
      if (s.auto && s.stage === 4 && now - s.t0 > DUR * 2.2) setStage(0);
      const sg = s.stage;
      const e = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#04060b"; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = sg >= 3 ? 0.4 : sg === 2 ? 0.7 : 0.95;
      if (back) ctx.drawImage(back, 0, 0, W, H);
      ctx.globalAlpha = 1;

      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#7d8590";
      ctx.fillText("ODOUR · 32 features", X_IN() - 60, 16); ctx.fillText("PROJECTION", X_PN() - 32, 16);
      ctx.fillText("MUSHROOM BODY · Kenyon cells", W * 0.5 - 92, H - 6);

      for (let i = 0; i < D; i++) {
        const y = inY(i);
        const a = e(sg === 0 ? p * 1.6 - i / D : 1);
        const val = v[i];
        const mag = Math.min(1, Math.abs(val) / 2.2);
        ctx.beginPath(); ctx.arc(X_IN(), y, 2.5 + 3.5 * mag * a, 0, 7);
        ctx.fillStyle = val >= 0 ? `rgba(255,131,43,${0.25 + 0.75 * a * (0.4 + mag)})` : `rgba(51,177,255,${0.25 + 0.75 * a * (0.4 + mag)})`;
        ctx.fill();
        if (i % 2 === 0) { ctx.fillStyle = "#8b949e"; ctx.font = "9px 'IBM Plex Mono'"; ctx.textAlign = "right"; ctx.fillText(FEATURES[i], X_IN() - 10, y + 3); ctx.textAlign = "left"; }
        if (sg >= 1) {
          const lp = sg === 1 ? e(p * 1.3 - i / (D * 2)) : 1;
          ctx.strokeStyle = `rgba(120,169,255,${0.18 + 0.25 * mag})`; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(X_IN() + 5, y); ctx.lineTo(X_IN() + 5 + (X_PN() - X_IN() - 10) * lp, y); ctx.stroke();
          if (sg === 1 && lp < 1) { ctx.beginPath(); ctx.arc(X_IN() + 5 + (X_PN() - X_IN() - 10) * lp, y, 2.2, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); }
          const on = sg > 1 ? 1 : lp > 0.98 ? 1 : 0.15;
          ctx.beginPath(); ctx.arc(X_PN(), y, 3 + 2 * mag, 0, 7); ctx.fillStyle = `rgba(120,169,255,${0.2 + 0.8 * on * (0.4 + mag)})`; ctx.fill();
        }
      }

      if (sg >= 2) {
        const fade = sg === 2 ? e(p * 1.4) : 1;
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(150,190,255,${(sg >= 3 ? 0.03 : 0.07) * fade})`;
        ctx.beginPath();
        for (let k = 0; k < M; k++) {
          const [x, y] = kc(k);
          for (const j of PROJECTION[k]) { ctx.moveTo(X_PN() + 4, inY(j)); ctx.lineTo(x, y); }
        }
        ctx.stroke();
        if (sg === 2) {
          for (const pl of pulses) {
            const q = (now / 1400 + pl.off) % 1;
            const [x, y] = kc(pl.k);
            const j = PROJECTION[pl.k][pl.j];
            const px = X_PN() + 4 + (x - X_PN() - 4) * q, py = inY(j) + (y - inY(j)) * q;
            ctx.beginPath(); ctx.arc(px, py, 1.7, 0, 7); ctx.fillStyle = `rgba(200,225,255,${0.9 * (1 - Math.abs(q - 0.5))})`; ctx.fill();
          }
        }
      }

      const apl = { x: W * 0.5, y: H * 0.055 };
      const wave = sg === 3 ? e(p * 1.2) : sg > 3 ? 1 : 0;
      for (let k = 0; k < M; k++) {
        const [x, y] = kc(k);
        const act = (hash.act[k] - minAct) / (maxAct - minAct + 1e-9);
        const win_ = winnersSet.has(k);
        if (sg < 2) continue;
        if (sg === 2) {
          const a = e(p * 1.5) * (0.25 + 0.75 * act);
          ctx.beginPath(); ctx.arc(x, y, 1.6 + 2.2 * act * e(p), 0, 7); ctx.fillStyle = `rgba(200,225,255,${0.2 + 0.8 * a})`; ctx.fill();
          continue;
        }
        const dist = Math.hypot(x - apl.x, y - apl.y) / (H * 0.9);
        const hit = wave > dist ? 1 : 0;
        if (win_) {
          ctx.save(); ctx.shadowColor = "#ffd84a"; ctx.shadowBlur = 16 * (hit ? 1 : act);
          ctx.beginPath(); ctx.arc(x, y, 3.2 + 3.4 * hit + Math.sin(now / 260 + k) * 0.5 * hit, 0, 7); ctx.fillStyle = hit ? "#fff0a0" : `rgba(200,225,255,${0.3 + 0.7 * act})`; ctx.fill(); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(x, y, hit ? 1.1 : 1.6 + 2 * act, 0, 7); ctx.fillStyle = `rgba(200,225,255,${hit ? 0.05 : 0.15 + 0.75 * act})`; ctx.fill();
        }
      }

      if (sg >= 3 && wave > 0.6) {
        ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,224,102,0.4)"; ctx.beginPath();
        for (const k of hash.winners) { const [x, y] = kc(k); for (const j of PROJECTION[k]) { ctx.moveTo(X_PN() + 4, inY(j)); ctx.lineTo(x, y); } }
        ctx.stroke();
      }

      if (sg >= 3) {
        ctx.save(); ctx.shadowColor = "#be95ff"; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(apl.x, apl.y, 8, 0, 7); ctx.fillStyle = "#be95ff"; ctx.fill(); ctx.restore();
        ctx.fillStyle = "#be95ff"; ctx.font = "10px 'IBM Plex Mono'"; ctx.fillText("APL · inhibition", apl.x + 14, apl.y + 4);
        if (sg === 3) { ctx.beginPath(); ctx.arc(apl.x, apl.y, wave * H * 0.9, 0, 7); ctx.strokeStyle = `rgba(190,149,255,${0.6 * (1 - wave)})`; ctx.lineWidth = 2; ctx.stroke(); }
      }

      if (sg >= 4) {
        const sx = W * 0.32, sw = W * 0.36, sy = H * 0.95;
        const hp = e(sg === 4 ? p * 2 : 1);
        ctx.fillStyle = "#141a26"; ctx.fillRect(sx, sy - 5, sw, 10);
        for (const k of hash.winners) { ctx.fillStyle = "#ffe680"; ctx.fillRect(sx + (k / M) * sw * hp, sy - 7, 2, 14); }
        ctx.fillStyle = "#c6c6c6"; ctx.font = "10px 'IBM Plex Mono'"; ctx.fillText(`hash: ${K} of ${M} cells active (5%)`, sx, sy - 12);

        const lx = W * 0.79, lw = W * 0.2;
        const lp = e(sg === 4 ? p * 1.6 : 1);
        ctx.fillStyle = "#c6c6c6"; ctx.font = "10px 'IBM Plex Mono'"; ctx.fillText("NEAREST 10 PAST WINDOWS", lx, 16);
        scored.forEach((l, i) => {
          const y = 30 + i * (H * 0.086);
          const show = e(lp * 1.4 - i * 0.05);
          ctx.globalAlpha = show;
          ctx.fillStyle = "#e0e0e0"; ctx.font = "11px 'IBM Plex Mono'"; ctx.fillText(l.well, lx, y + 10);
          ctx.fillStyle = "#1c2233"; ctx.fillRect(lx + 62, y, lw - 100, 12);
          ctx.fillStyle = l.incident ? "#fa4d56" : "#525d75"; ctx.fillRect(lx + 62, y, (lw - 100) * l.jj * show, 12);
          ctx.fillStyle = "#e0e0e0"; ctx.fillText(l.jj.toFixed(2), lx + lw - 34, y + 10);
          ctx.fillStyle = l.incident ? "#fa4d56" : "#8d8d8d"; ctx.font = "9px 'IBM Plex Mono'";
          ctx.fillText(l.incident ? l.followed : "no incident", lx + 62, y + 24);
          ctx.globalAlpha = 1;
          if (sg === 4 && show > 0.3) { ctx.strokeStyle = `rgba(255,224,102,${0.12 * show})`; ctx.beginPath(); ctx.moveTo(sx + sw, sy); ctx.lineTo(lx - 4, y + 6); ctx.stroke(); }
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [v, hash, scored, winnersSet, maxAct, minAct]);

  const incidents = scored.filter((s) => s.incident).length;
  return (
    <div>
      <div className="brain" data-tour="p-brain">
        <canvas ref={cv} />
              </div>
      <div className="well" style={{ marginTop: 10, padding: "10px 14px", borderLeft: "3px solid var(--accent)" }}>
        <b style={{ fontSize: 14 }}>{STAGES[stage].t}</b>
        <div style={{ color: "var(--ink2)", fontSize: 13, marginTop: 2 }}>{STAGES[stage].d}</div>
        {stage === 4 && <div style={{ marginTop: 6, fontSize: 13 }}><b>{incidents} of 10</b> nearest windows preceded an incident within 2 h — <b style={{ color: "var(--tier-caution)" }}>Caution raised</b></div>}
      </div>
      <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }} data-tour="p-controls">
        <Button size="sm" kind="secondary" hasIconOnly renderIcon={SkipBack} iconDescription="Previous stage" onClick={() => { setAuto(false); setStage(Math.max(0, stage - 1)); }} />
        <Button size="sm" renderIcon={auto ? Pause : Play} onClick={() => setAuto(!auto)}>{auto ? "Pause" : "Auto-play"}</Button>
        <Button size="sm" kind="secondary" hasIconOnly renderIcon={SkipForward} iconDescription="Next stage" onClick={() => { setAuto(false); setStage(Math.min(4, stage + 1)); }} />
        <Button size="sm" kind="tertiary" renderIcon={Renew} onClick={() => { setWin(win + 1); setStage(0); setAuto(true); }}>New drilling window</Button>
        <span className="spacer" />
        {STAGES.map((s, i) => <Tag key={i} type={i === stage ? "blue" : "gray"} size="sm" onClick={() => { setAuto(false); setStage(i); }} style={{ cursor: "pointer" }}>{i + 1}</Tag>)}
      </div>
      <p className="eyebrow" style={{ marginTop: 8 }}>Real FlyHash (Dasgupta 2017) running in your browser on a synthetic window: sparse random expansion, then winner-take-all. Scores are computed, not scripted. Backdrop is a stylised connectome.</p>
    </div>
  );
}
