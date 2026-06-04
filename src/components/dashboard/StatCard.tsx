import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  trend?: string;
  up?: boolean;
  icon: LucideIcon;
  href?: string;
  accent?: "default" | "success" | "warning" | "destructive";
};

export function StatCard({
  title,
  value,
  trend,
  up = true,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  const accentBg = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[accent];

  return (
    <Card className="cursor-pointer rounded-2xl border-border/60 shadow-dashboard transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <CardContent className="relative overflow-hidden p-6">
        <Icon
          className="absolute -right-2 -top-2 h-24 w-24 text-primary/5"
          strokeWidth={1}
        />
        <div className={cn("mb-4 inline-flex rounded-xl p-3", accentBg)}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 font-display text-3xl font-bold text-foreground">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              "mt-2 flex items-center gap-1 text-xs font-medium",
              up ? "text-success" : "text-destructive"
            )}
          >
            {up ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend} vs mois dernier
          </p>
        )}
      </CardContent>
    </Card>
  );
}
