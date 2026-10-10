"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Header, HeaderName, HeaderNavigation, HeaderMenuItem, HeaderGlobalBar, HeaderGlobalAction,
  SideNav, SideNavItems, SideNavLink, Select, SelectItem, ToastNotification, Button,
} from "@carbon/react";
import {
  Map, ChartLineData, DocumentView, Search, ChatBot, Notification, Sun, Moon, Ruler,
  WarningAlt, Fire, Dashboard, DocumentAdd, Chemistry, Help,
} from "@carbon/icons-react";
import { useApp } from "./AppProvider";
import { ROLES, can, type Role } from "@/lib/rbac";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { AskPanel } from "./AskPanel";
import { Tour } from "./Tour";
import { TIER_ORDER } from "@/lib/alerts";

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M2 16C6 9 11 6 16 6s10 3 14 10c-4 7-9 10-14 10S6 23 2 16z" stroke="var(--cds-interactive)" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="5.2" stroke="var(--cds-interactive)" strokeWidth="1.8" />
      <path d="M16 11v10M13 18.5l3 3 3-3" stroke="var(--cds-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Item = { href: string; label: string; Icon: React.ComponentType };

export function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  const a = useApp();
  const [clock, setClock] = useState("");
  const main = useRef<HTMLElement>(null);
  useEffect(() => { main.current?.scrollTo({ top: 0 }); }, [p]);
  useEffect(() => {
    const f = () => setClock(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" }));
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);

  const openAlerts = a.triggered.filter((x) => (a.alertState[x.id]?.status ?? "open") === "open");
  const top = [...openAlerts].sort((x, y) => TIER_ORDER[y.tier] - TIER_ORDER[x.tier])[0];
  const bell = top ? `var(--tier-${top.tier})` : undefined;

  const planning: Item[] = [
    { href: "/planning", label: "Well & area", Icon: Map },
    { href: "/planning/demo-p1/offsets", label: "Offset map", Icon: Map },
    { href: "/planning/demo-p1/ladder", label: "Casing · cement · mud", Icon: ChartLineData },
    { href: "/planning/demo-p1/risk", label: "Risk register", Icon: WarningAlt },
  ];
  const live: Item[] = [
    { href: "/live/demo-p1", label: a.role === "CON" ? "Restricted cockpit" : "Cockpit", Icon: Dashboard },
    { href: "/live/demo-p1/alerts", label: "Alerts", Icon: Fire },
    ...(a.role !== "CON" ? [{ href: "/live/demo-p1/patterns", label: "Deja-vu · Immune", Icon: Chemistry }] : []),
  ];
  const evidence: Item[] = [
    ...(can(a.role, "page.search", "view") ? [{ href: "/search", label: "Search", Icon: Search }] : []),
    ...(can(a.role, "page.ask", "view") ? [{ href: "/ask", label: "Ask", Icon: ChatBot }] : []),
    ...(can(a.role, "document", "view") ? [{ href: "/documents/ddr-nhk-118", label: "Documents", Icon: DocumentView }] : []),
  ];
  const admin: Item[] = can(a.role, "page.admin", "view") ? [{ href: "/admin/review", label: "Review queue", Icon: DocumentAdd }] : [];
  const groups: [string, Item[], string][] = [];
  if (a.role !== "KS" && a.role !== "CON") groups.push(["Planning", planning, "nav-planning"]);
  if (a.role !== "KS") groups.push(["Live", live, "nav-live"]);
  if (evidence.length) groups.push(["Evidence", evidence, "nav-evidence"]);
  if (admin.length) groups.push(["Admin", admin, "nav-admin"]);

  // exactly one active item: the longest matching prefix
  const all = groups.flatMap(([, items]) => items);
  const seg = (h: string) => (h.startsWith("/documents") ? "/documents" : h);
  const active = all
    .filter((i) => p === seg(i.href) || p.startsWith(seg(i.href) + "/"))
    .sort((x, y) => seg(y.href).length - seg(x.href).length)[0]?.href;

  return (
    <div className="app">
      <Header aria-label="DRISHTI">
        <span className="brand-logo"><Logo /></span>
        <HeaderName as={Link} href="/" prefix="">DRISHTI</HeaderName>
        <HeaderNavigation aria-label="Modes" data-tour="modes">
          {a.role !== "CON" && a.role !== "KS" && <HeaderMenuItem as={Link} href="/planning" isCurrentPage={p.startsWith("/planning")}>Planning</HeaderMenuItem>}
          {a.role !== "KS" && <HeaderMenuItem as={Link} href="/live/demo-p1" isCurrentPage={p.startsWith("/live")}>Live</HeaderMenuItem>}
          {can(a.role, "page.search", "view") && <HeaderMenuItem as={Link} href="/search" isCurrentPage={p.startsWith("/search") || p.startsWith("/ask") || p.startsWith("/documents")}>Evidence</HeaderMenuItem>}
          {a.role === "KS" && <HeaderMenuItem as={Link} href="/admin/review" isCurrentPage={p.startsWith("/admin")}>Admin</HeaderMenuItem>}
        </HeaderNavigation>
        <HeaderGlobalBar>
          <span style={{ alignSelf: "center", fontSize: 12, color: "var(--cds-text-secondary)", padding: "0 8px" }}>Well <b style={{ color: "var(--cds-text-primary)" }}>DEMO-P1</b></span>
          <div className="header-role" data-tour="role">
            <Select id="role" size="sm" labelText="Role" hideLabel value={a.role} onChange={(e) => a.setRole(e.target.value as Role)}>
              {ROLES.map((r) => <SelectItem key={r.id} value={r.id} text={r.label} />)}
            </Select>
          </div>
          {can(a.role, "page.ask", "view") && (
            <span data-tour="ask"><HeaderGlobalAction aria-label="Ask DRISHTI" isActive={a.askOpen} onClick={() => a.setAskOpen(!a.askOpen)} tooltipAlignment="end"><ChatBot size={20} /></HeaderGlobalAction></span>
          )}
          <span data-tour="bell" style={{ display: "inline-flex" }}><Link href="/live/demo-p1/alerts" aria-label={`Alerts (${openAlerts.length})`} style={{ display: "contents" }}>
            <HeaderGlobalAction aria-label={`Alerts (${openAlerts.length})`} tooltipAlignment="end">
              <span style={{ position: "relative", display: "inline-flex", color: bell }}>
                <Notification size={20} />
                {openAlerts.length > 0 && (
                  <motion.span key={openAlerts.length} initial={{ scale: 2 }} animate={{ scale: 1 }} style={{ position: "absolute", top: -6, right: -8, background: bell, color: "#161616", fontSize: 10, fontWeight: 700, padding: "0 4px" }}>
                    {openAlerts.length}
                  </motion.span>
                )}
              </span>
            </HeaderGlobalAction>
          </Link></span>
        </HeaderGlobalBar>
      </Header>

      <SideNav aria-label="Navigation" expanded isChildOfHeader={false} isFixedNav isPersistent data-tour="rail">
        <SideNavItems>
          {groups.map(([name, items, tour]) => (
            <div key={name} data-tour={tour}>
              <div className="navgroup">{name}</div>
              {items.map((i) => (
                <SideNavLink key={i.href} as={Link} href={i.href} renderIcon={i.Icon} isActive={active === i.href} aria-current={active === i.href ? "page" : undefined}>
                  {i.label}
                </SideNavLink>
              ))}
            </div>
          ))}
        </SideNavItems>
      </SideNav>
      <div className="rail-foot" data-tour="tools">
        <Button kind="ghost" size="sm" hasIconOnly renderIcon={a.dark ? Sun : Moon} iconDescription={a.dark ? "Light theme" : "Dark theme"} tooltipPosition="top" onClick={a.toggleTheme} />
        <Button kind="ghost" size="sm" hasIconOnly renderIcon={Ruler} iconDescription={`Units: ${a.units}`} tooltipPosition="top" onClick={() => a.setUnits(a.units === "metric" ? "field" : "metric")} />
        <span data-tour="guide" style={{ marginLeft: "auto" }}><Button kind="tertiary" size="sm" renderIcon={Help} onClick={() => a.setTourOn(true)}>Guide</Button></span>
      </div>

      <div className="stage">
        <main ref={main} className="canvas">
          <AnimatePresence mode="wait">
            <motion.div key={p} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.2, 0, 0.38, 0.9] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <div className="statusbar" data-tour="status">
          <span><i className="dot" />eRTMAC · replay link OK</span>
          <span>{clock || "--:--:--"} IST</span>
          <span>{a.units === "metric" ? "metric" : "field units"}</span>
          <span className="badge-demo">Representative data · prototype</span>
        </div>
      </div>

      {a.role === "CON" && (
        <div className="watermark" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => <span key={i}>v.singh · contractor</span>)}
        </div>
      )}

      <div className="toasts">
        <AnimatePresence>
          {a.toasts.map((t) => (
            <motion.div key={t.id} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0, x: 60 }}>
              <ToastNotification kind={t.kind} title={t.title} subtitle={t.subtitle} onClose={() => { a.dismissToast(t.id); return false; }} lowContrast={false} style={{ width: "100%" }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <EvidenceDrawer />
      <AskPanel />
      <Tour />
    </div>
  );
}
