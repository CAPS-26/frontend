# Frontend Module

Aplikasi web interaktif (WebGIS) untuk memvisualisasikan data kualitas udara (PM2.5) dan cuaca secara real-time, prediksi, dan estimasi berbasis lokasi spasial untuk wilayah Jakarta.

## Struktur Proyek
```text
frontend/
├── app/                      # Next.js App Router (Halaman & Rute API Internal)
│   ├── api/                  # Rute proxy internal untuk menghubungi Backend
│   ├── pm25-aktual/          # Halaman peta PM2.5 aktual
│   ├── pm25-estimasi/        # Halaman peta estimasi PM2.5
│   ├── pm25-prediksi/        # Halaman peta prediksi PM2.5
│   └── calendar/             # Halaman kalender historis & prediksi
├── components/               # Komponen UI interaktif (React)
│   ├── map/                  # Komponen peta Leaflet & Layer Spasial
│   ├── navbar/               # Komponen navigasi utama
│   └── calendar/             # Komponen visualisasi data kalender
├── lib/                      # Utilitas dan konfigurasi
│   ├── api/                  # Konfigurasi proxy fetch ke backend
│   └── config.ts             # Pengaturan lingkungan global
├── public/                   # Aset statis (gambar, ikon indikator)
├── styles/                   # CSS Modules dan global CSS
├── .env.example              # Contoh konfigurasi environment
├── next.config.ts            # Konfigurasi aplikasi Next.js
└── package.json              # Dependensi dan script Node.js
```

## Menjalankan Secara Lokal (tanpa Docker)

### 1. Dependensi sistem
Pastikan Anda telah menginstal:
- **Node.js** (versi 18.x atau lebih baru disarankan)
- **npm**, **yarn**, atau **pnpm** (pilih salah satu)

### 2. Lingkungan Node.js
Buka terminal di dalam folder proyek ini dan jalankan instalasi dependensi:
```bash
npm install
```

### 3. Environment Variables (wajib)
Aplikasi frontend membutuhkan konfigurasi `.env.local` untuk mengarahkan rute proxy internal menuju server backend yang sebenarnya.

```bash
cp .env.example .env.local
# Edit .env.local dengan nilai Anda
```

| Variabel | Deskripsi |
|---|---|
| `API_BASE_URL` | Base URL untuk server backend (contoh: `http://127.0.0.1:8000`) |

### 4. Jalankan server pengembangan
```bash
npm run dev
```
Aplikasi frontend akan tersedia di http://localhost:3000

## Mem-build untuk Produksi
Jika Anda ingin men-deploy aplikasi ini ke server produksi:

1. **Jalankan perintah build:**
   ```bash
   npm run build
   ```
2. **Jalankan server production:**
   ```bash
   npm run start
   ```

## Catatan Operasional
- **Proxy API**: Frontend menggunakan fitur Server API Routes dari Next.js (`app/api/`) untuk meneruskan permintaan secara aman ke Backend utama (Django/FastAPI). Hal ini mencegah permasalahan CORS langsung pada browser klien.
- **Peta Spasial**: Menggunakan `react-leaflet` untuk menampilkan data GeoJSON dinamis (titik stasiun maupun poligon estimasi AOD).
- **Pengambilan Data**: Fetch data dari backend murni mengandalkan ketersediaan server API. Semua komponen *dummy data* telah dibersihkan secara permanen.

## Internal API Routes (Proxy)
Base URL dari sisi klien: `/api` (Hanya digunakan secara internal oleh komponen frontend)

| Method | Path | Deskripsi (Proxy Tujuan Backend) |
|---|---|---|
| GET | `/aod/` | Proxy poligon AOD kemarin ke `/api1/get-data-aod/` |
| POST | `/aod/aod-by-date/` | Proxy poligon AOD historis ke `/api1/get-data-aodbydate/` |
| GET | `/pm25-aktual/` | Proxy titik PM2.5 aktual ke `/api1/get-data-pm25-aktual/` |
| POST | `/pm25-aktual/pm25-aktual-by-date/` | Proxy historis PM2.5 ke `/api1/get-data-pm25-aktualbydate/` |
| GET | `/pm25-est/` | Proxy estimasi poligon PM2.5 ke `/api1/get-data-pm25/` |
| POST | `/pm25-est/pm25-est-by-date/` | Proxy estimasi PM2.5 historis ke `/api1/get-data-pm25bydate/` |
| GET | `/pm25-prediksi/` | Proxy titik PM2.5 prediksi ke `/api1/get-data-pm25-prediksi/` |
| POST | `/pm25-prediksi/pm25-prediksi-by-date/` | Proxy PM2.5 prediksi per tanggal ke `/api1/get-data-pm25-prediksibydate/` |
| GET | `/weather/` | Proxy info cuaca terkini ke `/api2/weather/weatherdata-now/` |
| POST | `/weather/weather-by-date/` | Proxy riwayat cuaca historis ke `/api2/weather/weatherdatabydate/` |
