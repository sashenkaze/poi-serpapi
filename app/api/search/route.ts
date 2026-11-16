import { NextRequest, NextResponse } from "next/server";
import { serpFetch } from "@/lib/serpapi";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const lat = sp.get("lat");
  const lng = sp.get("lng");

  if (!q || !lat || !lng) {
    return NextResponse.json(
      { error: "Parameter q, lat, lng wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const { status, data, source } = await serpFetch(
      {
        engine: "google_maps",
        type: "search",
        q,
        ll: `@${lat},${lng},15z`,
        hl: "id",
      },
      req.headers.get("x-serpapi-key")
    );

    return NextResponse.json(data, {
      status,
      headers: source ? { "x-key-source": source } : {},
    });
  } catch {
    return NextResponse.json({ error: "Gagal menghubungi SerpApi." }, { status: 502 });
  }
}