# PABWE 2026 Praktikum 8 (Laravel 13, Inertia.js & React)

Aplikasi web berbasis **Laravel 13**, **Inertia.js**, dan **React** dengan arsitektur **Clean Architecture & Feature-First Approach**. Basis data memakai **PostgreSQL (`pabwe_p8_blog`)**, ekspor/impor spreadsheet memakai **PhpOffice/PhpSpreadsheet**, dan pembuatan konten otomatis memakai **OpenAI**.

Disusun oleh **Joyce Stephanie Naibaho**.

---

## Fitur Utama

1. **Clean Architecture & Feature-First Approach**
   - Modul diorganisir per fitur/domain di `App\Features\*` (Auth, Admin, Ai, Profile, dan fitur utama aplikasi).
   - Dependency Inversion lewat repository interface dan `AiClientInterface`.
   - Pemisahan lapisan yang jelas: Actions, Repositories, Services, DTO, Policies, Controllers, dan komponen React (Inertia.js).

2. **Autentikasi & Otorisasi Berbasis Role**
   - Login dengan **username atau email**.
   - Form login memakai ID standar: `login-username`, `login-password`, `login-submit`.
   - Role `admin` mengakses manajemen pengguna (`/admin/users`) dalam mode baca saja.
   - Role `member` (otomatis untuk pendaftar baru) mengelola datanya sendiri.
   - `EnsureRole`, middleware kepemilikan, dan Policy mencegah akses ke data milik orang lain.

3. **Ekspor & Impor Excel**
   - Ekspor ke `.xlsx` dengan styling (header berwarna, border, text wrap, auto size).
   - Impor `.xlsx`, `.xls`, dan `.csv` dengan validasi data.

4. **Generator Konten dengan AI (OpenAI)**
   - Dikonfigurasi lewat `.env`: `OPENAI_ENDPOINT`, `OPENAI_KEY`, `OPENAI_MODEL`.
   - Hasil generate divalidasi ke dalam DTO, dapat dipratinjau, dipilih, lalu disimpan.

5. **UI**
   - Tampilan daftar (list view), menu aksi kebab (⋮), kartu statistik ringkas.
   - Editor dan viewer Markdown memakai TOAST UI Editor.
   - Modal dengan header dan footer berwarna kontras.

6. **Keamanan**
   - Rate limiting via `RateLimiter::for('1000-per-second', ...)`.
   - Force HTTPS lewat `FORCE_HTTPS=true` atau otomatis pada environment `production`.
   - Dependensi diperiksa dengan `composer audit`.

---

## Struktur Direktori

```
app/
├── Features/
│   ├── Admin/      (Controllers, Services)
│   ├── Ai/         (Contracts, DTO, Services)
│   ├── Auth/       (Actions, Controllers)
│   ├── Profile/    (Controllers, Services)
│   └── <Fitur utama>/ (Contracts, Controllers, Enums, Models,
│                       Policies, Repositories, Services)
├── Http/Middleware/
├── Models/
└── Providers/

resources/js/
├── Components/
├── Layouts/
└── Pages/
```

## Instalasi & Menjalankan Proyek

1. Masuk ke direktori proyek (folder tempat repositori ini berada).

2. Buat database:
   ```bash
   psql -U postgres -c "CREATE DATABASE pabwe_p8_blog;"
   ```

3. Instal dependensi:
   ```bash
   composer install
   npm install
   ```

4. Salin `.env` dan buat app key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. Migrasi dan seeding data awal:
   ```bash
   php artisan migrate:fresh --seed
   ```

   Akun bawaan seeder:

   | Role   | Username | Email               | Password |
   |--------|----------|---------------------|----------|
   | Admin  | `admin`  | `admin@example.com` | `admin`  |
   | Member | `member` | `member@example.com`| `member` |

6. Build frontend dan jalankan aplikasi:
   ```bash
   npm run build
   php artisan serve
   ```
   Buka `http://localhost:8000`.

### Catatan Direktori Storage

Direktori berikut harus ada sebelum menjalankan perintah `artisan` (terutama pada clone baru atau pipeline CI): `storage/framework/views`, `storage/framework/cache/data`, `storage/framework/sessions`, `storage/framework/testing`, dan `storage/logs`.

Direktori `storage/framework/views` wajib ada, karena jika hilang `php artisan view:clear` gagal dengan `RuntimeException: View path not found`. Keberadaannya dijaga lewat file `.gitignore` di dalam masing-masing folder, jadi file tersebut jangan dihapus.

---

## Pengujian

```bash
composer test
```

Perintah ini menjalankan seluruh unit test dan feature test beserta laporan code coverage (butuh Xdebug atau PCOV). Pemeriksaan keamanan dependensi:

```bash
composer audit
```