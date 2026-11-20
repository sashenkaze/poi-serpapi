# Cari Kafe Terdekat

Next.js static frontend untuk mencari kafe/restoran di sekitar lokasi. Geocoding memakai Photon, sedangkan pencarian SerpApi dijalankan melalui Cloudflare Worker agar API key tidak dimasukkan ke file statis.

## Deploy

1. Buat Cloudflare API token dengan izin deploy Workers, lalu tambahkan repository secrets berikut:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `SERPAPI_KEY`
2. Push ke branch `main` atau jalankan workflow **Deploy Cloudflare Worker**. Worker mengizinkan origin `https://sashenkaze.github.io`; jika memakai domain Pages sendiri, ubah `ALLOWED_ORIGIN` di `wrangler.toml`.
3. Setelah Worker ter-deploy, salin URL Worker (misalnya `https://poi-serpapi-api.<subdomain>.workers.dev`) dan buat repository variable `NEXT_PUBLIC_API_BASE_URL` dengan URL tersebut.
4. Di pengaturan repository, buka **Settings → Pages** dan pilih **GitHub Actions** sebagai build/deployment source.
5. Push ke `main` atau jalankan workflow **Deploy GitHub Pages**. Situs akan tersedia di `https://sashenkaze.github.io/poi-serpapi/`.

Workflow Pages sengaja meminta `NEXT_PUBLIC_API_BASE_URL` agar situs tidak dipublikasikan dengan pencarian yang belum terhubung ke API. URL ini bersifat publik; jangan taruh API key di dalamnya. Atur batas penggunaan pada akun SerpApi karena CORS hanya mengatur akses browser, bukan autentikasi endpoint publik.

## Development

```powershell
npm ci
$env:NEXT_PUBLIC_API_BASE_URL = "https://poi-serpapi-api.<subdomain>.workers.dev"
npm run dev
```

Photon geocoding dapat dipanggil langsung dari browser karena mengizinkan CORS. SerpApi tidak mengizinkan origin browser, sehingga API route Next.js lokal sebelumnya tidak dapat dipakai pada GitHub Pages; Cloudflare Worker menjadi proxy server-side dan menambahkan CORS untuk origin aplikasi.
