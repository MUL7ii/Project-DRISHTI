import matrix from "./rbac-matrix.json";

export type Role = "DE" | "PE" | "KS" | "CON";
export const ROLES: { id: Role; label: string; persona: string; landing: string }[] = [
  { id: "DE", label: "Drilling engineer", persona: "Rohan Gogoi", landing: "/live/demo-p1" },
  { id: "PE", label: "Planning engineer", persona: "Priya Sharma", landing: "/planning" },
  { id: "KS", label: "Knowledge steward", persona: "Meera Nath", landing: "/admin/review" },
  { id: "CON", label: "Rig contractor", persona: "Vikram Singh", landing: "/live/demo-p1" },
];

// One source of truth for UI (and later the API) — Doc 02.
export const can = (role: Role, resource: string, action: string): boolean =>
  (matrix as Record<string, Record<string, string[]>>)[resource]?.[action]?.includes(role) ?? false;
