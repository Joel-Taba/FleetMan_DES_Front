import { Suspense } from "react";
import { TripsPage } from "@/components/dashboard/views/TripsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Chargement…</div>}>
      <TripsPage />
    </Suspense>
  );
}
