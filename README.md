# GovLink — Government Digital Service Interoperability Middleware

> Consent-based · Data-minimized · SHA-256 hash-chain audited · 50 deterministic demo personas

GovLink is a consent-based middleware layer that orchestrates multi-department government data
exchange. A citizen logs in once; GovLink pulls verified identity, education, income, transport,
police, banking, welfare, and municipal data from simulated departments, enforces per-category
consent, normalizes every response into one Common Data Model, and logs every access in a
tamper-evident SHA-256 hash-chained audit trail.

---

## 1. Prerequisites

Create your environment file in the project root:

```bash
cat << 'EOF' > .env
POSTGRES_USER=govlink
POSTGRES_PASSWORD=govlink_secret
JWT_SECRET=govlink_demo_secret_change_in_prod
NODE_ENV=development
EOF
```

> Change `JWT_SECRET` and `POSTGRES_PASSWORD` before using this outside a local demo.

Generate the presenter's private demo-credentials table. This produces `DEMO_CREDENTIALS.md`
(git-ignored) with every seeded persona's real email and password — it is never read by the
running application, only by you:

```bash
node scripts/export_demo_credentials.js
```

---

## 2. Starting the Stack

### Standard Docker

```bash
# Build all images and start all 7 containers in detached mode
docker compose up --build -d

# View real-time logs from all services
docker compose logs -f

# Check running container health status
docker compose ps
```

### Podman (rootless Linux / Fedora)

```bash
# Start the user socket if it isn't already running
systemctl --user start podman.socket

# Build and start, pointing the Docker CLI at the Podman socket
DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock docker compose up --build -d

# Check status
DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock docker compose ps
```

Both paths bring up the same 7 services: `postgres`, `redis`, `mock-identity`, `mock-education`,
`mock-revenue`, `backend`, `frontend`. `backend` and `frontend` wait on health checks before
starting, so a clean `up` should require no manual intervention.

---

## 3. Access the Application

| Interface | URL | Description |
|---|---|---|
| Frontend Portal | http://localhost:5173 | Citizen login, registration, and service applications |
| Backend API | http://localhost:3000 | Fastify gateway & workflow orchestration |
| Backend Health | http://localhost:3000/health | Gateway health check |
| Services Health | http://localhost:3000/api/health/services | Live status of UIDAI, CBDT, NAD, and other upstream silos |

---

## 4. Logging In & Registration

The frontend uses a **standard email/password login form** — the persona cards on the home page
are informational only (name, OneGov ID, status badges, scenario description) and are **not**
clickable to authenticate. To log in as any of the 50 seeded personas, open `DEMO_CREDENTIALS.md`
(generated in step 1) and type the credentials into the login form yourself.

New citizens can also **register** a brand-new account (name, email, password) directly from the
same page. Since a self-registered citizen has no linked department records — no `IdentityMap`
row — attempting a verification workflow on that account is caught by an explicit
**unlinked-account guard**, which returns a clear message rather than a broken or empty result.
This is covered by the smoke test below.

For scripted or CI access, a credential-free demo-login endpoint is still available — it is used
by automation and the smoke test, not by the frontend UI:

```bash
curl -s -X POST http://localhost:3000/api/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"onegovId":"OG-2026-00000001"}' | jq .token
```

---

## 5. Featured Demo Personas

These are a curated subset of the full 50-persona registry, chosen to exercise specific paths
through the system. Credentials for all of them (and the other 43) live in `DEMO_CREDENTIALS.md`.

| OneGov ID | Name | Scenario |
|---|---|---|
| `OG-2026-00000001` | Rahul Kumar Singh | ✅ Golden Standard — approved on all three flows |
| `OG-2026-00000002` | Priya Sharma | ✅ Flagship merit scholarship (CGPA 9.10, low income) |
| `OG-2026-00000003` | Amitabh Ramesh Patel | ⚠️ TRANSPORT — expired driving licence rejection |
| `OG-2026-00000004` | Sneha Kumari Gupta | 🔄 503 auto-retry demo (BullMQ exponential backoff) |
| `OG-2026-00000005` | Mohammed Tariq Khan | 🔀 Name mismatch between Aadhaar and PAN records |
| `OG-2026-00000006` | Ananya Sundaram Iyer | 🕐 Police clearance PENDING — workflow paused |
| `OG-2026-00000007` | Vikramaditya Roy | ❌ High income + bank KYC overdue — multi-criteria fail |

