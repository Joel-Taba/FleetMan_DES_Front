import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockDriverDashboard } from "@/lib/mock-data";

export default function DriverTripsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold">Mes trajets & affectations</h1>
      <Link href="/dashboard/driver/trips/active">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center font-semibold text-primary">
            Voir la course active →
          </CardContent>
        </Card>
      </Link>
      <ul className="space-y-3">
        {mockDriverDashboard.assignments.map((a) => (
          <li key={a.id} className="rounded-xl border p-4">
            <Badge className="mb-2">{a.date}</Badge>
            <p className="font-bold">{a.time}</p>
            <p className="text-sm text-muted-foreground">{a.vehicle}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
