# Design Spec — Dashboard Template

## 1. Ringkasan

Halaman **"Dasbor"** adalah landing page setelah login SSO. Terdiri dari: navbar atas (global, dipakai di semua halaman sebagai template), hero banner identitas aplikasi "IKHLAS", section **"Aplikasi"** berisi grid kartu feature module, dan footer. Layout ini menjadi template untuk halaman lain — bagian yang berubah per halaman adalah konten di bawah hero (atau hero-nya sendiri dihilangkan di halaman non-dasbor, tergantung kebutuhan).

## 2. Navbar (Desktop) — Komponen Global/Template

Satu baris horizontal, full width, background putih, border/shadow tipis di bawah.

Urutan dari kiri ke kanan:

- **Logo + brand**: ikon lingkaran logo "Ikhlas" (3 titik hijau-kuning tersusun vertikal dalam lingkaran hijau outline) + teks "Ikhlas" tebal.
- **Menu navigasi** (teks link horizontal):
  - "Dasbor" — state aktif: pill/badge hijau solid dengan ikon rumah, teks putih
  - "Aplikasi"
  - "Artikel"
  - "Umpan Balik" — teks abu-abu, non-aktif
- **Spacer** / flex-grow mendorong sisa item ke kanan
- **Ikon lonceng** (notifikasi) — abu-abu, tanpa badge di contoh
- **Ikon grid/module launcher** (titik 3x3) — navigasi antar-module/aplikasi lain dalam ekosistem SSO
- **Ikon user** (avatar bulat hijau) — trigger dropdown menu

**Dropdown user menu** (muncul saat avatar diklik, posisi menempel kanan bawah avatar):

- "My Profile" (ikon user)
- "Dark Mode" (ikon matahari/mode + toggle switch di kanan, aktif/hijau)
- "Logout" (ikon logout, warna teks merah)

## 3. Hero Banner (Khusus Halaman Dasbor)

- Full width, tinggi ~190px, background gradient hijau teal (dari hijau tua ke hijau muda, arah diagonal/horizontal), dengan foto overlay transparan di sisi kanan (foto orang berhijab) yang fade ke warna background di sisi kiri.
- **Isi kiri**:
  - Logo lingkaran putih (logo Ikhlas versi putih)
  - Teks besar huruf berspasi **"I K H L A S"** (huruf kapital, tracking lebar, putih, bold)
  - Subtitle kecil di bawahnya: *"Integrated Kyai Galang Sewu Administration System"* (putih, regular)

## 4. Section "Aplikasi"

- **Judul section**: "Aplikasi"
- **Grid kartu**, desktop 3 kolom x 2 baris (6 kartu contoh): Kesantrian, Keuangan, Keamanan (isi module menyesuaikan permission user).
- **Tiap kartu (FeatureModuleCard)**:
  - Card putih, border tipis abu-abu, rounded corner, padding
  - Kiri: judul module (bold) + deskripsi singkat 2 baris (abu-abu, teks placeholder)
  - Kanan: ikon outline hijau teal di dalam kotak (mis. ikon user/command/lock — melambangkan module)
  - Seluruh card clickable → navigasi ke module terkait

## 5. Footer

- Full width, background putih, border atas tipis
- Kiri: "© KGS Devnet 2024"
- Kanan: ikon sosial media (Twitter/X, VK, Telegram) — hitam solid, sejajar horizontal

## 6. Mobile Layout (< 768px)

- **Navbar atas menyusut**: hanya logo "Ikhlas" (kiri), lalu ikon lonceng, ikon grid module, ikon user (kanan) — teks menu dihilangkan dari navbar atas.
- **Hero banner**: tetap tampil, ukuran menyesuaikan lebar mobile, isi sama (logo + "IKHLAS" + subtitle), sedikit lebih pendek secara proporsional.
- **Section "Aplikasi"**: grid berubah jadi 1 kolom (list vertikal), tiap item tetap menampilkan judul, deskripsi singkat, dan ikon di kanan.
- **Bottom navigation bar** (baru, fixed di bawah):
  - Dasbor (ikon rumah)
  - Aplikasi (ikon grid)
  - Artikel (ikon globe)
  - Umpan Balik (ikon 2 orang/feedback)
- **Footer**: copyright tetap ada di atas bottom nav (center-aligned: "© KGS Devnet 2024"), ikon sosial media disembunyikan.

## 7. Desain Token (Perkiraan dari Gambar)

| Token | Nilai |
|-------|-------|
| Warna primer | Hijau teal (~#0F9B8E s/d #1FAE9E) |
| Gradient banner | Hijau tua → hijau muda, diagonal/horizontal |
| Aksen kartu/ikon | Outline teal senada, background icon box putih/abu sangat muda |
| Nav aktif (pill "Dasbor") | Hijau solid + teks putih |
| Warna logout (dropdown) | Merah |
| Tipografi brand "Ikhlas" | Sans-serif bold |
| Tipografi hero "IKHLAS" | Capital, letter-spacing lebar, bold, putih |
| Card | `rounded-lg`, border 1px solid abu-abu terang, shadow minimal/none, padding sedang |
| Container konten | Tidak full width — ada margin kiri-kanan cukup besar di desktop |
| Grid gap | Sedang |

> **Catatan**: `sipon-ui/app/app.config.ts` saat ini set `primary = blue`. Perlu keputusan apakah primary color project diganti ke teal/emerald agar sesuai mockup ini, atau mockup ini pakai palet khusus halaman dashboard saja.

## 8. Pemetaan Komponen ke Stack Project (Nuxt UI v4 + Lucide)

| Komponen | Keterangan |
|----------|------------|
| `layouts/default.vue` | Ganti dari sidebar jadi struktur: `<AppNavbar>` + `<slot>` + `<AppFooter>` |
| `AppNavbar.vue` | Brand, menu Dasbor/Aplikasi/Artikel/Umpan Balik, `AppNotificationBell`, `AppModuleLauncher`, `AppUserMenu` |
| `AppNotificationBell.vue` | Ikon `i-lucide-bell` |
| `AppModuleLauncher.vue` | Ikon `i-lucide-grid-3x3` + `UPopover`/`UDropdownMenu` berisi daftar module lain |
| `AppUserMenu.vue` | Avatar + `UDropdownMenu`: My Profile, Dark Mode toggle, Logout |
| `HeroBanner.vue` | Khusus dipakai di halaman Dasbor (bukan bagian layout global) |
| `FeatureModuleGrid.vue` | Grid "Aplikasi" — 3 kolom desktop, 1 kolom mobile |
| `FeatureModuleCard.vue` | `UCard`-based: judul, deskripsi, ikon kanan, clickable |
| `AppFooter.vue` | Copyright + social icons, dipakai global di layout |
| `AppMobileBottomNav.vue` | Fixed bottom bar, hanya tampil di mobile (`md:hidden`), 4 item menu |
