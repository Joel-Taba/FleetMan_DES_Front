import Link from "next/link";
import { VehicleEdit } from "@/components/dashboard/views/VehicleEdit";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <Link href={`/dashboard/manager/vehicles/${id}`} className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour au détail
      </Link>
      <VehicleEdit id={id} />
    </div>
  );
}
