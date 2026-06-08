# WebGIS PM2.5 Frontend

WebGIS PM2.5 adalah aplikasi web interaktif yang menyajikan data kualitas udara (khususnya PM2.5) secara real-time, prediksi, dan estimasi berbasis lokasi spasial. Aplikasi ini dibangun menggunakan **Next.js** dan mengambil data dari backend API tersendiri.

## Fitur Utama

- **Peta PM2.5 Aktual:** Menampilkan kualitas udara berdasarkan stasiun secara real-time.
- **Peta PM2.5 Estimasi:** Estimasi kualitas udara di berbagai titik.
- **Peta PM2.5 Prediksi:** Prediksi kualitas udara untuk beberapa waktu ke depan.
- **Data Cuaca & Kalender:** Informasi cuaca dan historis kualitas udara.

## Prasyarat

Pastikan komputer/server telah menginstal:
- Node.js (versi 18.x atau lebih baru)
- npm, yarn, atau pnpm

## Konfigurasi Lingkungan

Sebelum menjalankan aplikasi, perlu menghubungkan *frontend* ini ke *backend* API utama. 

1. Buat file `.env.local` di *root directory* proyek ini (sejajar dengan file `package.json`).
2. Tambahkan variabel `API_BASE_URL` yang menunjuk ke alamat backend Anda.
   ```env
   API_BASE_URL=http://127.0.0.1:8000
   ```
   *(Sesuaikan port dan IP dengan backend Anda)*

## Instalasi dan Menjalankan Proyek

1. **Install dependensi:**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

2. **Jalankan Development Server:**
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

3. Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasinya.

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
