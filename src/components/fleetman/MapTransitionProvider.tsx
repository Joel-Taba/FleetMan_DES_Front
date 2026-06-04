"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type MapTransitionContextType = {
  navigateWithTransition: (href: string) => void;
};

const MapTransitionContext = createContext<MapTransitionContextType | null>(
  null
);

export function MapTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const navigateWithTransition = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  return (
    <MapTransitionContext.Provider value={{ navigateWithTransition }}>
      {children}
    </MapTransitionContext.Provider>
  );
}

export function useMapTransition() {
  const ctx = useContext(MapTransitionContext);
  if (!ctx) {
    throw new Error("useMapTransition must be used within MapTransitionProvider");
  }
  return ctx;
}
