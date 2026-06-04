"use client";

import { useEffect, useState } from "react";

type ClientOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ClientOnly({
  children,
  fallback = <div className="h-[240px] animate-pulse rounded-xl bg-muted" />,
}: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
