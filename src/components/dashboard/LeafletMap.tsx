"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type {
  Map as LeafletMapInstance,
  CircleMarker,
  Polyline,
  Circle,
} from "leaflet";

export type LatLng = [number, number];

export type MapPoint = {
  position: LatLng;
  label?: string;
  color?: string;
};

export type MapZone = {
  center: LatLng;
  /** Rayon en mètres. */
  radius: number;
  color?: string;
  label?: string;
};

type LeafletMapProps = {
  center: LatLng;
  zoom?: number;
  points?: MapPoint[];
  /** Tracé d'itinéraire reliant une liste de points. */
  route?: LatLng[];
  zones?: MapZone[];
  className?: string;
  /** Ajuste automatiquement la vue pour englober tous les éléments. */
  fitToContent?: boolean;
};

/**
 * Carte Leaflet rendue uniquement côté client (import dynamique de la lib pour
 * éviter les erreurs SSR liées à `window`). Utilise des `circleMarker` plutôt
 * que les marqueurs par défaut afin d'éviter les soucis d'assets d'icônes avec
 * le bundler.
 */
export function LeafletMap({
  center,
  zoom = 12,
  points = [],
  route = [],
  zones = [],
  className,
  fitToContent = true,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMapInstance | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      map = L.map(containerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const layers: (CircleMarker | Polyline | Circle)[] = [];

      zones.forEach((z) => {
        const circle = L.circle(z.center, {
          radius: z.radius,
          color: z.color ?? "#2696e4",
          fillColor: z.color ?? "#2696e4",
          fillOpacity: 0.18,
          weight: 2,
        }).addTo(map!);
        if (z.label) circle.bindTooltip(z.label);
        layers.push(circle);
      });

      if (route.length > 1) {
        const line = L.polyline(route, {
          color: "#2696e4",
          weight: 4,
          opacity: 0.85,
        }).addTo(map!);
        layers.push(line);
      }

      points.forEach((p) => {
        const marker = L.circleMarker(p.position, {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: p.color ?? "#2696e4",
          fillOpacity: 1,
        }).addTo(map!);
        if (p.label) marker.bindTooltip(p.label, { permanent: false });
        layers.push(marker);
      });

      if (fitToContent && layers.length > 0) {
        try {
          const group = L.featureGroup(layers as never);
          map.fitBounds(group.getBounds().pad(0.25));
        } catch {
          /* garde le centre par défaut si bounds invalides */
        }
      }

      // Corrige le rendu des tuiles quand le conteneur est animé/redimensionné.
      setTimeout(() => map?.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ center, zoom, points, route, zones })]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: "100%", width: "100%", position: "relative", zIndex: 0 }}
    />
  );
}

export default LeafletMap;
