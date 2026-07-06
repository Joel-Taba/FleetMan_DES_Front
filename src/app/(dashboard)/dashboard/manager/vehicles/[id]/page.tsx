import Link from "next/link";
import { VehicleDetailView } from "@/components/dashboard/views/VehicleDetailView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <Link href="/dashboard/manager/vehicles" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour aux véhicules
      </Link>
      <VehicleDetailView id={id} />
    </div>
  );
}
