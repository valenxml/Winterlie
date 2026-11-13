# Winterlie

Satu workspace untuk merencanakan, mendesain, dan membangun website. Fitur utama saat ini: **Mockup Maker** (brief → tiga arah desain → editor per section dengan versi), **Color Palette**, dan **Typography**.

## Struktur

```
apps/
  api/        NestJS: projects, desain, AI provider, auth dev sementara
  web/        Next.js: UI aplikasi dan landing page
packages/
  database/       Prisma schema dan migrasi (PostgreSQL)
  design-schema/  Schema desain, template arah desain, dan operasi edit
  validators/     Validasi input (project, brief)
docs/           Catatan arsitektur
```

## Prasyarat

- **Node.js 22 atau 24 LTS** (installer `.msi` dari nodejs.org). Jangan pakai fnm atau nvm untuk setup pertama.
- **pnpm**: `npm install -g pnpm`
- **PostgreSQL 16** (installer EDB). Catat password user `postgres`. Stack Builder tidak diperlukan.
- **pgAdmin 4** (ikut terpasang dengan installer EDB), untuk membuat database.

Docker tidak diperlukan.

## Setup pertama kali

1. **Install dependensi**
   ```
   pnpm install
   ```

2. **Buat database.** Di pgAdmin: klik kanan **Databases → Create → Database**, nama `ai_workshop`.

3. **Buat file environment.** Dari root proyek:
   ```
   copy .env.example .env
   copy packages\database\.env.example packages\database\.env
   copy apps\web\.env.local.example apps\web\.env.local
   ```
   Isi `.env` (root) dan `packages\database\.env` dengan `DATABASE_URL` yang sama:
   ```
   DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@localhost:5432/ai_workshop?schema=public
   ```
   Ganti `PASSWORD_ANDA`. Jika password mengandung `@ # % /`, tulis dalam bentuk URL-encoded (`%40`, `%23`, `%25`, `%2F`).

4. **Migrasi database dan generate client**
   ```
   pnpm --filter @workshop/database generate
   pnpm --filter @workshop/database migrate:dev
   ```
   Saat diminta nama migrasi, ketik `init`.

5. **Buat `AUTH_SECRET`.** Isi di `.env` dengan string acak minimal 32 karakter, misalnya hasil dari:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```
   Lalu buka `http://localhost:3000/login` dan daftar akun.

6. **(Opsional, untuk development) Buat user dev.** Di pgAdmin, buka Query Tool untuk `ai_workshop`, lalu jalankan:
   ```sql
   INSERT INTO users (id, email, "updatedAt")
   VALUES (gen_random_uuid(), 'dev@local.test', now())
   RETURNING id;
   ```
   Salin `id` yang muncul. Isi di `apps\web\.env.local`:
   ```
   NEXT_PUBLIC_DEV_USER_ID=ID_YANG_DISALIN
   ```
   Dan pakai ID yang sama sebagai header `x-dev-user-id` saat memanggil API langsung.

6. **Build paket internal** (wajib sebelum typecheck API dan web):
   ```
   pnpm --filter @workshop/validators build
   pnpm --filter @workshop/design-schema build
   ```

7. **Cek kode dan test**
   ```
   pnpm typecheck
   pnpm test
   ```

## Database online (Neon atau Supabase)

Aplikasi memakai dua koneksi:
- `DATABASE_URL`: untuk aplikasi. Pakai versi **pooled** (Neon) atau **transaction pooler** (Supabase).
- `DIRECT_URL`: untuk migrasi. Pakai koneksi **langsung**, tanpa pooler.

Isi keduanya di `.env` root **dan** `packages\database\.env`. Kalau `DIRECT_URL` tidak ada, `prisma generate` dan `migrate` akan gagal dengan "Environment variable not found: DIRECT_URL". Contoh untuk Neon dan Supabase ada di `.env.example`.

Untuk pemindahan dari PostgreSQL lokal, jalankan `scripts\update.bat` setelah mengisi kedua variabel. Migrasi yang sudah tercatat tidak akan dijalankan ulang.

## Update ke versi baru

Setelah mengambil kode terbaru (dari `git pull` atau ekstrak ZIP baru), jalankan dari root proyek:
```
scripts\update.bat
```
Skrip ini memasang dependensi, menerapkan migrasi database yang baru, membangun paket internal, lalu menjalankan typecheck dan test. Ia berhenti di langkah pertama yang gagal.

Setelah sukses, restart API dan web (Ctrl+C, lalu jalankan lagi).

**Yang tidak disentuh skrip:** `.env`, `packages\database\.env`, dan `apps\web\.env.local`. Jangan timpa file-file ini saat mengekstrak ZIP baru.

## Menjalankan

Dua terminal, dari root proyek:
```
pnpm --filter @workshop/api dev
pnpm --filter @workshop/web dev
```

- API: http://localhost:4000 (cek `/health`)
- Web: http://localhost:3000

## Konfigurasi AI

Default: `AI_DEFAULT_PROVIDER=mock`, tanpa key. Mock dipakai untuk pengembangan. Mockup Maker saat ini membuat arah desain dengan template, sehingga tetap berjalan tanpa AI.

Untuk Gemini:
```
AI_DEFAULT_PROVIDER=gemini
GEMINI_API_KEY=KEY_ANDA
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODELS=gemini-3.7-flash-08-2026
```
Cek model yang tersedia untuk key Anda dengan `curl.exe -H "x-goog-api-key: KEY_ANDA" https://generativelanguage.googleapis.com/v1beta/models`. Model bisa dihentikan atau sibuk sewaktu-waktu, jadi jangan menganggap nama model di atas permanen.

Endpoint cek koneksi: `POST /ai/test` (butuh header `x-dev-user-id`).

## Keamanan

- **Jangan commit** `.env`, `.env.local`, atau file apa pun yang berisi password atau key. `.gitignore` sudah mengabaikannya.
- Login memakai email dan password (hash scrypt). Sesi disimpan di cookie HttpOnly yang ditandatangani dengan `AUTH_SECRET`. Ganti `AUTH_SECRET` jika bocor, karena semua sesi akan tidak berlaku.
- Header `x-dev-user-id` hanya aktif jika `AUTH_DEV_BYPASS=true` dan `NODE_ENV` bukan `production`. Matikan untuk produksi.
- Belum ada pembatasan percobaan login (rate limit). Tambahkan sebelum dipublikasikan.
- Output AI dan teks dari user diperlakukan sebagai data. Teks yang mengandung `<` atau `>` ditolak, dan link hanya boleh `http`, `https`, `mailto`, atau anchor internal.

## Perintah berguna

| Perintah | Fungsi |
|---|---|
| `pnpm typecheck` | Cek tipe semua paket |
| `pnpm test` | Jalankan semua test |
| `pnpm --filter @workshop/database migrate:dev` | Buat migrasi baru setelah ubah schema |
| `pnpm --filter @workshop/database generate` | Regenerate Prisma client |

## Masalah umum

- **`ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` saat dev API**: jalankan `pnpm --filter @workshop/design-schema build` dulu, lalu coba lagi.
- **`Environment variable not found: DATABASE_URL`**: `packages\database\.env` belum dibuat.
- **`P1000 Authentication failed`**: password di `DATABASE_URL` salah.
- **`Cannot POST /projects/.../ops` (404)**: API masih berjalan dengan kode lama. Hentikan dengan Ctrl+C, lalu jalankan ulang.
- **Halaman `/projects` error "two parallel pages"**: masih ada folder `apps\web\app\projects` lama. Hapus folder itu.
