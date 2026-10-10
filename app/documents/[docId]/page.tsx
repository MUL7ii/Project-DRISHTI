"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dropdown } from "@carbon/react";
import { useRouter } from "next/navigation";
import { DocView } from "@/components/DocView";
import { useApp } from "@/components/AppProvider";
import { DOCS, docById } from "@/lib/data";
import { can } from "@/lib/rbac";

function Inner({ docId }: { docId: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const { role } = useApp();
  const doc = docById(docId);
  if (!can(role, "document", "view")) return <div className="panel empty">Source documents are hidden for the {role === "CON" ? "rig contractor" : ""} role. <Link href="/live/demo-p1">Back to cockpit</Link></div>;
  if (!doc) return <div className="panel empty">Document not found in your scope.</div>;
  const line = sp.get("line");
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{doc.title}</h1>
          <p>Page image with extracted regions outlined; fields on the right carry confidence and review status. Click a field or a highlighted line to link them.</p>
        </div>
        <div style={{ width: 260 }}>
          <Dropdown id="doc" label="Document" titleText="" hideLabel items={DOCS} itemToString={(d) => d?.title ?? ""} selectedItem={doc} onChange={({ selectedItem }) => router.push(`/documents/${selectedItem!.id}`)} />
        </div>
      </div>
      <DocView doc={doc} initialLine={line ? Number(line) : undefined} />
    </>
  );
}

export default function DocumentPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = use(params);
  return <Suspense fallback={<div className="empty">Opening document…</div>}><Inner docId={docId} /></Suspense>;
}
