import { ManagerDetail } from "@/components/dashboard/views/ManagerDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManagerDetail id={id} />;
}
