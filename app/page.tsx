"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { ROLES } from "@/lib/rbac";

export default function Home() {
  const { role } = useApp();
  const router = useRouter();
  useEffect(() => {
    router.replace(ROLES.find((r) => r.id === role)!.landing);
  }, [role, router]);
  return <div className="empty">Opening your workspace…</div>;
}
