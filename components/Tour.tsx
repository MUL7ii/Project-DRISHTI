"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@carbon/react";
import { useApp } from "./AppProvider";
import { STEPS } from "@/lib/tour";
import { ROLES, type Role } from "@/lib/rbac";

const KEY = "drishti-guide-seen";
type Rect = { x: number; y: number; w: number; h: number } | null;

export function Tour() {
  const { tourOn, setTourOn, role, setRole, seek, setPlaying, restart } = useApp();
  const router = useRouter();
  const path = usePathname();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect>(null);
  const start = useRef<Role>("PE");
  const step = STEPS[i];

  // first visit: offer the guide automatically
  useEffect(() => {
    let seen = false;
    try { seen = !!localStorage.getItem(KEY); } catch {}
    if (!seen) {
      const id = setTimeout(() => setTourOn(true), 900);
      return () => clearTimeout(id);
    }
  }, [setTourOn]);

  useEffect(() => {
    if (tourOn) { start.current = role; setI(0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOn]);

  const close = useCallback(() => {
    setTourOn(false);
    setRect(null);
    setPlaying(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
    if (role !== start.current) setRole(start.current, false);
    router.push(ROLES.find((r) => r.id === start.current)!.landing);
  }, [role, router, setPlaying, setRole, setTourOn]);

  // enter a step: switch role, route, replay position; then follow the target
  useEffect(() => {
    if (!tourOn) return;
    let dead = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    if (step.role && step.role !== role) setRole(step.role, false);
    if (step.reset) restart();
    if (step.seek != null) { seek(step.seek); }
    if (step.play != null) setPlaying(step.play);
    if (step.route) {
      const cur = window.location.pathname + window.location.search;
      if (cur !== step.route) router.push(step.route);
    }
    setRect(null);
    if (step.target) {
      let tries = 0;
      const measure = () => {
        const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
        if (!el) return tries++ > 40 ? setRect(null) : undefined;
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.top < 60 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: "center", behavior: "smooth" });
        if (!dead) setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      };
      poll = setInterval(measure, 200);
      measure();
    }
    return () => { dead = true; if (poll) clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOn, i, path]);

  const next = useCallback(() => (i >= STEPS.length - 1 ? close() : setI(i + 1)), [i, close]);
  const back = useCallback(() => setI(Math.max(0, i - 1)), [i]);
  useEffect(() => {
    if (!tourOn) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [tourOn, next, back, close]);

  if (!tourOn) return null;

  const PAD = 8, CW = 360, CH = 210;
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  let left = vw / 2 - CW / 2, top = vh / 2 - CH / 2;
  if (rect) {
    const r = { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 };
    if (r.x + r.w + CW + 20 < vw) { left = r.x + r.w + 16; top = r.y; }
    else if (r.x - CW - 20 > 0) { left = r.x - CW - 16; top = r.y; }
    else if (r.y + r.h + CH + 20 < vh) { left = r.x; top = r.y + r.h + 16; }
    else { left = r.x; top = r.y - CH - 16; }
    left = Math.max(12, Math.min(left, vw - CW - 12));
    top = Math.max(12, Math.min(top, vh - CH - 12));
  }
  const sections = [...new Set(STEPS.map((s) => s.section))];

  return (
    <>
      <div className="tour-veil" />
      {rect && <div className="tour-hole" style={{ left: rect.x - PAD, top: rect.y - PAD, width: rect.w + PAD * 2, height: rect.h + PAD * 2 }} />}
      {!rect && <div style={{ position: "fixed", inset: 0, background: "rgba(3,4,5,.78)", zIndex: 9501 }} />}
      <button className="chip-btn tour-skip-top" onClick={close}>Skip guide ✕</button>
      <div className="tour-card" style={{ left, top }} role="dialog" aria-label="Guide">
        <div className="tour-step">{step.section} · {i + 1} of {STEPS.length}</div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="tour-bar"><i style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} /></div>
        <div className="tour-row">
          <button className="tour-skip" onClick={close}>Skip guide</button>
          <Button size="sm" kind="ghost" onClick={back} disabled={i === 0}>Back</Button>
          <Button size="sm" onClick={next}>{i === STEPS.length - 1 ? "Finish" : "Next"}</Button>
        </div>
        <div className="eyebrow" style={{ marginTop: 8, fontSize: 10 }}>{sections.join(" · ")} — arrow keys work, Esc skips</div>
      </div>
    </>
  );
}
