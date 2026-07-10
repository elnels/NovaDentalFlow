# Production Deployment — Windows + Docker

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Windows Host                     │
│  ┌─────────────────────┐  ┌────────────────────┐ │
│  │  Container: postgres │  │ Container: nextjs  │ │
│  │  postgres:16         │  │ Node.js + Next.js  │ │
│  │  Linux amd64         │  │ Linux amd64        │ │
│  │                      │  │                    │ │
│  │  Port 5432           │  │  Port 9004 → Host  │ │
│  │  Volume: pgdata      │  │  :9004             │ │
│  └─────────┬────────────┘  └────────┬───────────┘ │
│            └──── internal network ──┘              │
│        (docker network: novadentalflow_default)    │
└──────────────────────────────────────────────────┘
```

Two Linux containers orchestrated by Docker Compose. The host only needs **Docker Desktop** — no Node.js, npm, or any other tools installed.

---

## Prerequisites (on the target PC)

| Requirement | Minimum version | Notes |
|-------------|-----------------|-------|
| Docker Desktop | 4.x | Linux containers mode (default) |
| RAM allocated to Docker | 4 GB | Adjustable in Docker Desktop Settings → Resources |
| Disk space | 2 GB | Image ~1.2 GB + database |
| OS | Windows 10/11 | Home, Pro, Enterprise |

---

## Files added / modified

| File | Action | Purpose |
|------|--------|---------|
| `Dockerfile` | **New** | Multi-stage build: compiles Next.js, produces slim image |
| `entrypoint.sh` | **New** | Waits for DB, runs migrations + seed, starts Next.js |
| `.dockerignore` | **New** | Excludes node_modules, .next, .env, .git from Docker context |
| `docker-compose.yml` | **Modify** | Add `nextjs` service with build, envs, volumes |
| `next.config.ts` | **Modify** | Add `output: "standalone"` |
| `.env` | **Not touched** | Stays unchanged for local development |

---

## 1. `Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache postgresql-client
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9004

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

RUN npm init -y && npm install prisma @prisma/client && npx prisma generate

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9004

ENTRYPOINT ["/entrypoint.sh"]
```

> **Note:** Requires `output: "standalone"` in `next.config.ts`. See section 4.

---

## 2. `.dockerignore`

```dockerignore
node_modules
.next
.git
*.md
.gitignore
.env
```

Prevents sending large local folders (node_modules, .next) to the Docker daemon, dramatically speeding up builds.

---

## 3. `entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null; do
  sleep 2
done
echo "✅ PostgreSQL is ready"

echo "📦 Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed 2>/dev/null || echo "  ○ Seed skipped or already seeded"

echo "🚀 Starting Next.js..."
exec node server.js
```

---

## 4. `docker-compose.yml` (modified)

```yaml
services:
  postgres:
    image: postgres:16
    container_name: novadentalflow-db
    environment:
      POSTGRES_DB: novadentalflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  nextjs:
    build: .
    container_name: novadentalflow-app
    ports:
      - "9004:9004"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/novadentalflow
      DB_PASSWORD: postgres
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_USER: postgres
      DB_NAME: novadentalflow
      TIMEZONE: America/Mexico_City
      NEXT_PUBLIC_GOOGLE_CALENDAR_ID: ${NEXT_PUBLIC_GOOGLE_CALENDAR_ID:-}
      GOOGLE_APPLICATION_CREDENTIALS: /app/gcp-key.json
    volumes:
      - ./gcp-service-account-key.json:/app/gcp-key.json
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pgdata:
```

**Key points:**
- `DATABASE_URL` uses `postgres` (service name) instead of `localhost` — Docker resolves it internally
- `GOOGLE_APPLICATION_CREDENTIALS` points to `/app/gcp-key.json` (Linux path inside the container)
- The `gcp-service-account-key.json` file is mounted as a volume from the host
- Other env vars are read from `.env` automatically via `${VAR:-}` with empty fallback
- The `nextjs` container waits for `postgres` to be healthy before starting

---

## 5. Additional modification: `next.config.ts`

Add `output: "standalone"` for the Dockerfile to work correctly:

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  // ... rest of existing config
};
```

This change **does not affect local development** — `next dev` ignores this option.

---

## 6. Step-by-step deploy (target PC)

### 6.1. Get the project

```powershell
# Option A — Clone from GitHub
git clone https://github.com/your-username/NovaDentalFlow.git
cd NovaDentalFlow

# Option B — Copy via USB/network
# Just copy the entire folder to the target PC
```