The remaining 43 personas are browsable read-only in the "Browse Full 50-Citizen Registry" panel
on the same page.

---

## 6. Pre-Demo Smoke Test

Run this before every live demo:

```bash
bash scripts/smoke_test.sh
```

This runs an automated 18-point verification covering:
- all mock service and backend health checks,
- manual login using credentials pulled from `DEMO_CREDENTIALS.md`,
- new citizen registration,
- the unlinked-account guard for a freshly registered citizen,
- a full workflow-engine run (consent → verification → eligibility), and
- SHA-256 audit hash-chain integrity.

It prints a clear PASS/FAIL summary — a clean run is your proof the system is fully operational
before you open a browser.

---

## 7. Demo Script (CLI "Wow Moments")

```bash
# Wow moment #1 — data minimization (income range stripped from the CDM)
bash scripts/demo.sh wow1

# Wow moment #2 — mid-flight consent revoke (workflow FAILS with CONSENT_REVOKED)
bash scripts/demo.sh wow2

# Wow moment #3 — audit chain tamper detection (hash chain breaks, then restores)
bash scripts/demo.sh wow3
```

---

## 8. Architecture

```
Citizen → Frontend (React + Vite + Tailwind + Lucide, port 5173)
           ├── Unified Dashboard (`/dashboard`)
           ├── Consent Management & Revocation (`/consents`)
           ├── Verifiable Credentials (`/certificate/:runId`)
           ├── Data Portability Export (`/export`)
           ├── Appeals Flow (`/appeal/:runId`)
           ├── Admin Connector Onboarding (`/admin/onboarding`)
           ├── Operations & Circuit Breaker Dashboard (`/ops`)
           ├── Plain-Language Audit Narrative (`/audit/narrative`)
           └── Multilingual Support (English & Hindi)
        → Backend (Fastify + Prisma + BullMQ, port 3000)
           ├── ConnectorRegistry & Runner  — data-driven dynamic manifests
           ├── WorkflowEngine & Worker     — separated execution process with circuit breakers
           ├── ConsentService              — purpose-bound, expiring, guardian/delegate consent
           ├── CertificateService          — Ed25519 signed verifiable credentials with QR codes
           ├── NotificationService         — real-time in-app alerts (submissions, approvals, expiries)
           ├── AppealService               — eligibility dispute filing and rerun management
           ├── RetentionService            — automated DPDP data minimization & snapshot purging
           ├── GrievanceService            — citizen discrepancy flagging on audit trail
           └── AuditService                — tamper-evident SHA-256 hash-chained log
        → Worker Process (BullMQ background processor)
           ├── Workflow execution queue
           ├── Daily consent expiry monitor
           └── Daily data retention & snapshot purge job
        → PostgreSQL (Prisma, port 5432/5433)
        → Redis (BullMQ queues, port 6379)
        → mock-identity:4001   (Identity/UIDAI + Police/CCTNS + Municipal)
        → mock-education:4002  (Education/NAD + Welfare/PDS)
        → mock-revenue:4003    (Income Tax/CBDT + Transport/Parivahan + Banking/KYC)
```

---

## 9. End-to-End System Flow

The diagram above shows the pieces; this section walks through what actually happens, in order,
for a single citizen — from `docker compose up` to a completed, audited eligibility result.

### 9.1 Startup sequence

Containers do not all start at once — each waits on the health of the one before it:

```
1. postgres  starts → healthcheck passes (pg_isready)
2. redis     starts → healthcheck passes (PING)
3. mock-identity, mock-education, mock-revenue start (no dependencies — pure in-memory services)
4. backend   starts → entrypoint.sh runs:
                a. prisma migrate deploy   (retries in a loop until postgres is reachable)
                b. seed check              (skips seeding if rows already exist, unless FORCE_RESEED=true)
                c. server starts on :3000  → /health returns 200
5. frontend  starts (waits for backend health) → Vite dev server binds 0.0.0.0:5173
```

