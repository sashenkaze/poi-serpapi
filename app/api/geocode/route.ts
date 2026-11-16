import { NextRequest, NextResponse } from "next/server";

type Feature = {
  geometry: { coordinates: [number, number] }; // [lon, lat]
  properties: Record<string, string | undefined>;
};

function label(p: Feature["properties"]) {
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const parts = [p.name, street, p.district, p.city, p.state, p.country];
  return parts.filter((v, i) => v && parts.indexOf(v) === i).join(", ");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Parameter q kosong." }, { status: 400 });
  }

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "serp-poi-nextjs/1.0 (personal project)" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocoding gagal (${res.status}).` },
        { status: 502 }
      );
    }
    const json = (await res.json()) as { features?: Feature[] };

    // Bentuk disamakan dengan sebelumnya: { display_name, lat, lon }
    const out = (json.features ?? []).map((f) => ({
      display_name: label(f.properties),
      lat: String(f.geometry.coordinates[1]),
      lon: String(f.geometry.coordinates[0]),
    }));
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: "Geocoding gagal." }, { status: 502 });
  }
}