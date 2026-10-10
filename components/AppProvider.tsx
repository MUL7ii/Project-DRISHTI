"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GlobalTheme } from "@carbon/react";
import { useRouter } from "next/navigation";
import { ROLES, type Role } from "@/lib/rbac";
import { ALERT_DEFS, type AlertDef } from "@/lib/alerts";
import { D0, D_END, RATE } from "@/lib/telemetry";
import type { Ev } from "@/lib/data";

export type Evidence = { title: string; subtitle?: string; events: Ev[]; drivers?: string[]; note?: string } | null;
export type AlertState = { status: "open" | "acknowledged" | "escalated"; note?: string; by?: string; at?: number };
export type Toast = { id: string; kind: "info" | "warning" | "error" | "success"; title: string; subtitle: string };

type Ctx = {
  role: Role; setRole: (r: Role, nav?: boolean) => void;
  seek: (depth: number) => void;
  tourOn: boolean; setTourOn: (b: boolean) => void;
  dark: boolean; toggleTheme: () => void;
  units: "metric" | "field"; setUnits: (u: "metric" | "field") => void;
  t: number; depth: number; playing: boolean; setPlaying: (p: boolean) => void;
  speed: number; setSpeed: (s: number) => void; restart: () => void; ended: boolean;
  triggered: AlertDef[]; alertState: Record<string, AlertState>;
  actOnAlert: (id: string, s: AlertState) => void;
  evidence: Evidence; openEvidence: (e: Evidence) => void;
  askOpen: boolean; setAskOpen: (b: boolean) => void;
  toasts: Toast[]; dismissToast: (id: string) => void; pushToast: (t: Omit<Toast, "id">) => void;
};
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRoleS] = useState<Role>("DE");
  const [dark, setDark] = useState(true);
  const [units, setUnits] = useState<"metric" | "field">("metric");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [alertState, setAlertState] = useState<Record<string, AlertState>>({});
  const [evidence, openEvidence] = useState<Evidence>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tourOn, setTourOn] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  const depth = Math.min(D_END, D0 + RATE * t);
  const ended = depth >= D_END;

  // theme
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("cds--g100", "cds--white");
    el.classList.add(dark ? "cds--g100" : "cds--white");
  }, [dark]);

  // replay clock
  const last = useRef(0);
  const acc = useRef(0);
  const tRef = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    last.current = performance.now();
    const loop = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      tRef.current += dt * speed;
      acc.current += dt;
      if (acc.current > 0.08) {
        acc.current = 0;
        setT(tRef.current);
      }
      if (D0 + RATE * tRef.current >= D_END) {
        setT(tRef.current);
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const restart = useCallback(() => {
    tRef.current = 0;
    setT(0);
    setPlaying(false);
    setAlertState({});
    seen.current = new Set();
    setToasts([]);
  }, []);

  const triggered = useMemo(() => ALERT_DEFS.filter((a) => a.triggerDepth <= depth), [depth]);

  const pushToast = useCallback((x: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { ...x, id }]);
    setTimeout(() => setToasts((p) => p.filter((y) => y.id !== id)), 9000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((p) => p.filter((x) => x.id !== id)), []);

  // toast on new Caution/Warning only (Doc 01)
  useEffect(() => {
    for (const a of triggered) {
      if (seen.current.has(a.id)) continue;
      seen.current.add(a.id);
      if (a.tier !== "advisory" && !tourOn) pushToast({ kind: a.tier === "warning" ? "error" : "warning", title: `${a.tier === "warning" ? "Warning" : "Caution"} · ${a.title}`, subtitle: "Open Alerts to review the evidence." });
    }
  }, [triggered, pushToast, tourOn]);

  const actOnAlert = useCallback((id: string, s: AlertState) => setAlertState((p) => ({ ...p, [id]: s })), []);

  const seek = useCallback((d: number) => {
    const nt = Math.max(0, (d - D0) / RATE);
    tRef.current = nt;
    setT(nt);
  }, []);

  const setRole = useCallback((r: Role, nav = true) => {
    setRoleS(r);
    if (nav) router.push(ROLES.find((x) => x.id === r)!.landing);
    setAskOpen(false);
    openEvidence(null);
  }, [router]);

  const value: Ctx = {
    role, setRole, seek, tourOn, setTourOn, dark, toggleTheme: () => setDark((d) => !d), units, setUnits,
    t, depth, playing, setPlaying, speed, setSpeed, restart, ended, triggered, alertState, actOnAlert,
    evidence, openEvidence, askOpen, setAskOpen, toasts, dismissToast, pushToast,
  };
  return (
    <C.Provider value={value}>
      <GlobalTheme theme={dark ? "g100" : "white"}>{children as React.ReactElement}</GlobalTheme>
    </C.Provider>
  );
}
