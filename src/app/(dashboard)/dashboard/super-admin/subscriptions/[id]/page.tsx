import { SubscriptionDetail } from "@/components/dashboard/views/SubscriptionDetail";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubscriptionDetail id={id} />;
}
