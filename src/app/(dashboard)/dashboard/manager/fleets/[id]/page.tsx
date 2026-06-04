import Link from "next/link";
import { FleetDetail } from "@/components/dashboard/views/FleetDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <Link href="/dashboard/manager/fleets" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Retour aux flottes
      </Link>
      <FleetDetail id={id} />
    </div>
  );
}
