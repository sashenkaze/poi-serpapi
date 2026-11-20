import type { GeoResult } from "@/lib/types";

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
};

function label(p: Feature["properties"]) {
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const parts = [p.name, street, p.district, p.city, p.state, p.country];
  return parts.filter((v, i) => v && parts.indexOf(v) === i).join(", ");
}

export async function geocode(q: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q.trim());
  url.searchParams.set("limit", "6");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocoding gagal (${res.status}).`);
  const json = (await res.json()) as { features?: Feature[] };

  return (json.features ?? []).map((f) => ({
    display_name: label(f.properties),
    lat: String(f.geometry.coordinates[1]),
    lon: String(f.geometry.coordinates[0]),
  }));
}