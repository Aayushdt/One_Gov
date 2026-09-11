# GovLink — Government Digital Service Interoperability Middleware

> Hackathon prototype · Consent-based · Data-minimized · Hash-chain audited

## Quick Start (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health check**: http://localhost:3000/health

## Demo Accounts (password: `demo123`)

| Email | Name | Scenario |
|---|---|---|
| `priya@govlink.demo` | Priya Sharma | ✅ Eligible (low income band) |
| `rahul@govlink.demo` | Rahul Verma | ❌ Ineligible (high income band) |
| `sneha@govlink.demo` | Sneha Patel | ⟳ Revenue retry demo (1 failure then succeeds) |

## Demo Script (CLI)

```bash
# Wow moment #1 — data minimization visible on /result
bash scripts/demo.sh wow1

# Wow moment #2 — mid-flight consent revoke
bash scripts/demo.sh wow2

# Wow moment #3 — audit chain verify
bash scripts/demo.sh wow3
```

## Architecture

```
Citizen → Frontend (React + Tailwind)
       → Backend (Fastify + Prisma + BullMQ)
          → ConsentService (per-category, per-run)
          → WorkflowEngine (AWAITING_CONSENT → IDENTITY_VERIFY → EDUCATION_VERIFY → INCOME_VERIFY → ELIGIBILITY_CALC → SUBMITTED)
             → IdentityConnector → mock-identity:4001
             → EducationConnector → mock-education:4002
             → RevenueConnector → mock-revenue:4003 (deterministic 503 for Sneha)
          → AuditService (SHA-256 hash chain, FOR UPDATE locking)
       → PostgreSQL (Prisma migrations)
       → Redis (BullMQ retry queue)
```

## Wow Moments

1. **Data Minimization** — on `/result/:runId`, toggle between "Raw Dept Record" and "What Service Received". The income range field is visually absent in CDM view with an explanation of why.
2. **Live Consent Revoke** — on `/status/:runId`, click Revoke on the Income row while the workflow is processing. The next poll returns FAILED with `CONSENT_REVOKED:INCOME`.
3. **Audit Chain Integrity** — `/audit` shows every event with SHA-256 hash chains. Click "Verify Chain Integrity" to prove tamper-evidence.

## Key Design Decisions

- **Consent**: 1 row per category per workflow run (`@unique [workflowRunId, category]`). Revoke is a field update, not a delete.
- **Audit**: `SELECT ... FOR UPDATE` prevents race conditions on the per-citizen sequence counter.
- **Data minimization**: `RevenueConnector.normalize()` strips `incomeRange` — it never appears in CDM or any downstream record.
- **Retry**: BullMQ handles Revenue 503s with deterministic backoff (2s, 5s, 10s). Sneha's first call always fails; second succeeds.
