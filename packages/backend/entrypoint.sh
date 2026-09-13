#!/bin/sh
set -e

echo "==> Waiting for Postgres and running migrations..."
until npx prisma migrate deploy; do
  echo "    Migration failed — retrying in 3s..."
  sleep 3
done

echo "==> Regenerating Prisma Client..."
npx prisma generate

# ── Seed Guard ────────────────────────────────────────────────────────────────
# Only seed if:
#   (a) the Citizen table is empty (first-time startup), OR
#   (b) FORCE_RESEED=true is explicitly set in environment.
#
# This prevents live demo audit data from being wiped on every container restart.
# To force a clean reseed:  FORCE_RESEED=true docker compose up backend
# ─────────────────────────────────────────────────────────────────────────────

CITIZEN_COUNT=$(npx prisma db execute --stdin --json <<'SQL'
SELECT COUNT(*)::int AS count FROM "Citizen";
SQL
2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")

echo "==> Citizen table has ${CITIZEN_COUNT} row(s)."

if [ "${FORCE_RESEED:-false}" = "true" ]; then
  echo "==> FORCE_RESEED=true — running full reseed (existing data will be overwritten)..."
  npx ts-node src/seed/seed.ts
elif [ "${CITIZEN_COUNT}" = "0" ]; then
  echo "==> Fresh database — seeding 50 deterministic demo citizens..."
  npx ts-node src/seed/seed.ts
else
  echo "==> Existing data detected — skipping seed. Set FORCE_RESEED=true to override."
fi

echo "==> Starting GovLink backend..."
exec npx ts-node src/server.ts
