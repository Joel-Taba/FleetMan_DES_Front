"use client";

import { useEffect } from "react";
import { ensureMockDatabaseSeeded } from "@/lib/mock-store";

/** Initialise le localStorage avec des données de démo au premier chargement (mode mock). */
export function MockSeedBootstrap() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") return;
    ensureMockDatabaseSeeded();
  }, []);

  return null;
}
