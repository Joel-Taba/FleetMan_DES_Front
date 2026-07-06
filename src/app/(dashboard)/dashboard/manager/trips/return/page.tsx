import { Suspense } from "react";
import { TripReturnForm } from "@/components/dashboard/views/TripReturnForm";

export default function TripReturnPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Chargement…</div>}>
      <TripReturnForm />
    </Suspense>
  );
}
