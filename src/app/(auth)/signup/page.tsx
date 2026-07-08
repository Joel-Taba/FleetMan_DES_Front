import { Suspense } from "react";
import { SignupForm } from "@/components/fleetman/auth/SignupForm";

export const metadata = {
  title: "Inscription — FleetMan",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement…</div>}>
      <SignupForm />
    </Suspense>
  );
}