If you ever see the frontend load but API calls fail, this ordering is the first thing to check —
it means `backend` didn't reach a healthy state before `frontend` came up, or a migration is stuck.

### 9.2 Authentication flow

```
Citizen opens :5173
   → Login form (email + password)  OR  Register form (name + email + password)
        │
        ▼
   POST /api/auth/login  or  POST /api/auth/register
        │
        ▼
   Backend verifies bcrypt hash (login) or creates a new Citizen row (register)
        │
        ▼
   Signed JWT returned → stored client-side → attached to every subsequent request
```

A registered citizen who has **no `IdentityMap` row** (i.e. anyone who self-registered rather than
being one of the 50 seeded personas) can still log in and browse services, but the **unlinked-account
guard** intercepts any attempt to actually run a verification workflow, since there is no department
data to fetch for them — returning a clear explanatory response instead of a silent failure.

### 9.3 Applying for a service

```
Citizen selects a service (SCHOLARSHIP / TRANSPORT / WELFARE)
        │
        ▼
   Consent screen — one toggle per DataCategory relevant to that service
        │
        ▼
   POST /api/consent/grant
        │  Inside a single DB transaction:
        │    - creates a new WorkflowRun (state = AWAITING_CONSENT)
        │    - inserts one ConsentArtefact row per category, linked to that run
        ▼
   WorkflowEngine.start(runId) is triggered
```

### 9.4 The workflow engine — state by state

Each service type walks a different sequence of states, but every transition follows the same
pattern:

```
executeState(run):
   1. Determine which connector this state needs (e.g. INCOME_VERIFY → RevenueConnector)
   2. ConsentService.checkActive(runId, category)
        → not active?  throw ConsentViolationError → engine transitions run to FAILED
   3. Connector.fetchAndNormalize(externalId)
        → calls the relevant mock department over HTTP
        → normalize() strips anything that shouldn't leave the connector
          (e.g. RevenueConnector normalize() drops the raw incomeRange —
           this is the data-minimization guarantee)
        → returns a typed CDM fragment
   4. Fragment is written into the run's snapshot (identitySnapshot / educationSnapshot / etc.)
   5. AuditService.log(...) records the call and its result in the hash chain
   6. Engine advances to the next state in the sequence
```

If a connector call fails with a retryable status (503 / 429 / 504):

```
   retryCount++ → transition to PENDING → enqueue a BullMQ job with backoff
                  (2s → 5s → 10s, 3 attempts max)
        │
        ▼
   Worker picks up the job → calls engine.advance(runId) again
        │
        ▼
   Consent is re-checked before the retry fires — if it was revoked in the meantime,
   the retry is blocked and the run goes to FAILED with reason CONSENT_REVOKED,
   not to the connector at all.
```

