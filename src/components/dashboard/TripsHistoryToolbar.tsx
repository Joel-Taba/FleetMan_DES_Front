"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Download,
  FileText,
  Filter as FilterIcon,
  LayoutList,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translatedPeriodLabel, type TripPeriodPreset } from "@/lib/trips-period-filter";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PRESETS: { key: TripPeriodPreset; labelKey: string; icon: LucideIcon }[] = [
  { key: "all", labelKey: "Toutes les périodes", icon: LayoutList },
  { key: "day", labelKey: "Aujourd'hui", icon: CalendarDays },
  { key: "week", labelKey: "Cette semaine", icon: CalendarRange },
  { key: "month", labelKey: "Ce mois", icon: Calendar },
  { key: "year", labelKey: "Cette année", icon: CalendarClock },
  { key: "custom", labelKey: "Période personnalisée", icon: SlidersHorizontal },
];

type TripsHistoryToolbarProps = {
  periodPreset: TripPeriodPreset;
  onPeriodChange: (preset: TripPeriodPreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  onExportCsv: () => void;
  onExportPdf: () => void;
  exportingPdf: boolean;
};

export function TripsHistoryToolbar({
  periodPreset,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  filteredCount,
  totalCount,
  onExportCsv,
  onExportPdf,
  exportingPdf,
}: TripsHistoryToolbarProps) {
  const { t } = useLang();
  const hasResults = filteredCount > 0;
  const isFiltered = filteredCount !== totalCount || periodPreset !== "all";
  const periodLabelText = useMemo(
    () => translatedPeriodLabel(periodPreset, customFrom, customTo, t),
    [periodPreset, customFrom, customTo, t]
  );

  return (
    <Card className="mb-4 overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.03]">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <FilterIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">
                {t("Filtrer l'historique")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("Affinez la liste par période et exportez vos données.")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge
              variant={isFiltered ? "default" : "muted"}
              className="h-7 gap-1.5 px-3 text-xs font-medium"
            >
              <span className="font-semibold tabular-nums">{filteredCount}</span>
              <span className="text-primary-foreground/70">/</span>
              <span className="tabular-nums">{totalCount}</span>
              <span className="hidden sm:inline">{t("trajets")}</span>
            </Badge>

            <div className="flex overflow-hidden rounded-lg border border-border/80 bg-background shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-none border-r px-3 hover:bg-muted/80"
                onClick={onExportCsv}
                disabled={!hasResults}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Export CSV")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-none px-3 hover:bg-muted/80"
                onClick={onExportPdf}
                disabled={!hasResults || exportingPdf}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {exportingPdf ? t("Export en cours…") : t("Export PDF")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(({ key, labelKey, icon: Icon }) => {
              const active = periodPreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPeriodChange(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  <span>{t(labelKey)}</span>
                </button>
              );
            })}
          </div>

          {periodPreset === "custom" && (
            <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-background/80 p-4 shadow-inner">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("Période personnalisée")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="trip-history-from" className="text-xs text-muted-foreground">
                    {t("Du")}
                  </Label>
                  <Input
                    id="trip-history-from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => onCustomFromChange(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>
                <div
                  className="hidden h-10 items-center justify-center text-muted-foreground sm:flex"
                  aria-hidden
                >
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="trip-history-to" className="text-xs text-muted-foreground">
                    {t("Au")}
                  </Label>
                  <Input
                    id="trip-history-to"
                    type="date"
                    value={customTo}
                    onChange={(e) => onCustomToChange(e.target.value)}
                    className="h-10 bg-background"
                    min={customFrom || undefined}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-medium text-foreground">{periodLabelText}</span>
            <span>·</span>
            <span>
              {filteredCount} {t("trajet(s) affiché(s)")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
