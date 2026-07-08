import { apiFetch } from "@/lib/api/mock-wrapper";

export type PublicSubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  maxFleets: number;
  maxVehicles: number;
  maxDrivers: number;
  monthlyPrice: number;
  annualPrice: number | null;
  currency: string;
  features: string;
  isActive: boolean;
};

export type RegisterManagerDocument = {
  docType: string;
  docNumber: string;
  fileUrl: string;
  fileMimeType?: string;
  fileOriginalName?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
};

export type RegisterManagerBody = {
  username: string;
  password: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  companyName: string;
  requestedPlanId?: string;
  documents: RegisterManagerDocument[];
};

export function fetchPublicSubscriptionPlans() {
  return apiFetch<PublicSubscriptionPlan[]>("/api/v1/public/subscription-plans", {}, false);
}

export function registerManager(body: RegisterManagerBody) {
  return apiFetch<{ id: string; status: string; message: string }>(
    "/api/v1/public/register-manager",
    { method: "POST", body: JSON.stringify(body) },
    false
  );
}
