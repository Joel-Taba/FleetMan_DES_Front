import { NextResponse } from "next/server";
import {
  parseNominatimSearch,
  type PlaceResult,
} from "@/lib/geocoding";

const USER_AGENT = "FleetMan/1.0 (fleet-management; contact@fleetman.cm)";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([] satisfies PlaceResult[]);
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "8");
    url.searchParams.set("addressdetails", "0");
    url.searchParams.set("countrycodes", "cm");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Nominatim unavailable" }, { status: 502 });
    }

    const raw = await res.json();
    return NextResponse.json(parseNominatimSearch(raw));
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
