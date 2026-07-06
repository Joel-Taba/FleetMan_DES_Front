import { Suspense } from "react";
import { TripDetail } from "@/components/dashboard/views/TripDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Chargement…</div>}>
      <TripDetail id={id} />
    </Suspense>
  );
}
