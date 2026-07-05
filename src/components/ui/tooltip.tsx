"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  /** Texte explicatif affiché au survol. */
  label: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
};

const sideClasses: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

/**
 * Infobulle légère (CSS pur, sans dépendance). Au survol ou au focus de
 * l'élément enfant, un petit texte explicatif apparaît. Améliore la prise en
 * main de l'interface pour un nouvel utilisateur.
 */
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          sideClasses[side],
          className
        )}
      >
        {label}
      </span>
    </span>
  );
}
