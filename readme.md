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

1. Siapkan root environment Docker Compose jika belum ada.

```bash
cp .env.example .env
```

Isi nilai rahasia di root `.env`, terutama:

```env
POSTGRES_DB=frae_db
POSTGRES_USER=frae_user
POSTGRES_PASSWORD=isi-password-kuat
MINIO_ROOT_USER=frae_minio
MINIO_ROOT_PASSWORD=isi-password-minio-kuat
```

File root `.env` tidak ikut commit karena sudah masuk `.gitignore`.

2. Jalankan mode development dengan hot reload.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Mode ini memakai `apps/web/Dockerfile.dev`, menjalankan `npm run dev`, dan mount `apps/web` ke container sehingga perubahan frontend langsung terbaca.

Untuk menjalankan mode production-like lokal tanpa hot reload:

```bash
docker compose up -d --build
```

3. Siapkan environment Laravel jika belum ada.

```bash
cp apps/api/.env.example apps/api/.env
```

4. Sesuaikan database Laravel di `apps/api/.env` jika menjalankan Laravel tanpa env Docker Compose.

```env
APP_NAME=Frae
APP_URL=https://frae-api.cojimozy.com
FRONTEND_URL=https://frae.cojimozy.com
CORS_ALLOWED_ORIGINS=https://frae.cojimozy.com
SANCTUM_STATEFUL_DOMAINS=frae.cojimozy.com

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=frae_db
DB_USERNAME=frae_user
DB_PASSWORD=isi-password-yang-sama-dengan-POSTGRES_PASSWORD

REDIS_HOST=redis
```

5. Install dependency backend dan generate app key.

```bash
docker compose exec api composer install
docker compose exec api php artisan key:generate
```

6. Jalankan migration dan seeder.

```bash
docker compose exec api php artisan migrate --seed
```

7. Buka aplikasi.

- Frontend: http://localhost:3000
- API health check: https://frae-api.cojimozy.com/api/health
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
NEXT_PUBLIC_API_URL=https://frae-api.cojimozy.com/api
API_INTERNAL_URL=https://frae-api.cojimozy.com/api
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
| GET | `/api/core/organization` | Sanctum + permission | Data company, department, dan position |
| POST/PUT | `/api/core/companies` | Sanctum + permission | Create/update company |
| POST/PUT | `/api/core/departments` | Sanctum + permission | Create/update department |
| POST/PUT | `/api/core/positions` | Sanctum + permission | Create/update position |
| GET | `/api/core/users-roles` | Sanctum + permission | Data users, roles, permissions, dan scope organisasi |
| GET | `/api/inventory/master` | Sanctum + permission | Data item, category, unit, warehouse, dan company |
| POST/PUT | `/api/inventory/items` | Sanctum + permission | Create/update item master |
| POST/PUT | `/api/inventory/categories` | Sanctum + permission | Create/update item category |
| POST/PUT | `/api/inventory/units` | Sanctum + permission | Create/update unit of measure |
| POST/PUT | `/api/inventory/warehouses` | Sanctum + permission | Create/update warehouse |
| GET/POST | `/api/inventory/stock-movements` | Sanctum + permission | List/create stock movement |
| GET | `/api/inventory/stock-card` | Sanctum + permission | Kartu stok per item dan optional warehouse |

Contoh login:

```bash
curl -X POST https://frae-api.cojimozy.com/api/auth/login \
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
- Organization: CRUD company, department, dan position.

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
- Unit `PCS`
- Item Category `GENERAL`
- Warehouse `MAIN`
- Role `super-admin`
- Permission awal untuk `core` dan `inventory`
- User `admin@frae.test`

## Modul Inventory

Modul Inventory awal berada di `apps/api/app/Modules/Inventory`.

- Item: master SKU, category, unit, item type, minimum stock, dan status tracking stock.
- ItemCategory: grouping item.
- Unit: satuan transaksi dengan precision.
- Warehouse: lokasi penyimpanan per company.
- StockMovement: ledger transaksi stok untuk opening, in, out, dan adjustment.

Migration inventory membuat tabel:

- `item_categories`
- `units`
- `warehouses`
- `items`
- `stock_movements`

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
- `/dashboard/organization`
- `/dashboard/users-roles`

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
- Production frontend memakai `NEXT_PUBLIC_API_URL=https://frae-api.cojimozy.com/api`.
- `apps/web` memiliki repository Git sendiri di dalam folder web. Periksa status Git di root dan di `apps/web` jika ingin commit perubahan frontend.

## Troubleshooting

### PostgreSQL password authentication failed

Gejala umum:

```txt
SQLSTATE[08006] [7] connection to server at "postgres", port 5432 failed:
FATAL: password authentication failed for user "frae_user"
```

Penyebab paling umum:

- `POSTGRES_USER` atau `POSTGRES_PASSWORD` di root `.env` tidak sama dengan `DB_USERNAME` atau `DB_PASSWORD` yang dipakai container API.
- Volume `erp_postgres_data` sudah pernah dibuat dengan credential lama. Mengubah `POSTGRES_PASSWORD` di `.env` tidak otomatis mengubah password user di database yang sudah ada.

Solusi aman tanpa hapus data:

```bash
docker compose exec postgres psql -U postgres -d postgres
```

Lalu di prompt PostgreSQL:

```sql
ALTER USER frae_user WITH PASSWORD 'password-yang-sama-dengan-root-env';
```

Jika user `postgres` tidak tersedia, masuk dengan user lama yang masih valid lalu jalankan `ALTER USER` untuk user aplikasi.

Solusi reset total khusus database kosong atau development:

```bash
docker compose down
docker volume rm frae_erp_postgres_data
docker compose up -d postgres
```

Nama volume bisa berbeda. Cek dengan:

```bash
docker volume ls
```

### Runtime TypeError di `apps/web/src/lib/api.ts`

Gejala umum:

- halaman `/` gagal render,
- error fetch dari Server Component,
- API production hidup di `https://frae-api.cojimozy.com/api`.

Penyebab:

- Server Component Next.js berjalan di container `web`.
- Environment frontend masih mengarah ke API lama atau Laravel config cache belum direfresh.

Solusi:

- Pastikan `docker-compose.yml` memiliki:

```yaml
environment:
  NEXT_PUBLIC_API_URL: https://frae-api.cojimozy.com/api
  API_INTERNAL_URL: https://frae-api.cojimozy.com/api
```

- Recreate service web:

```bash
docker compose up -d web
```

- Tes dari container web:

```bash
docker compose exec web node -e "fetch('https://frae-api.cojimozy.com/api/health').then(r=>r.text()).then(console.log)"
```
