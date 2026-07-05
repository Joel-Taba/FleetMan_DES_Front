import { DriverDetail } from "@/components/dashboard/views/DriverDetail";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DriverDetail id={id} />;
}
