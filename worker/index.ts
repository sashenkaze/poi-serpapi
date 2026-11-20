interface Env {
  ALLOWED_ORIGIN: string;
  SERPAPI_KEY?: string;
}

const SERPAPI_URL = "https://serpapi.com/search.json";

function isInvalidKey(status: number, data: unknown) {
  const message =
    typeof data === "object" && data !== null && "error" in data
      ? String(data.error).toLowerCase()
      : "";
  return status === 401 || status === 403 || message.includes("invalid api key");
}

function jsonResponse(
  data: unknown,
  status: number,
  headers: Headers
): Response {
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const allowedOrigins = [
      env.ALLOWED_ORIGIN,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response("Origin tidak diizinkan.", { status: 403 });
    }

    const headers = new Headers({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "x-serpapi-key",
      "Access-Control-Expose-Headers": "x-key-source",
      "Vary": "Origin",
    });

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (request.method !== "GET" || url.pathname !== "/api/search") {
      return jsonResponse({ error: "Endpoint tidak ditemukan." }, 404, headers);
    }

    const q = url.searchParams.get("q")?.trim();
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    if (
      !q ||
      q.length > 200 ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return jsonResponse(
        { error: "Parameter q, lat, lng tidak valid." },
        400,
        headers
      );
    }

    const userKey = request.headers.get("x-serpapi-key")?.trim();
    const envKey = env.SERPAPI_KEY?.trim();
    const candidates = [
      ...(userKey ? [{ key: userKey, source: "input" }] : []),
      ...(envKey
        ? [{ key: envKey, source: userKey ? "env-fallback" : "env" }]
        : []),
    ];
    if (!candidates.length) {
      return jsonResponse(
        { error: "API key SerpApi belum dikonfigurasi." },
        400,
        headers
      );
    }

    let lastResponse: Response | undefined;
    let lastData: unknown;
    let lastSource = "";
    for (const candidate of candidates) {
      const serpUrl = new URL(SERPAPI_URL);
      serpUrl.search = new URLSearchParams({
        engine: "google_maps",
        type: "search",
        q,
        ll: `@${lat},${lng},15z`,
        hl: "id",
        api_key: candidate.key,
      }).toString();

      let response: Response;
      let data: unknown;
      try {
        response = await fetch(serpUrl);
        data = await response.json();
      } catch {
        return jsonResponse(
          { error: "Gagal menghubungi SerpApi." },
          502,
          headers
        );
      }

      lastResponse = response;
      lastData = data;
      lastSource = candidate.source;
      if (isInvalidKey(response.status, data)) continue;
      headers.set("x-key-source", candidate.source);
      return jsonResponse(data, response.status, headers);
    }

    if (!lastResponse) {
      return jsonResponse(
        { error: "Gagal menghubungi SerpApi." },
        502,
        headers
      );
    }

    headers.set("x-key-source", lastSource);
    return jsonResponse(lastData, lastResponse.status, headers);
  },
};

export default worker;
