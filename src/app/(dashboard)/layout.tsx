import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthGuard } from "@/components/dashboard/AuthGuard";
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard";
import { MassiveDataInitializer } from "@/components/MassiveDataInitializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <DashboardShell>{children}</DashboardShell>
      </SubscriptionGuard>
      <MassiveDataInitializer />
    </AuthGuard>
  );
}
