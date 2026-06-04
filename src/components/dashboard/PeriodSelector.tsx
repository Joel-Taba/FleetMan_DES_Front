"use client";

import { cn } from "@/lib/utils";

const periods = ["Aujourd'hui", "7 derniers jours", "Ce mois"] as const;

type PeriodSelectorProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export function PeriodSelector({
  value = "7 derniers jours",
  onChange,
}: PeriodSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-1">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange?.(period)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === period
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
