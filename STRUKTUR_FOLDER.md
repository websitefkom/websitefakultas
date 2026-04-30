# STRUKTUR FOLDER (RINCI)

Dokumen ini menjelaskan semua folder dan subfolder yang ditemukan di proyek Next.js ini, beserta tujuan singkat tiap direktori dan file penting.

Ringkasan singkat:
- Root: konfigurasi proyek dan skrip.
- `app/`: kode aplikasi (App Router): halaman, layout, komponen halaman, dan API routes.
- `app/components/`: komponen tingkat aplikasi (Navbar, Footer, Dashboard components).
- `components/` & `components/ui/`: komponen UI reusable.
- `lib/`: utilitas dan integrasi eksternal (MongoDB, Cloudinary, helper).
- `models/`: schema Mongoose.
- `public/`: aset statis (gambar, logo, partner).
- `scripts/`: skrip utilitas/migrasi.

Detail lengkap (folder -> subfolder -> file contoh dan makna):

**Root (project root)**
- `package.json`, `package-lock.json`: dependency & scripts.
- `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`, `jsconfig.json`: konfigurasi Next.js, PostCSS, ESLint, dan alias/paths.
- `README.md`: dokumentasi proyek.
- `middleware.js`: middleware global Next.js (mis. auth/redirect).
- `components.json`, `.gitignore`: file konfigurasi dan ignore.

**app/**
- `page.js`: halaman utama (root).
- `layout.js`: layout global aplikasi.
- `globals.css`, `favicon.ico`: stylesheet global dan favicon.
- Subfolder halaman (setiap folder biasanya mewakili route):
  - `berita/`
    - `page.js`: daftar/halaman berita.
    - `[id]/`:
      - `page.js`: detail berita per id.
      - `ShareButtons.client.js`: komponen client untuk share.
  - `prodi/`
    - `page.js`: daftar program studi.
    - `[id]/page.js`: halaman detail prodi.
  - `prestasi/`
    - `page.js`: daftar prestasi.
    - `[id]/page.js`: detail prestasi.
  - `profil/page.js`: halaman profil institusi.
  - `strukturorganisasi/page.js`: halaman struktur organisasi.
  - `tautan/page.js`: halaman tautan eksternal.
  - `kontak/page.js`: halaman kontak.
  - `peraturan/page.js`: halaman peraturan.
  - `login/page.js`: halaman login.
  - `dashboard/`
    - `page.js`: halaman dashboard (umum).
    - `admin/`
      - `page.js`: dashboard admin.
      - `berita/page.js`: panel manajemen berita.
      - `akademik/`
        - `peraturan/page.js`
        - `prodi/page.js`
        - `prestasi/page.js`
      - `kontak/page.js`, `profil/page.js`, `pengaturan/page.js`: halaman admin terkait.

**app/components/**
- `BackToTop.jsx`: tombol kembali ke atas.
- `BeritaDetail.js`: komponen detail berita untuk halaman.
- `Navbar.js`, `Footer.js`: komponen navigasi dan footer.
- `Dashboard/`
  - `BeritaEditor.jsx`: editor berita untuk dashboard.
  - `Navbar.js`, `Footer.js`, `Sidebar.js`: komponen khusus dashboard.

**app/api/** (API routes — server handlers)
- `users/route.js`: endpoint users.
- `berita/route.js` dan `berita/[id]/route.js`: endpoint CRUD berita.
- `prestasi/route.js`: endpoint prestasi.
- `profil/route.js`: endpoint profil.
- `tautan/route.js`: endpoint tautan.
- `pdf/route.js`: endpoint untuk menyajikan/men-generate PDF.
- `seed/route.js`: endpoint seed data.
- `strukturorganisasi/route.js` dan `strukturorganisasi/[id]/route.js`.
- `akademik/`:
  - `peraturan/route.js`
  - `peraturan/dokumen/route.js`
  - `peraturan/upload/route.js`
  - `peraturan/[section]/route.js` (sub-section peraturan)
  - `prodi/route.js` dan `prodi/[id]/route.js`
- `auth/`:
  - `[...nextauth]/route.js`: NextAuth handler (OAuth/session).
  - `logout/route.js`: endpoint logout.

Catatan: file `route.js` di setiap folder API mengimplementasikan handler Next.js App Router (fungsi GET/POST/PUT/DELETE).

**components/** (di root)
- `ui/` (components/ui): komponen UI kecil yang dapat digunakan di seluruh aplikasi:
  - `button.jsx`, `card.jsx`, `tabs.jsx`, `toast.jsx`.
- Folder-level components:
  - `Navbar.js`, `Footer.js` (jika ada versi global di root `components/`).

**lib/**
- `mongodb.js`: util untuk koneksi MongoDB (client connection pooling).
- `mongoose.js`: konfigurasi/instansiasi Mongoose.
- `cloudinary.js`: konfigurasi Cloudinary untuk upload gambar.
- `utils.js`: fungsi pembantu umum.
- `prestasiId.js` dan `prestasiId.test.js`: helper khusus untuk ID prestasi dan test unitnya.

**models/**
- Model Mongoose (schema): `Berita.js`, `User.js`, `Prestasi.js`, `Prodi.js`, `Counter.js` — merepresentasikan koleksi DB utama.

**public/**
- `asset/`: asset gambar/icon (contoh: `integration-1.png`, `gear.png`, `check.png`).
- `background/`: gambar background (`pengurus.JPG`, `gedung1.jpg`, dsb.).
- `logo/`: logo dan gambar terkait (`logo.png`, `logopanjang.png`, `internal.jpg`, dll.).
- `partner/`: logo partner (bjb.png, cisco.png, dll.).
- file SVG/ikon: `next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg`.

**scripts/**
- `migrate-prodi-ids.js`: skrip migrasi untuk memperbarui ID prodi.
- `check-prestasi.js`: skrip untuk memeriksa/validasi data prestasi.

Tambahan / Catatan praktis:
- Untuk menelusuri implementasi endpoint, lihat `app/api/*/route.js` yang berisi handler HTTP.
- Untuk menambahkan komponen UI baru, letakkan di `components/ui/` atau `app/components/` bila khusus halaman.
- Untuk pengujian util kecil, lihat `lib/prestasiId.test.js`.

--
File ini diperbarui otomatis dengan daftar lengkap folder dan subfolder yang terdeteksi di workspace.

--
File ini dibuat otomatis untuk menjelaskan struktur proyek.
