import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthGuard } from "@/components/dashboard/AuthGuard";
import { MassiveDataInitializer } from "@/components/MassiveDataInitializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
      <MassiveDataInitializer />
    </AuthGuard>
  );
}
