#!/bin/sh
set -e

echo "==> Waiting for Postgres and running migrations..."
until npx prisma migrate deploy; do
  echo "    Migration failed — retrying in 3s..."
  sleep 3
done

echo "==> Regenerating Prisma Client..."
npx prisma generate

echo "==> Running seed..."
npx ts-node src/seed/seed.ts

echo "==> Starting GovLink backend..."
exec npx ts-node src/server.ts
