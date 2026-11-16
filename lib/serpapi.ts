const SERP_URL = "https://serpapi.com/search.json";

type Source = "input" | "env" | "env-fallback";

function isInvalidKey(status: number, data: unknown) {
  const msg = String((data as { error?: string })?.error ?? "").toLowerCase();
  return status === 401 || status === 403 || msg.includes("invalid api key");
}

export async function serpFetch(
  params: Record<string, string>,
  userKey?: string | null
): Promise<{ status: number; data: unknown; source: Source | null }> {
  const input = userKey?.trim();
  const env = process.env.SERPAPI_KEY?.trim();

  const tries: { key: string; source: Source }[] = [];
  if (input) tries.push({ key: input, source: "input" });
  if (env) tries.push({ key: env, source: input ? "env-fallback" : "env" });

  if (!tries.length) {
    return {
      status: 400,
      data: { error: "API key belum diisi dan SERPAPI_KEY di env juga kosong." },
      source: null,
    };
  }

  let last: { status: number; data: unknown; source: Source } | null = null;

  for (const t of tries) {
    const url = new URL(SERP_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set("api_key", t.key);

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({ error: "Response bukan JSON." }));
    last = { status: res.status, data, source: t.source };

    if (!isInvalidKey(res.status, data)) return last; // valid (atau error lain) → berhenti
    // key tidak valid → coba kandidat berikutnya (env)
  }

  return last!;
}