Once every required state succeeds, the engine reaches `ELIGIBILITY_CALC`, computes a boolean
result from the normalized CDM fields (e.g. `meetsThreshold` for income), and transitions to
`SUBMITTED` (or `FAILED` if the citizen doesn't qualify).

### 9.5 What the citizen sees while this happens

The Status page polls the run every 1.5 seconds and renders whichever state it gets back:
a stepper advancing through each verification stage, a `PENDING` countdown during a retry, or a
`FAILED` banner naming the reason (`CONSENT_REVOKED`, `MAX_RETRIES`, income/eligibility failure,
etc.). Because every transition is persisted before its side effects run, refreshing the page or
restarting the backend mid-workflow never loses or duplicates a step — the engine simply resumes
from whatever state is on the row.

### 9.6 The audit trail, continuously

Independent of which workflow state a citizen is in, every meaningful event — login, consent
granted, consent revoked, each connector call and its outcome, each state transition, the final
eligibility result — is appended to that citizen's personal SHA-256 hash chain:

```
hash(entry N) = SHA-256(hash(entry N-1) + seq(N) + payloadRaw(N))
```

`payloadRaw` (the exact string that was hashed) is stored alongside the queryable JSON payload
specifically so verification never has to re-serialize JSON — Postgres `jsonb` doesn't preserve
key order, which would otherwise produce false tampering alerts. `GET /api/audit/:citizenId/verify`
replays the whole chain and confirms every hash and `prevHash` link still matches.

### 9.7 How this maps to the three "wow moments"

- **wow1 (data minimization):** toggling raw vs. CDM view on the Result page shows the exact
  point in 9.4 step 3 where `incomeRange` is dropped and never makes it into the snapshot or audit
  payload.
- **wow2 (mid-flight revocation):** revoking consent flips one `ConsentArtefact` row to `REVOKED`;
  the next time step 2 of 9.4 runs (even from a queued retry), it catches that immediately.
- **wow3 (audit tamper detection):** the tamper/restore demo endpoints directly mutate a stored
  `hash` value, then show `verify()` (9.6) catching the mismatch and the restore path recomputing
  the chain.

---

## 10. Administrator Access & Bootstrapping

GovLink includes role-based access control (`CITIZEN` vs. `ADMIN`) protecting department onboarding, circuit breaker administration, and appeal status resolution.

- **Default Admin Account:** Seeded automatically from `ADMIN_EMAIL` in `.env` (`rahul@govlink.demo`).
- **Promoting Accounts to Admin (CLI):**
  ```bash
  node scripts/make-admin.js --email rahul@govlink.demo
  # or by OneGov ID:
  node scripts/make-admin.js --onegov-id OG-2026-00000001
  ```
- **Admin Pages in Web UI:**
  - Department Onboarding: `http://localhost:5173/admin/onboarding`
  - System Operations & Telemetry: `http://localhost:5173/ops`
  - Appeals & Grievance Moderation: `http://localhost:5173/admin/appeals`

---

## 11. Architecture Decision: Mock Services vs. Full Relational Database

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

**Reason:** the middleware treats the mapping as a lookup cache, not a queryable ledger. A denormalized
row is faster to read and simpler to join. If federation ever needs to support dynamic department
registration at runtime, this should be migrated to the normalized multi-row design.

---

## 11. Key Design Decisions

| Decision | Implementation |
|---|---|
| **Consent** | 1 row per `DataCategory` per workflow run — `@unique([workflowRunId, category])`. Revoke = field update, not delete. Gating is checked in every connector before any HTTP call. |
| **Audit chain** | `SELECT … FOR UPDATE` prevents race conditions on the per-citizen sequence counter. `payloadRaw` (stringified) is what's hashed — not the JSON column — so the hash is byte-stable. |
| **Data minimization** | `RevenueConnector.normalize()` strips `incomeRange`. It never appears in the CDM, any snapshot, or any audit payload. The `DataMinimizationToggle` in the UI demonstrates this visually. |
| **Retry** | BullMQ handles Revenue 503s with deterministic backoff (2s → 5s → 10s, 3 attempts). Citizen #4's first call always returns 503; second succeeds. |
| **Login & registration** | No credentials are ever rendered in the frontend. Login is a standard email/password form; new accounts can self-register and are protected by an unlinked-account guard when no department records exist. |
| **Seed guard** | `entrypoint.sh` checks for existing rows before seeding. Data survives container restarts unless `FORCE_RESEED=true` is set. |

---

## 12. Resetting Demo Data

By default the seed runs **once** and data persists across restarts — safe to stop and restart
Docker mid-demo without losing consent or audit history.

```bash
# Force a clean reseed of just the backend's data:
FORCE_RESEED=true docker compose up -d backend
```

For a complete reset — including deleting the Postgres and Redis volumes — tear everything down
and rebuild from scratch:

```bash
docker compose down -v
docker compose up --build -d
```

---

## 13. Stopping the Stack

```bash
docker compose down
# Or with Podman:
DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock docker compose down
```

---

## Further Reading

- [`database_simulation_plan.md`](./database_simulation_plan.md) — the original full build plan, including the 22-table reference schema.
- [`scripts/onegov_schema.sql`](./scripts/onegov_schema.sql) — reference SQL for a future full-Postgres migration.
