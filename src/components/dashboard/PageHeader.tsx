"use client";

import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  const { t } = useLang();
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {t(title)}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{t(description)}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
