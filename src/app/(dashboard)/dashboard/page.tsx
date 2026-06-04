import Link from "next/link";
import { Shield, Users, Truck, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/fleetman/Logo";

const roles = [
  {
    href: "/dashboard/super-admin",
    label: "Super Administrateur",
    desc: "Vue système, gestion des admins",
    icon: Shield,
    color: "bg-fleet-dark text-white",
  },
  {
    href: "/dashboard/admin",
    label: "Administrateur",
    desc: "Managers, référentiels, KPI global",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    href: "/dashboard/manager",
    label: "Gestionnaire de flotte",
    desc: "Centre de commandement opérationnel",
    icon: Truck,
    color: "bg-primary/10 text-primary",
  },
  {
    href: "/dashboard/driver",
    label: "Chauffeur",
    desc: "Interface mobile-first terrain",
    icon: Car,
    color: "bg-warning/10 text-warning",
  },
];

export default function DashboardHubPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" href="/" />
      <h1 className="font-display text-center text-3xl font-bold">
        Choisir un espace de démonstration
      </h1>
      <p className="mt-2 text-center text-muted-foreground">
        Sélectionnez un rôle pour prévisualiser les pages dashboard. La
        connexion réelle sera branchée au backend plus tard.
      </p>
      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        {roles.map((role) => (
          <Link key={role.href} href={role.href}>
            <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-soft">
              <CardContent className="flex items-start gap-4 p-6">
                <div className={`rounded-xl p-3 ${role.color}`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display font-semibold">{role.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {role.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Link
        href="/login"
        className="mt-8 text-sm text-muted-foreground hover:text-primary"
      >
        ← Retour à la connexion
      </Link>
    </div>
  );
}
