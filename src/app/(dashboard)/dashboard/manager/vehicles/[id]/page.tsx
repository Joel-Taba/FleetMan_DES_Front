import Link from "next/link";
import { VehicleDetail } from "@/components/dashboard/views/VehicleDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <Link href="/dashboard/manager/vehicles" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour aux véhicules
      </Link>
      <VehicleDetail id={id} />
    </div>
  );
}
