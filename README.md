# Heula

Heula adalah aplikasi mobile PWA buat intermittent fasting (IF). Dibikin pakai Next.js 15 (App Router) dan jalan sepenuhnya di sisi klien: gak ada backend, gak ada login, dan semua datamu disimpan di HP kamu sendiri. Tampilannya mobile-first ala iOS dengan bahasa santai, biar ngatur jadwal puasa dan pantau progres kerasa gampang.

## Jalanin aplikasinya

Pastikan Node.js versi terbaru udah kepasang, terus jalanin:

```bash
npm install      # pasang semua dependency
npm run dev      # mode development di http://localhost:3000
npm run build    # build produksi (service worker Serwist ikut di-generate)
npm start        # jalanin hasil build produksi
npm test         # jalanin semua unit test (Vitest)
```

Catatan penting: service worker (offline + installable) sengaja dimatiin di `npm run dev` biar gak ganggu caching. Jadi perilaku offline/install cuma bisa dicek dari `npm run build` lalu `npm start`.

## Fitur

- **Profiling di awal**: jawab tujuan puasa kamu (turun berat badan, kesehatan metabolik, fokus, maintain, atau coba-coba), apakah kamu olahraga, dan seberapa intens olahraganya.
- **Rekomendasi metode IF**: berdasarkan jawaban profiling, Heula ngasih saran metode yang paling cocok. Ini cuma rekomendasi, kamu tetap bebas pilih metode lain yang kamu mau.
- **Pilihan metode lengkap**: 14:10, 16:8, 18:6, 20:4, OMAD, dan custom (atur jam puasa sendiri 8 sampai 23 jam). Metode 5:2 ditampilin sebagai info aja, belum masuk timer.
- **Timer puasa live**: progress ring, hitungan HH:MM:SS, target waktu buka, sisa waktu, dan indikator tahap puasa (Pencernaan, Mulai bakar lemak, Ketosis, Autophagy, Deep fast). Bisa lanjut ngitung lewat target (overfast).
- **Ubah waktu mulai**: geser waktu mulai ke lebih awal; waktu di masa depan ditolak.
- **Riwayat**: catatan puasa dikelompokin per hari, lengkap sama durasi, metode, dan badge target tercapai / disudahi lebih awal. Bisa hapus dengan konfirmasi.
- **Statistik**: streak sekarang, streak terpanjang, total puasa, total jam, rata-rata durasi, plus grafik batang 7 hari terakhir (dibikin tanpa library chart) dan tujuan profiling kamu.
- **Pengaturan**: ganti metode aktif (termasuk jam custom), atur target harian, pilih tema (ikut sistem / terang / gelap), kelola pengingat, atur ulang profil, dan reset semua data.
- **PWA**: bisa di-install ke home screen dan punya halaman fallback saat offline.

## Konvensi tampilan

- **Tanpa emoji** di seluruh teks aplikasi (UI, copy, toast, notifikasi, dan data apa pun). Aturan ini dijaga oleh unit test yang nge-scan seluruh `src` dan README.
- **Ikon cuma dari `react-icons/io5`** (Ionicons), lewat satu choke point di `src/components/ui/Icon.tsx`. Gak ada `lucide-react` atau subset `react-icons` lain.

## Data dan privasi

- Semua data (riwayat puasa, profil, pengaturan) disimpan di HP kamu: riwayat di IndexedDB (via Dexie), profil dan pengaturan di `localStorage` (via Zustand). Gak ada data yang dikirim ke server mana pun.
- Aplikasi jalan offline setelah di-build dan dibuka sekali.

## Pengingat

Pengingat (saat buka atau mulai puasa) dijadwalin lewat Service Worker, jadi bisa muncul walau aplikasi lagi ketutup. Sifatnya tetap best-effort: tergantung sistem operasi mau nahan Service Worker-nya tetap hidup, dan ini bukan alarm native (PWA gak bisa nyetel alarm/jam bawaan HP, cuma notifikasi web). Kalau Service Worker gak tersedia, ada fallback `setTimeout` di dalam halaman yang cuma jalan selama tab kebuka. Di iOS, PWA harus dipasang dulu ke layar utama (iOS 16.4+) biar notifikasi bisa aktif. Kalau browser kamu gak dukung notifikasi atau izinnya ditolak, timer tetap jalan normal.

## Smoke checklist (manual)

Alur yang bergantung ke DOM/IndexedDB dicek manual (unit test fokus ke logika murni di `src/lib`). Setelah `npm run build` dan `npm start`, cek:

1. **Onboarding gating**: buka aplikasi dalam keadaan belum onboarding; harusnya diarahkan ke `/onboarding`. Setelah selesai, balik ke Home.
2. **Timer ke Dexie**: mulai puasa, lalu sudahi; catatan baru harus muncul di Riwayat.
3. **Hapus riwayat live**: hapus satu catatan di Riwayat; daftarnya harus langsung ter-update tanpa reload.
4. **Tema persisten**: ganti tema ke gelap/terang di Profil, reload halaman; pilihan tema harus tetap kebawa tanpa kedip.
5. **Shell offline**: setelah build, matikan koneksi, lalu buka ulang; halaman fallback offline harus tampil.
