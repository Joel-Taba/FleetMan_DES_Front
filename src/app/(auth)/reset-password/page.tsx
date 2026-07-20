import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/fleetman/auth/ResetPasswordForm";

export const metadata = {
  title: "Nouveau mot de passe — FleetMan",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
