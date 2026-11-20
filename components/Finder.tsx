"use client";

import { useEffect, useRef, useState } from "react";
import MapPreview from "@/components/MapPreview";
import PlaceCard from "@/components/PlaceCard";
import type { GeoResult, Loc, Place } from "@/lib/types";
import { geocode } from "@/lib/geocode";
import { fetchPlaces } from "@/lib/serpapi";

const LS_KEY = "serpapi_key";

export default function Finder() {
  // --- API key ---
  const [apiKey, setApiKey] = useState("");
  const [keyStatus, setKeyStatus] = useState("");

  // --- lokasi ---
  const [tab, setTab] = useState<"gps" | "search">("gps");
  const [loc, setLoc] = useState<Loc | null>(null);
  const [locQuery, setLocQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState("");
  const skipFetch = useRef(false);

  // --- pencarian tempat ---
  const [keyword, setKeyword] = useState("kafe");
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // muat key dari localStorage
  useEffect(() => {
    try {
      const k = localStorage.getItem(LS_KEY);
      if (k) setApiKey(k);
    } catch {}
  }, []);

  function saveKey() {
    try {
      if (apiKey.trim()) {
        localStorage.setItem(LS_KEY, apiKey.trim());
        setKeyStatus("Key disimpan di browser ini.");
      } else {
        localStorage.removeItem(LS_KEY);
        setKeyStatus("Key dihapus. Pencarian akan memakai key Worker.");
      }
    } catch {
      setKeyStatus("Gagal menyimpan key (localStorage tidak tersedia).");
    }
  }

  // --- geocode / autocomplete ---
  async function runGeocode(q: string, signal?: AbortSignal) {
    setGeoLoading(true);
    try {
      const data = await geocode(q, signal);
      setSuggestions(data);
      setShowSug(true);
      setGeoStatus(data.length ? "" : "Lokasi tidak ditemukan.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setGeoStatus(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setGeoLoading(false);
    }
  }

  // saran muncul saat mengetik (debounce 400 ms, minimal 3 huruf)
  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const q = locQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => runGeocode(q, ctrl.signal), 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [locQuery]);

  function pickGeo(g: GeoResult) {
    skipFetch.current = true; // jangan fetch ulang karena input diisi otomatis
    setLocQuery(g.display_name);
    setLoc({ lat: parseFloat(g.lat), lng: parseFloat(g.lon), label: g.display_name });
    setSuggestions([]);
    setShowSug(false);
    setGeoStatus("Lokasi dipilih.");
  }

  function useGps() {
    if (!navigator.geolocation) {
      setGeoStatus("Browser tidak mendukung geolocation.");
      return;
    }
    setGeoStatus("Mengambil lokasi...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLoc({
          lat: latitude,
          lng: longitude,
          label: `Lokasi GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        });
        setGeoStatus("Lokasi berhasil diambil.");
      },
      (err) => setGeoStatus(`Gagal mengambil lokasi: ${err.message}`),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // --- cari tempat ---
  async function searchPlaces() {
    if (!loc) {
      setSearchStatus("Tentukan lokasi terlebih dahulu.");
      return;
    }
    if (!keyword.trim()) return;
    setLoading(true);
    setSearchStatus("Mencari...");
    setPlaces(null);
    try {
      const { ok, data, source } = await fetchPlaces(
        keyword,
        String(loc.lat),
        String(loc.lng),
        apiKey.trim()
      );
      setRaw(data);
      if (!ok || data.error) throw new Error(data.error || "Pencarian gagal.");

      const list: Place[] =
        data.local_results ?? (data.place_results ? [data.place_results] : []);
      setPlaces(list);

      const note =
        source === "env-fallback"
          ? " Key di input tidak valid, memakai key Worker."
          : source === "env"
          ? " (memakai key Worker)"
          : "";
      setSearchStatus((list.length ? `${list.length} tempat ditemukan.` : "Tidak ada hasil.") + note);
    } catch (e) {
      setSearchStatus(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <p className="eyebrow">SerpApi · Google Maps Search</p>
      <h1>Cari kafe &amp; restoran</h1>
      <p className="lead">
        Cari tempat berdasarkan lokasi GPS atau lokasi yang kamu ketik. Setelah lokasi
        berhasil dipilih, preview peta akan muncul dan hasil tempat bisa dicari di sekitarnya.
      </p>

      {/* 1. API key */}
      <section className="card">
        <h2>1. Konfigurasi API</h2>
        <label htmlFor="apikey">SerpApi API Key</label>
        <div className="row">
          <input
            id="apikey"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Kosongkan untuk memakai key dari Cloudflare Worker"
          />
          <button className="primary" onClick={saveKey}>
            Simpan key
          </button>
        </div>
        <p className="hint">
          Key yang dimasukkan disimpan di localStorage browser ini. Jika kosong atau tidak
          valid, aplikasi memakai key yang disimpan di Cloudflare Worker.
        </p>
        {keyStatus && <p className="status">{keyStatus}</p>}
      </section>

      {/* 2. Lokasi */}
      <section className="card">
        <h2>2. Tentukan lokasi pencarian</h2>
        <div className="tabs">
          <button className={tab === "gps" ? "active" : ""} onClick={() => setTab("gps")}>
            GPS Saya
          </button>
          <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>
            Cari Lokasi
          </button>
        </div>

        {tab === "gps" ? (
          <div>
            <p className="hint">
              Gunakan lokasi perangkat saat ini. Browser akan meminta izin akses lokasi.
            </p>
            <button className="primary" onClick={useGps}>
              Ambil lokasi saya
            </button>
          </div>
        ) : (
          <div>
            <div className="row">
              <div className="suggest-wrap">
                <input
                  value={locQuery}
                  onChange={(e) => {
                    setLocQuery(e.target.value);
                    setShowSug(true);
                  }}
                  onFocus={() => suggestions.length && setShowSug(true)}
                  onBlur={() => setTimeout(() => setShowSug(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && locQuery.trim()) runGeocode(locQuery.trim());
                    if (e.key === "Escape") setShowSug(false);
                  }}
                  placeholder="Contoh: Blok M, Jakarta"
                  autoComplete="off"
                />
                {showSug && suggestions.length > 0 && (
                  <ul className="suggest-list">
                    {suggestions.map((g, i) => (
                      <li key={i}>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => pickGeo(g)}>
                          {g.display_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                className="primary"
                disabled={geoLoading}
                onClick={() => locQuery.trim() && runGeocode(locQuery.trim())}
              >
                {geoLoading ? "Mencari..." : "Cari lokasi"}
              </button>
            </div>
            {/* <p className="hint">
              Saran lokasi muncul saat kamu mengetik. Pilih salah satu, atau tekan Enter /
              klik Cari lokasi.
            </p> */}
          </div>
        )}

        {geoStatus && <p className="status">{geoStatus}</p>}
        {loc && <MapPreview loc={loc} />}
      </section>

      {/* 3. Cari tempat */}
      <section className="card">
        <h2>3. Cari kafe atau restoran</h2>
        <label htmlFor="kw">Kata kunci</label>
        <div className="row">
          <input
            id="kw"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
          />
          <button className="primary" onClick={searchPlaces} disabled={loading}>
            {loading ? "Mencari..." : "Cari tempat"}
          </button>
        </div>
        <p className="hint">
          Tentukan lokasi terlebih dahulu agar pencarian memakai koordinat yang sesuai.
        </p>
        {searchStatus && <p className="status">{searchStatus}</p>}
      </section>

      {/* Hasil */}
      <section className="card">
        <h2>Hasil pencarian</h2>
        {places === null ? (
          <p className="muted">Belum ada hasil</p>
        ) : places.length === 0 ? (
          <p className="muted">Tidak ada hasil</p>
        ) : (
          <div className="places">
            {places.map((p, i) => (
              <PlaceCard key={p.place_id ?? i} p={p} />
            ))}
          </div>
        )}

        <details>
          <summary>
            <strong>Lihat response JSON</strong>
          </summary>
          <pre>{raw ? JSON.stringify(raw, null, 2) : "Belum ada response."}</pre>
        </details>

        <p className="hint">
          Catatan: SerpApi menyampaikan hasil Google Maps, tetapi parameter koordinat tidak
          menjamin seluruh hasil pasti berada di dalam radius tertentu. Periksa alamat dan
          posisi hasil sebelum menganggapnya benar-benar dekat.
        </p>
      </section>
    </main>
  );
}