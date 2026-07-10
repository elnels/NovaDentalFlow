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
