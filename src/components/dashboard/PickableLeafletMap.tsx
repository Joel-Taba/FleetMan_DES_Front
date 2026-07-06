"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMapInstance, CircleMarker } from "leaflet";
import type { LatLng } from "./LeafletMap";

type PickableLeafletMapProps = {
  center: LatLng;
  zoom?: number;
  position: LatLng | null;
  onPick: (lat: number, lng: number) => void;
  className?: string;
};

/**
 * Carte Leaflet cliquable pour placer un point précis (sélection lieu).
 */
export function PickableLeafletMap({
  center,
  zoom = 13,
  position,
  onPick,
  className,
}: PickableLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMapInstance | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      map = L.map(containerRef.current, {
        center: position ?? center,
        zoom,
        scrollWheelZoom: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      map.on("click", (e) => {
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => map?.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (async () => {
      const L = (await import("leaflet")).default;

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      if (position) {
        const marker = L.circleMarker(position, {
          radius: 10,
          color: "#ffffff",
          weight: 3,
          fillColor: "#10B981",
          fillOpacity: 1,
        }).addTo(map);
        markerRef.current = marker;
        map.setView(position, Math.max(map.getZoom(), 14), { animate: true });
      }
    })();
  }, [position]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: "100%", width: "100%", position: "relative", zIndex: 0 }}
    />
  );
}

export default PickableLeafletMap;
