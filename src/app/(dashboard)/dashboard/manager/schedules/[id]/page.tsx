import { ScheduleDetail } from "@/components/dashboard/views/ScheduleDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScheduleDetail id={id} />;
}
