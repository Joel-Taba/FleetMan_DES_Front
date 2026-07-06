/** Clés de fonctionnalités alignées sur fleet.plan_features */
export const PLAN_FEATURE_KEYS = [
  "TRIPS",
  "DOCUMENTS",
  "SCHEDULES",
  "ASSIGNMENTS",
  "OPERATIONS",
  "KPI_REPORTS",
  "GEOFENCING",
  "ALERTS",
  "SCORING",
  "API_ACCESS",
] as const;

export type PlanFeatureKey = (typeof PLAN_FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  TRIPS: "Trajets",
  DOCUMENTS: "Documents",
  SCHEDULES: "Plannings",
  ASSIGNMENTS: "Affectations",
  OPERATIONS: "Opérations terrain",
  KPI_REPORTS: "KPI & Rapports",
  GEOFENCING: "Géofencing",
  ALERTS: "Alertes",
  SCORING: "Scoring conducteur",
  API_ACCESS: "Accès API",
};

/** Associe les routes manager à une fonctionnalité plan */
export function featureForManagerPath(href: string): PlanFeatureKey | null {
  if (href.includes("/trips")) return "TRIPS";
  if (href.includes("/schedules")) return "SCHEDULES";
  if (href.includes("/assignments")) return "ASSIGNMENTS";
  if (href.includes("/operations/")) return "OPERATIONS";
  if (href.includes("/geofencing")) return "GEOFENCING";
  if (href.includes("/documents")) return "DOCUMENTS";
  if (href.includes("/kpis")) return "KPI_REPORTS";
  if (href.includes("/notifications")) return "ALERTS";
  return null;
}
