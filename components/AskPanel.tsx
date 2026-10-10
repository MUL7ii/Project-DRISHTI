"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@carbon/react";
import { Close } from "@carbon/icons-react";
import { useApp } from "./AppProvider";
import { AskChat } from "./AskChat";
import { usePathname } from "next/navigation";

export function AskPanel() {
  const { askOpen, setAskOpen } = useApp();
  const p = usePathname();
  if (p === "/ask") return null;
  return (
    <AnimatePresence>
      {askOpen && (
        <motion.aside className="drawer" style={{ zIndex: 7100 }} initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: "tween", duration: 0.24 }} aria-label="Ask DRISHTI">
          <div className="drawer__head">
            <h3>Ask DRISHTI</h3>
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription="Close" onClick={() => setAskOpen(false)} />
          </div>
          <div className="drawer__body"><AskChat compact /></div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
