import type { Place } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export type PlacesSearchResponse = {
  local_results?: Place[];
  place_results?: Place;
  error?: string;
};

export async function fetchPlaces(
  q: string,
  lat: string,
  lng: string,
  apiKey: string,
  signal?: AbortSignal
) {
  if (!API_BASE_URL) {
    throw new Error(
      "API belum dikonfigurasi. Atur NEXT_PUBLIC_API_BASE_URL ke URL Cloudflare Worker."
    );
  }

  const url = new URL("/api/search", API_BASE_URL);
  url.search = new URLSearchParams({
    q,
    lat,
    lng,
  }).toString();

  const headers = new Headers();
  if (apiKey) headers.set("x-serpapi-key", apiKey);

  const res = await fetch(url, { headers, signal });
  const data = (await res.json()) as PlacesSearchResponse;
  return {
    ok: res.ok,
    data,
    source: res.headers.get("x-key-source"),
  };
}