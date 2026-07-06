"use client";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PERIOD_KEYS = ["Aujourd'hui", "7 derniers jours", "Ce mois"] as const;

type PeriodSelectorProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export function PeriodSelector({
  value,
  onChange,
}: PeriodSelectorProps) {
  const { t } = useLang();
  const current = value ?? t("7 derniers jours");

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-1">
      {PERIOD_KEYS.map((periodKey) => {
        const label = t(periodKey);
        return (
          <button
            key={periodKey}
            type="button"
            onClick={() => onChange?.(periodKey)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              current === periodKey || current === label
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
