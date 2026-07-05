import type { ReferenceKind } from "@/lib/api/admin";

export type ReferenceTabConfig = {
  id: ReferenceKind;
  label: string;
};

export const ADMIN_REFERENCE_TABS: ReferenceTabConfig[] = [
  { id: "vehicle-types", label: "Types de véhicules" },
  { id: "manufacturers", label: "Constructeurs" },
  { id: "brands", label: "Marques" },
  { id: "models", label: "Modèles" },
  { id: "sizes", label: "Gabarits" },
  { id: "usages", label: "Usages" },
  { id: "fuels", label: "Carburants" },
  { id: "transmissions", label: "Transmissions" },
  { id: "colors", label: "Couleurs" },
];
