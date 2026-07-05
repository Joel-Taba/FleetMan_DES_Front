import type { AdminUserDetail } from "@/lib/api/types/admin";

export function managerIsActive(m: AdminUserDetail) {
  return m.isActive ?? m.active ?? true;
}

export function managerFullName(m: AdminUserDetail) {
  return `${m.firstName} ${m.lastName}`.trim();
}

export function managerInitials(m: AdminUserDetail) {
  const f = m.firstName?.[0] ?? "";
  const l = m.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "M";
}

export function formatLastLogin(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
