# Frae

Frae adalah proyek ERP modular yang sedang dibangun dengan backend Laravel, frontend Next.js, komponen UI shadcn-style, dan lingkungan development berbasis Docker. Fokus awal proyek ini adalah fondasi ERP internal: autentikasi, struktur organisasi, role/permission, audit log, penomoran dokumen, dan dashboard untuk modul bisnis utama.

## Stack

- Backend: Laravel 13, PHP 8.3, Laravel Sanctum
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn-style components
- Database: PostgreSQL 16
- Cache/queue: Redis 7
- Object storage: MinIO
- Web server API: Nginx + PHP-FPM
- Development runtime: Docker Compose

## Struktur Project

```txt
frae/
├── apps/
│   ├── api/                 # Laravel API
│   │   ├── app/Modules/Core # Modul core ERP
│   │   ├── database/        # Migration dan seeder
│   │   └── routes/api.php   # API routes
│   └── web/                 # Next.js frontend
│       ├── src/app/         # App Router pages/layouts
│       ├── src/components/  # Layout dan UI components
│       └── src/lib/api.ts   # API fetch helper
├── docker/
│   ├── nginx/api.conf       # Nginx config untuk Laravel
│   └── php/Dockerfile       # PHP-FPM image
└── docker-compose.yml
```

## Service Docker

| Service | Container | Port Host | Fungsi |
| --- | --- | --- | --- |
| web | erp_web | 3000 | Next.js frontend |
| nginx | erp_nginx | 8080 | Public API gateway ke Laravel |
| api | erp_api | 9000 internal | PHP-FPM Laravel |
| postgres | erp_postgres | 5432 | Database ERP |
| redis | erp_redis | 6379 | Cache/queue |
| minio | erp_minio | 9000, 9001 | Object storage dan console |

## Menjalankan Project

1. Jalankan semua container.

```bash
docker compose up -d
```

2. Siapkan environment Laravel jika belum ada.

```bash
cp apps/api/.env.example apps/api/.env
```

3. Sesuaikan database Laravel di `apps/api/.env`.

```env
APP_NAME=Frae
APP_URL=http://localhost:8080

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=erp_db
DB_USERNAME=erp_user
DB_PASSWORD=erp_password

REDIS_HOST=redis
```

4. Install dependency backend dan generate app key.

```bash
docker compose exec api composer install
docker compose exec api php artisan key:generate
```

5. Jalankan migration dan seeder.

```bash
docker compose exec api php artisan migrate --seed
```

6. Buka aplikasi.

- Frontend: http://localhost:3000
- API health check: http://localhost:8080/api/health
- MinIO console: http://localhost:9001

## Akun Default

Seeder `CoreSeeder` membuat akun super admin awal:

```txt
Email: admin@frae.test
Password: password
```

## Environment Frontend

Frontend memakai dua URL API karena konteks browser dan container berbeda.

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
API_INTERNAL_URL=http://nginx/api
```

- `NEXT_PUBLIC_API_URL` dipakai browser/client component.
- `API_INTERNAL_URL` dipakai Server Component Next.js saat berjalan di Docker.

Jika mengubah `docker-compose.yml`, recreate container web agar environment baru aktif.

```bash
docker compose up -d web
```

## Backend API

Route awal tersedia di `apps/api/routes/api.php`.

| Method | Endpoint | Auth | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/health` | Tidak | Cek status API |
| POST | `/api/auth/login` | Tidak | Login dan membuat Sanctum token |
| GET | `/api/auth/me` | Sanctum | Data user saat ini |
| POST | `/api/auth/logout` | Sanctum | Hapus token aktif |

Contoh login:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@frae.test","password":"password"}'
```

## Modul Core

Fondasi ERP awal berada di `apps/api/app/Modules/Core`.

- Company: data perusahaan.
- Department: struktur departemen.
- Role: role pengguna.
- Permission: permission per modul.
- AuditLog: log perubahan atau aktivitas.
- NumberSequence: konfigurasi nomor dokumen.
- Auth: login, user saat ini, dan logout.

Migration core membuat tabel:

- `companies`
- `departments`
- `positions`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `audit_logs`
- `number_sequences`

Seeder awal membuat:

- Company `MAIN`
- Department `IT`
- Role `super-admin`
- Permission awal untuk `core` dan `inventory`
- User `admin@frae.test`

## Frontend

Halaman awal yang tersedia:

- `/` menampilkan status backend dari endpoint `/api/health`.
- `/login` untuk autentikasi.
- `/dashboard` untuk area ERP.
- `/dashboard/inventory`
- `/dashboard/purchasing`
- `/dashboard/sales`
- `/dashboard/finance`
- `/dashboard/hr`
- `/dashboard/manufacturing`
- `/dashboard/projects`
- `/dashboard/settings`

Helper API frontend berada di `apps/web/src/lib/api.ts`. Helper ini menangani:

- base URL berbeda untuk browser dan server Next.js,
- header JSON default,
- Bearer token,
- response JSON/text,
- error message API,
- fetch error yang lebih mudah dibaca.

## Command Berguna

```bash
# Lihat container
docker compose ps

# Log frontend
docker compose logs web --tail=100

# Log API/PHP-FPM
docker compose logs api --tail=100

# Masuk shell Laravel
docker compose exec api bash

# Jalankan migration
docker compose exec api php artisan migrate

# Jalankan seeder
docker compose exec api php artisan db:seed

# Jalankan test Laravel
docker compose exec api php artisan test

# Lint frontend
cd apps/web
npm run lint

# Type-check frontend
cd apps/web
npx tsc --noEmit
```

## Catatan Development

- Next.js 16 membutuhkan Node.js `>=20.9.0`. Docker frontend sudah memakai Node 22.
- Jika menjalankan frontend langsung dari host, gunakan Node 20.9 atau lebih baru.
- `localhost` dari browser mengarah ke host machine, tetapi `localhost` dari container mengarah ke container itu sendiri. Karena itu frontend Docker membutuhkan `API_INTERNAL_URL=http://nginx/api` untuk Server Component.
- `apps/web` memiliki repository Git sendiri di dalam folder web. Periksa status Git di root dan di `apps/web` jika ingin commit perubahan frontend.

## Troubleshooting

### Runtime TypeError di `apps/web/src/lib/api.ts`

Gejala umum:

- halaman `/` gagal render,
- error fetch dari Server Component,
- API sebenarnya hidup di `localhost:8080`.

Penyebab:

- Server Component Next.js berjalan di container `web`.
- `http://localhost:8080/api` dari dalam container bukan Nginx host, sehingga koneksi gagal.

Solusi:

- Pastikan `docker-compose.yml` memiliki:

```yaml
environment:
  NEXT_PUBLIC_API_URL: http://localhost:8080/api
  API_INTERNAL_URL: http://nginx/api
```

- Recreate service web:

```bash
docker compose up -d web
```

- Tes dari container web:

```bash
docker compose exec web node -e "fetch('http://nginx/api/health').then(r=>r.text()).then(console.log)"
```
