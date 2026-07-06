/**
 * Client géocodage — proxy Next.js vers Nominatim (OpenStreetMap).
 */

export type PlaceResult = {
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
};

type NominatimSearchItem = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type NominatimReverse = {
  display_name?: string;
};

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`, {
    signal,
  });
  if (!res.ok) throw new Error("Geocoding search failed");
  const data = (await res.json()) as PlaceResult[];
  return data;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<PlaceResult> {
  const res = await fetch(
    `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
    { signal }
  );
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json() as Promise<PlaceResult>;
}

export function formatCoordsLabel(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function parseNominatimSearch(items: NominatimSearchItem[]): PlaceResult[] {
  return items.map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    placeId: String(item.place_id),
  }));
}

export function parseNominatimReverse(
  data: NominatimReverse,
  lat: number,
  lng: number
): PlaceResult {
  return {
    label: data.display_name ?? formatCoordsLabel(lat, lng),
    lat,
    lng,
  };
}

/** Yaoundé — centre par défaut Cameroun */
export const DEFAULT_MAP_CENTER: [number, number] = [3.848, 11.502];
