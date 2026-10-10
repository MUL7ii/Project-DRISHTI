"use client";

import { AskChat } from "@/components/AskChat";

export default function AskPage() {
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Ask DRISHTI</h1>
          <p>Plain-English questions answered only from retrieved records. Every claim carries a citation that opens its source page. No evidence, no answer.</p>
        </div>
      </div>
      <div className="panel" data-tour="k-chat" style={{ maxWidth: 1000 }}><AskChat /></div>
    </>
  );
}