### 6.2. Create `.env` (if it doesn't exist)

```powershell
copy .env.example .env
```

Edit only if using Google Calendar (see section 9).

### 6.3. Place Google credentials (optional)

If using Google Calendar, place `gcp-service-account-key.json` in the project root.

### 6.4. Start everything

```powershell
docker compose up -d
```

- First run downloads images and builds the app (~2-5 minutes)
- Subsequent starts take seconds

### 6.5. Open in browser

```
http://localhost:9004
```

---

## 7. First-run flow

When the `nextjs` container starts, `entrypoint.sh` runs:

```
1. Wait for PostgreSQL to accept connections (pg_isready)
2. Run npx prisma migrate deploy → apply schemas
3. Run npx prisma db seed → insert 34 procedures + 3 sample patients
4. Start next start on port 9004
```

The seed is idempotent — if data already exists, it skips.

---

## 8. Updating the app

```powershell
git pull
docker compose up -d --build
```

This rebuilds the `nextjs` image with new code and restarts only that container. PostgreSQL and data are preserved.

---

## 9. Google Calendar (optional)

### 9.1. On the target PC

1. Place `gcp-service-account-key.json` in the project root
2. In `.env`, make sure you have:

```env
NEXT_PUBLIC_GOOGLE_CALENDAR_ID=your-calendar@gmail.com
```

3. `GOOGLE_APPLICATION_CREDENTIALS` is already handled by `docker-compose.yml` — do not touch it in `.env`

### 9.2. Local development (unchanged)

On your dev machine, `.env` still uses the original Windows path:
```env
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\...\gcp-service-account-key.json
```

This doesn't affect production because the container never reads that line — it's overridden by `docker-compose.yml`.

---

## 10. Useful commands

```powershell
# View app logs
docker compose logs -f nextjs

# View database logs
docker compose logs -f postgres

# Restart only the app (no rebuild)
docker compose restart nextjs

# Rebuild and restart
docker compose up -d --build nextjs

# Stop everything (data persists)
docker compose down

# Stop everything and delete the database (careful!)
docker compose down -v

# Check container status
docker compose ps
```

---

## 11. Troubleshooting

### Port 9004 in use

Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "9005:9004"   # host:9005 → container:9004
```

### Database unavailable at startup

`entrypoint.sh` retries every 2 seconds until PostgreSQL responds. If the problem persists:

```powershell
docker compose logs postgres
```

### Database connection error inside the container

Verify that `DATABASE_URL` in `docker-compose.yml` uses the service name `postgres`, not `localhost`:

```yaml
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/novadentalflow
#                                      ^^^^^^^^
#                                      service name, not localhost
```

### App runs but internal APIs fail

Make sure `output: "standalone"` is set in `next.config.ts`. Without it, the `Dockerfile` won't copy files correctly.

### Permission error on `entrypoint.sh`

On Windows, shell scripts can lose permissions when cloning. Force:

```powershell
docker compose build --no-cache nextjs
```

### `pg_isready` not found

The `Dockerfile` installs `postgresql-client` in the runner stage (via `apk add`). If the error persists, verify it's included in your Dockerfile.

### Prisma 7.x `prisma.config.ts` errors

This project uses Prisma 7.x, which requires `prisma.config.ts`. The file is automatically copied into the container. If you get `datasource.url` errors, ensure:
- `prisma.config.ts` exists in your project root
- `DATABASE_URL` is set in the `docker-compose.yml` environment section
- The `COPY --from=builder /app/prisma.config.ts ./` line is in your `Dockerfile`

---

## 12. Dev vs Prod comparison

| Aspect | Development (your PC) | Production (target PC) |
|--------|----------------------|------------------------|
| PostgreSQL | Docker container | Docker container |
| App | `npm run dev` (host) | Docker container |
| Port | 9004 | 9004 |
| `.env` used | Yes (from host) | Only non-overridden vars |
| `DATABASE_URL` | `localhost:5432` | `postgres:5432` (override) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Windows path | `/app/gcp-key.json` (override) |
| Node.js | Installed on host | Inside container |
| Hot reload | ✅ Yes | ❌ No (build & deploy) |
| Update | `git pull` + restart dev | `git pull` + `docker compose up -d --build` |

---

## 13. Final notes

- **No `.ts`/`.tsx` files need modification** — changes are infrastructure only
- **Your development workflow doesn't change** — keep using `npm run dev` as always
- **`.env` is never modified** — differences between dev and prod are handled exclusively in `docker-compose.yml`
- **No internet required** for initial install: build the image and export it as a tarball to carry to the target PC
