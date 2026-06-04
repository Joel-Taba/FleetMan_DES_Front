import dynamic from "next/dynamic";

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-muted"
      style={{ height, minHeight: height }}
    />
  );
}

export const UserSignupChart = dynamic(
  () =>
    import("@/components/dashboard/charts/UserSignupChart").then((m) => ({
      default: m.UserSignupChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);

export const UserDonutChart = dynamic(
  () =>
    import("@/components/dashboard/charts/UserDonutChart").then((m) => ({
      default: m.UserDonutChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);

export const VehicleBarChart = dynamic(
  () =>
    import("@/components/dashboard/charts/VehicleBarChart").then((m) => ({
      default: m.VehicleBarChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);

export const FleetHealthGauge = dynamic(
  () =>
    import("@/components/dashboard/charts/FleetHealthGauge").then((m) => ({
      default: m.FleetHealthGauge,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={200} /> }
);

export const KpiDistanceCostChart = dynamic(
  () =>
    import("@/components/dashboard/charts/KpiDistanceCostChart").then((m) => ({
      default: m.KpiDistanceCostChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);

export const KpiCostCategoryChart = dynamic(
  () =>
    import("@/components/dashboard/charts/KpiCostCategoryChart").then((m) => ({
      default: m.KpiCostCategoryChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);
