import { NextResponse } from "next/server";
import { parseNominatimReverse, type PlaceResult } from "@/lib/geocoding";

const USER_AGENT = "FleetMan/1.0 (fleet-management; contact@fleetman.cm)";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Nominatim unavailable" }, { status: 502 });
    }

    const raw = await res.json();
    return NextResponse.json(parseNominatimReverse(raw, lat, lng) satisfies PlaceResult);
  } catch {
    return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 });
  }
}
