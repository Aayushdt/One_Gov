# GovLink — Government Digital Service Interoperability Middleware

> Consent-based · Data-minimized · SHA-256 hash-chain audited · 50 deterministic demo personas

---

## Quick Start (Docker Compose)

```bash
cp .env.example .env
# Edit .env: set POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend API (Fastify) | http://localhost:3000 |
| Backend health | http://localhost:3000/health |
| Service health (all) | http://localhost:3000/api/health/services |

---

## Demo Login

The UI uses **one-click persona login** — no email or password is ever displayed.  
Click any persona card to authenticate instantly via its OneGov ID.

For scripted access, use the credential-free demo endpoint:

```bash
curl -s -X POST http://localhost:3000/api/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"onegovId":"OG-2026-00000001"}' | jq .token
```

> **Private reference:** run `node scripts/export_demo_credentials.js` to generate  
> `DEMO_CREDENTIALS.md` with all 50 persona emails/passwords. That file is `.gitignored`.

---

## Pre-Demo Smoke Test

```bash
bash scripts/smoke_test.sh
```

Checks all service health, runs a full SCHOLARSHIP workflow end-to-end, verifies eligibility,
and validates the SHA-256 audit hash chain. Prints a clear PASS/FAIL summary.

---

## Featured Demo Personas

| OneGov ID | Name | Scenario |
|---|---|---|
| `OG-2026-00000001` | Rahul Kumar Singh | ✅ Golden Standard — approved on all three flows |
| `OG-2026-00000002` | Priya Sharma | ✅ Flagship merit scholarship (CGPA 9.10, low income) |
| `OG-2026-00000003` | Amitabh Ramesh Patel | ⚠️ TRANSPORT — expired driving licence rejection |
| `OG-2026-00000004` | Sneha Kumari Gupta | 🔄 503 auto-retry demo (BullMQ exponential backoff) |
| `OG-2026-00000005` | Mohammed Tariq Khan | 🔀 Name mismatch between Aadhaar and PAN records |
| `OG-2026-00000006` | Ananya Sundaram Iyer | 🕐 Police clearance PENDING — workflow paused |
| `OG-2026-00000007` | Vikramaditya Roy | ❌ High income + bank KYC overdue — multi-criteria fail |

---

## Architecture

```
Citizen → Frontend (React + Vite, port 5173)
        → Backend (Fastify + Prisma + BullMQ, port 3000)
           ├── ConsentService    — one row per DataCategory per WorkflowRun
           ├── WorkflowEngine    — 12-state machine (AWAITING_CONSENT → SUBMITTED)
           │    ├── SCHOLARSHIP  : Identity → Education → Income → Banking → Eligibility
           │    ├── TRANSPORT    : Identity → Transport → Police → Banking → Municipal → Eligibility
           │    └── WELFARE      : Identity → Income → Welfare → Banking → Eligibility
           ├── Connectors        — 8 typed connectors (identity, education, revenue,
           │                       transport, police, banking, welfare, municipal)
           └── AuditService      — SHA-256 hash chain, FOR UPDATE locking
        → PostgreSQL (Prisma, port 5432)
        → Redis (BullMQ retry queue, port 6379)
        → mock-identity:4001   (Identity/UIDAI + Police/CCTNS + Municipal)
        → mock-education:4002  (Education/NAD + Welfare/PDS)
        → mock-revenue:4003    (Income Tax/CBDT + Transport/Parivahan + Banking/KYC)
```

---

## Architecture Decision: Mock Services vs. Full Relational Database

### What lives in PostgreSQL (Prisma)

| Table | Purpose |
|---|---|
| `Citizen` | Universal citizen registry (name, address, OneGov ID) |
| `IdentityMap` | Federated department ID mapping (8 department IDs per citizen) |
| `ConsentArtefact` | One row per `DataCategory` per `WorkflowRun`; revocable |
| `WorkflowRun` | State machine record; snapshots per department stored as JSON |
| `WorkflowStateHistory` | Transition log for each workflow |
| `AuditEntry` | SHA-256 per-citizen hash chain with `payloadRaw` |

### What lives in mock services (in-memory)

The original plan ([`database_simulation_plan.md`](./database_simulation_plan.md)) specified 22 full
relational PostgreSQL tables — one for each department silo (`identity_records`, `pan_records`,
`bank_accounts`, `driving_licences`, `vehicles`, `traffic_challans`, etc.).

**We deliberately chose in-memory mock services instead.** This was the right trade-off for the demo scope:

| Consideration | Full Postgres tables | Mock services (chosen) |
|---|---|---|
| Schema migrations | Complex, brittle | Not needed |
| Realistic dept response formats | Hard to vary | Trivial |
| 503 fault injection | Requires DB flag | 1 env var (`REVENUE_FAIL_COUNTS`) |
| Demo data variety | Fixed rows | Programmatic, reproducible |
| Startup time | Long seed job | Instant in-memory |

The reference schema for all 22 tables is preserved in [`scripts/onegov_schema.sql`](./scripts/onegov_schema.sql)
and can be used to migrate to a full Postgres implementation in a future phase.

### IdentityMap flattening

The plan described `department_identity_mapping` as a normalized table
(`onegov_id, department, departmental_identifier` — one row per dept). The running system uses a
**single-row denormalized `IdentityMap`** with 8 named columns (`identityDeptId`, `revenueDeptId`, …).

**Reason:** The middleware treats the mapping as a lookup cache, not a queryable ledger. A denormalized
row is faster to read and simpler to join. If federation ever needs to support dynamic department
registration at runtime, this should be migrated to the normalized multi-row design.

---

## Key Design Decisions

| Decision | Implementation |
|---|---|
| **Consent** | 1 row per `DataCategory` per workflow run — `@unique([workflowRunId, category])`. Revoke = field update, not delete. Gating is checked in every connector before any HTTP call. |
| **Audit chain** | `SELECT … FOR UPDATE` prevents race conditions on the per-citizen sequence counter. `payloadRaw` (stringified) is what's hashed — not the JSON column — so the hash is byte-stable. |
| **Data minimization** | `RevenueConnector.normalize()` strips `incomeRange`. It never appears in the CDM, any snapshot, or any audit payload. The `DataMinimizationToggle` in the UI demonstrates this visually. |
| **Retry** | BullMQ handles Revenue 503s with deterministic backoff (2s → 5s → 10s, 3 attempts). Citizen #4's first call always returns 503; second succeeds. |
| **Seed guard** | The `entrypoint.sh` checks for existing rows before seeding. Data survives container restarts. Set `FORCE_RESEED=true` to override. |

---

## Resetting Demo Data

By default the seed runs **once** and data persists across restarts.

```bash
# Force a clean reseed:
docker compose run --rm -e FORCE_RESEED=true backend
```

---

## Demo Script (CLI — `wow moments`)

```bash
# Wow moment #1 — data minimization (income range stripped from CDM)
bash scripts/demo.sh wow1

# Wow moment #2 — mid-flight consent revoke (workflow FAILS with CONSENT_REVOKED)
bash scripts/demo.sh wow2

# Wow moment #3 — audit chain tamper detection (hash chain breaks, then restores)
bash scripts/demo.sh wow3
```
