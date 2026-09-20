# GovLink — Codebase Cleanup & Hygiene Plan (Analysis Report)

**Date:** September 18, 2026  
**Status:** PROPOSED (Analysis Only — Awaiting User Approval)  
**Deliverable Document:** `checkups.md` (and `CLEANUP_REPORT.md`)

---

## 1. Executive Summary & Codebase Understanding

**Purpose:** GovLink is a consent-based government interoperability middleware connecting simulated department silos (UIDAI Identity, NAD Education, CBDT Revenue, RTO Transport, Police CCTNS, Banking DBT, Municipal, Welfare PDS) into a normalized Common Data Model (CDM) with immutable SHA-256 hash-chained audit logging and Ed25519 verifiable eligibility certificates.  
**Current State:** The codebase is functional, running 7 microservices in Docker/Podman, passing 18/18 smoke tests and all Phase 4 integration flows. However, there are significant dead code remnants, duplicated persona datasets, tightly coupled worker imports, and critical authorization/data boundary gaps across several gateway routes that lack ownership checks.  
**"Must Never Break":** Citizen data boundary isolation (zero cross-tenant data leakage), consent enforcement before data extraction, tamper-evident SHA-256 audit chain continuity, and unlinked account safety guards.

---

## 2. Restore Point Check

- **Existing Mechanism:** Git version control on branch `main`.
- **Coverage:** Code only.
- **Deficiencies:**
  1. **No Git tags/checkpoints exist** (0 tags in repository).
  2. **No automated database snapshot exists** (PostgreSQL volume persists data, but no baseline SQL dump exists for instant rollback).
- **Mandatory Pre-Execution Task:** Create an annotated Git tag checkpoint (`checkpoint-pre-cleanup`) and dump the PostgreSQL database before performing any cleanup.

---

## 3. System Invariants Standard

Every subsequent cleanup task must preserve these 10 plain-English invariants, each verifiable in under one minute:

1. **Clean Boot & Build Invariant:** All backend, frontend, worker, and mock silo packages build and start cleanly without compile errors, crash loops, or unhandled exceptions (`/health` returns HTTP 200).
2. **Deterministic Citizen Authentication Invariant:** Seeded personas (e.g. `rahul@govlink.demo` / `demo123`) and automated demo logins authenticate successfully, generating valid JWT tokens containing `citizenId` and `onegovId`.
3. **Self-Registration Invariant:** New citizens can register via `/api/auth/register`, receiving a newly allocated Universal Citizen ID (`OG-2026-9XXXXXXX`) and valid session token.
4. **Data Boundary & Isolation Invariant:** User A cannot access, query, mutate, or download User B's profile, workflow applications, consent records, certificates, audit events, or personal data export dossiers.
5. **Unlinked Account Safety Invariant:** Workflow runs initiated by a self-registered citizen with no federated `IdentityMap` link halt gracefully with `UNLINKED_FEDERATION_RECORD` without throwing unhandled exceptions or exposing upstream errors.
6. **Consent & Data Minimization Invariant:** Data is only retrieved from departmental connectors when active, unexpired, and purpose-aligned consent exists; revoking consent halts the workflow pipeline immediately.
7. **End-to-End Workflow Execution Invariant:** A citizen can initiate a scheme application (e.g. Scholarship), orchestrate the required departmental connectors, and achieve a terminal state (`SUBMITTED` or `FAILED`) with accurate criteria evaluation.
8. **SHA-256 Audit Chain Integrity Invariant:** Every system action appends an immutable, sequentially linked block to the citizen's audit chain; `GET /api/audit/:citizenId/verify` returns `valid: true` with zero broken links from genesis.
9. **Role-Based Access Control Invariant:** Administrative endpoints (connector onboarding, grievance determination, appeal status updates, ops retention purge) reject standard citizens with HTTP 403 Forbidden.
10. **Cryptographic Certificate Verification Invariant:** Completed eligible workflows issue Ed25519 signed certificates verifiable via public verification URL and QR code token without requiring citizen login.

---

## 4. Full-Codebase Readability & Architecture Pass

The following issues were identified across the codebase:
- **`packages/backend/src/workflow/engine.ts`**: Contains arbitrary hardcoded delays (`await delay(600)`, `delay(400)`, `delay(800)`) embedded directly into core workflow execution logic to artificially slow down processing for presentations. Also employs recursive `await this.advance(runId)` tail calls rather than an iterative state machine loop.
- **`packages/backend/src/gateway/audit.routes.ts`**: Imports `prisma` from `../config/db` but never uses it.
- **`packages/backend/src/gateway/consent.routes.ts`**: Employs an unnecessary dynamic `await import('../config/db')` inside a high-throughput route handler instead of using top-level module imports.
- **`packages/frontend/src/pages/OpsPage.tsx` & `packages/frontend/src/hooks/useApi.ts`**: In `useApi.ts`, the circuit breaker reset endpoint is hardcoded to `/api/ops/circuits/:slug/reset`, whereas `ops.routes.ts` registers `/api/ops/circuit-breaker/:slug/reset`. This causes manual circuit breaker resets from the Ops UI to fail with a 404 error.
- **`packages/frontend/src/store/authStore.ts`**: The `login()` action accepts an untyped variable argument list (`...args: any[]`) with fragile positional indexing (`args[0]`, `args[1]`), and provides a dangerous fallback `citizenId = profile.citizenId || 'citizen-000001'`, which risks silent identity impersonation if an invalid profile is passed.
- **`packages/frontend/src/styles/`**: Three separate CSS files (`src/index.css`, `src/styles/index.css`, `src/styles/global.css`) form a redundant chain where `main.tsx` imports both `index.css` and `styles/global.css`, duplicating CSS imports.
- **`packages/worker/src/index.ts`**: Uses fragile cross-package relative path imports (`../../backend/src/...`) to import backend source files, coupling the worker build to backend directory structure. Furthermore, the graceful shutdown hook closes `worker` but fails to terminate `cronWorker`.
- **`scripts/make-admin.js`**: Contains dead parsing logic where regex values from `.env` are matched and assigned to a local variable `val` that is never applied to `process.env`.
- **`packages/backend/scripts/migrate_audit_legacy_payload.ts`**: Instantiates an unpooled `new PrismaClient()` directly and contains incorrect usage instructions in its header comments.

---

## 5. Dead Code Identification

| File / Component | Type | References Found | Confidence | Safe to Remove? |
|---|---|---|---|---|
| `packages/backend/src/connectors/connectors.ts` | File | Legacy re-export shim; zero imports across codebase (all import from `runner.ts`) | High | Yes |
| `packages/frontend/src/store/workflowStore.ts` | File | Zero imports in frontend; pages use local `useState` & `api.getWorkflow` | High | Yes |
| `packages/frontend/src/store/auditStore.ts` | File | Zero imports in frontend; pages use local `useState` & `api.getAuditTrail` | High | Yes |
| `packages/frontend/src/i18n/stub.ts` | File | Zero imports; superseded by `i18next` integration in `i18n/index.ts` | High | Yes |
| `packages/frontend/src/i18n/en.keys.ts` | File | Only imported by dead `stub.ts`; superseded by `en.json` | High | Yes |
| `scripts/generate_synthetic_db.js` | File | Duplicate CommonJS copy of `scripts/generate_synthetic_db.ts` | High | Yes |
| `packages/mock-identity/src/citizens.js` | File | Duplicate copy of 50-citizens generator (duplicated across 4 files) | Medium | Consolidate |
| `packages/mock-education/src/citizens.js`| File | Duplicate copy of 50-citizens generator (duplicated across 4 files) | Medium | Consolidate |
| `packages/mock-revenue/src/citizens.js`  | File | Duplicate copy of 50-citizens generator (duplicated across 4 files) | Medium | Consolidate |
| `scripts/onegov_schema.sql` | File | Legacy standalone schema; Prisma migrations are source of truth | Medium | Archive/Docs |

---

## 6. Risk Path & Customer Data Boundary Review

1. **Critical Transactional Path:**
   - Workflows are triggered via `workflowRoutes` calling `workflowEngine.advance(run.id).catch(console.error)` in a background fire-and-forget promise. If an unhandled rejection occurs during intermediate state transitions before entering the BullMQ retry queue, the workflow hangs indefinitely in an intermediate state without user feedback.
   - In `calculateAndSubmit()`, if `certificateService.issue()` fails, the failure is caught and logged to console, but the run still transitions to `SUBMITTED`, creating an eligible application without a cryptographic certificate.
2. **Missing Customer Data Boundaries (Broken Isolation):**
   - `GET /api/workflow/:runId`: Does not verify that `run.citizenId === req.user.citizenId`. Any authenticated user can view any other citizen's full workflow run and demographic details.
   - `POST /api/workflow/:runId/advance`: Any authenticated citizen can trigger step execution on any other citizen's workflow.
   - `POST /api/consent/grant`: Overwrites `citizenId` with `workflowRun.citizenId` without verifying that the requester is the run owner or an authorized guardian.
   - `GET /api/consent/run/:runId`: Any authenticated user can view all consent artefacts of any other user's workflow.
   - `GET /api/certificate/:runId`: Returns another citizen's signed eligibility certificate without checking ownership.
   - `POST /api/certificate/:runId/issue`: Allows any authenticated user to issue a certificate for any run.
   - `GET /api/auth/citizens`: Publicly accessible endpoint without authentication that exposes all seeded citizens' OneGov IDs and federated department IDs (`IdentityMap` containing simulated Aadhaar, PAN, etc.).
   - Rate limit & Admin Ops Bypass: The `x-admin-role: ADMIN` header unconditionally grants rate limit immunity (`server.ts`) and full administrative access to `/api/ops` endpoints without cryptographic token validation.
3. **Automated Isolation Testing:**
   - **Zero cross-account data isolation tests exist** in the repository. No test currently asserts that Citizen A receives a 403 or 404 when attempting to view or alter Citizen B's applications, consents, or certificates.

---

## 7. Master Cleanup Task List

Tasks are ordered strictly by **Risk Level (Lowest First)** to ensure maximum reversibility and stability during execution.

### Low Risk (Cosmetic, Naming, Typing, Redundant Styles)

| # | File Name & Path | Issue | Suggested Fix | Category | Risk Level |
|---|---|---|---|---|---|
| 1 | Repository Root | No labeled baseline checkpoint exists in git or database | Create git tag `checkpoint-pre-cleanup` and dump Postgres DB | Other | Low |
| 2 | `packages/backend/src/gateway/audit.routes.ts` | Unused `prisma` import from `../config/db` | Remove unused `prisma` import from file header | Refactor | Low |
| 3 | `packages/backend/package.json` | No standard `"test"` npm script defined | Add `"test": "node --test dist/**/*.test.js"` to scripts | Other | Low |
| 4 | `packages/frontend/src/hooks/useApi.ts` | Circuit breaker reset URL mismatch (`/api/ops/circuits/...`) | Update path to `/api/ops/circuit-breaker/${connectorSlug}/reset` | Refactor | Low |
| 5 | `packages/frontend/src/styles/index.css` | Redundant stylesheet chain with duplicate `@import` of `global.css` | Consolidate font imports into `global.css` and remove `index.css` indirection | Refactor | Low |
| 6 | `packages/frontend/src/main.tsx` | Redundant duplicate imports of `index.css` and `styles/global.css` | Import single canonical `styles/global.css` directly | Refactor | Low |
| 7 | `packages/frontend/src/store/authStore.ts` | `login` action takes loose `...args: any[]` with hardcoded fallback ID | Enforce typed profile argument and remove hardcoded `'citizen-000001'` fallback | Refactor | Low |
| 8 | `scripts/make-admin.js` | Dead code: parsed `.env` variables are assigned to `val` but not `process.env` | Assign parsed key-value pairs to `process.env[key]` | Refactor | Low |
| 9 | `packages/backend/scripts/migrate_audit_legacy_payload.ts` | Comment contains invalid path and script instantiates duplicate `PrismaClient` | Fix header comment path and import singleton `prisma` from `config/db` | Refactor | Low |
| 10 | `packages/backend/src/certificates/certificate.service.ts` | Default fallback keys are hardcoded in source without warning | Emit warning if fallback test keys are used in non-test environments | Guard | Low |

---

### Medium Risk (Structural, Dead Code Removal, Dataset Consolidation)

| # | File Name & Path | Issue | Suggested Fix | Category | Risk Level |
|---|---|---|---|---|---|
| 11 | `packages/backend/src/connectors/connectors.ts` | Dead backwards-compatibility re-export shim | Remove file; ensure all references use `runner.ts` | Delete | Medium |
| 12 | `packages/frontend/src/store/workflowStore.ts` | Unused Zustand workflow store (zero imports) | Delete unused store file | Delete | Medium |
| 13 | `packages/frontend/src/store/auditStore.ts` | Unused Zustand audit store (zero imports) | Delete unused store file | Delete | Medium |
| 14 | `packages/frontend/src/i18n/stub.ts` | Dead translation stub function superseded by `i18next` | Delete unused `stub.ts` | Delete | Medium |
| 15 | `packages/frontend/src/i18n/en.keys.ts` | Dead translation dictionary used only by dead `stub.ts` | Delete unused `en.keys.ts` | Delete | Medium |
| 16 | `scripts/generate_synthetic_db.js` | Unused CommonJS duplicate of TypeScript generator | Delete redundant `.js` file in favor of `.ts` | Delete | Medium |
| 17 | `packages/mock-identity/src/citizens.js` | Redundant copy of 50-citizens dataset duplicated across 4 files | Replace with shared import or generate script dependency | Refactor | Medium |
| 18 | `packages/mock-education/src/citizens.js` | Redundant copy of 50-citizens dataset duplicated across 4 files | Replace with shared import or generate script dependency | Refactor | Medium |
| 19 | `packages/mock-revenue/src/citizens.js` | Redundant copy of 50-citizens dataset duplicated across 4 files | Replace with shared import or generate script dependency | Refactor | Medium |
| 20 | `packages/backend/src/workflow/engine.ts` | Artificial demo delays (`delay(600)`, etc.) embedded in core logic | Extract demo pacing to configurable environment flag (`DEMO_PACING_MS`) | Refactor | Medium |
| 21 | `packages/backend/src/workflow/engine.ts` | Tail recursion `advance(runId)` can stack overflow on deep workflows | Refactor step progression into an iterative loop | Refactor | Medium |
| 22 | `packages/worker/src/index.ts` | Worker shutdown hook terminates `worker` but leaves `cronWorker` running | Add `await cronWorker.close()` to shutdown routine | Guard | Medium |
| 23 | `packages/frontend/src/App.tsx` | `/ops`, `/admin/onboarding`, `/admin/appeals` lack client-side role guards | Add `RequireAdmin` route guard wrapper checking `role === 'ADMIN'` | Guard | Medium |
| 24 | `packages/backend/src/consent/consent.routes.ts` | Dynamic `import('../config/db')` inside route handler | Replace with standard top-level `prisma` import | Refactor | Medium |

---

### High Risk (Authentication, Authorization, Customer Data Boundary & Security)

| # | File Name & Path | Issue | Suggested Fix | Category | Risk Level |
|---|---|---|---|---|---|
| 25 | `packages/backend/src/gateway/workflow.routes.ts` | `GET /:runId` lacks ownership check; leaks citizen data across accounts | Require `run.citizenId === req.user.citizenId` or `req.user.role === 'ADMIN'` | Guard | High |
| 26 | `packages/backend/src/gateway/workflow.routes.ts` | `POST /:runId/advance` allows arbitrary users to advance other users' runs | Verify caller owns `runId` before triggering workflow advancement | Guard | High |
| 27 | `packages/backend/src/gateway/consent.routes.ts` | `POST /grant` overwrites `citizenId` without checking caller owns `runId` | Verify `req.user.citizenId === workflowRun.citizenId` or valid guardian relationship | Guard | High |
| 28 | `packages/backend/src/gateway/consent.routes.ts` | `GET /run/:runId` exposes consent artefacts to any authenticated user | Restrict retrieval to workflow owner or administrator | Guard | High |
| 29 | `packages/backend/src/gateway/certificate.routes.ts` | `GET /:runId` returns certificate without verifying citizen ownership | Verify `cert.citizenId === req.user.citizenId` or `req.user.role === 'ADMIN'` | Guard | High |
| 30 | `packages/backend/src/gateway/certificate.routes.ts` | `POST /:runId/issue` allows any user to issue certificates for any run | Restrict certificate issuance to run owner or administrator | Guard | High |
| 31 | `packages/backend/src/gateway/auth.routes.ts` | Public unauthenticated `/citizens` route leaks all citizen `IdentityMap` IDs | Strip sensitive departmental IDs or require authentication | Guard | High |
| 32 | `packages/backend/src/gateway/demo.routes.ts` | `/demo-login` lacks production guard (`NODE_ENV === 'production'`) | Disable demo passwordless login endpoint in production environment | Guard | High |
| 33 | `packages/backend/src/gateway/ops.routes.ts` | Unauthenticated header `x-admin-role: ADMIN` grants full ops access | Require validated JWT with `role === 'ADMIN'` and remove header bypass | Guard | High |
| 34 | `packages/backend/src/server.ts` | Unauthenticated header `x-admin-role: ADMIN` bypasses rate limiting | Remove `x-admin-role` header check from rate limit `allowList` | Guard | High |
| 35 | `packages/backend/src/gateway/notification.routes.ts` | `POST /test-scan` is unauthenticated | Require authentication and `ADMIN` role to trigger manual scan | Guard | High |
| 36 | `packages/backend/src/__tests__/data.isolation.test.ts` [NEW] | No automated test proving account data isolation exists | Implement test suite asserting 403/404 when Citizen A accesses Citizen B data | Guard | High |

---

## 8. Summary of Findings & Invariant Impact Analysis

- **Total Tasks Identified:** 36 tasks
- **Tasks by Risk Level:**
  - **Low Risk:** 10 tasks (Cosmetic, typing, redundant CSS imports, tooling scripts)
  - **Medium Risk:** 14 tasks (Dead code deletion, dataset consolidation, loop refactoring, route guards)
  - **High Risk:** 12 tasks (Tenant data boundary isolation, auth & admin role verification, rate limit bypass removal, automated isolation testing)

### High-Risk Tasks & Impacted Invariants

| High-Risk Task # | Targeted Route / Component | Potentially Impacted Invariant | Failure Mode If Handled Carelessly |
|---|---|---|---|
| **Task 25 & 26** | `workflow.routes.ts` (`/:runId`) | **Invariant 4** (Data Boundary) & **Invariant 7** (Workflow Execution) | Legitimate users or automated smoke tests might be blocked from querying their own run if JWT claims mismatch. |
| **Task 27 & 28** | `consent.routes.ts` (`/grant`, `/run/:runId`) | **Invariant 6** (Consent Enforcement) & **Invariant 2** (Guardian Consent) | Guardian authorization checks could fail if dependent relationships are not resolved accurately. |
| **Task 29 & 30** | `certificate.routes.ts` (`/:runId`) | **Invariant 10** (Verifiable Certificates) | Automated issuance during workflow completion might be rejected if the system actor is not recognized. |
| **Task 31** | `auth.routes.ts` (`/citizens`) | **Invariant 2** (Persona Selection) | Stripping too much data from `/citizens` could break the demo persona selector cards on the login page. |
| **Task 32** | `demo.routes.ts` (`/demo-login`) | **Invariant 2** (Smoke Tests / Automation) | Disabling `demo-login` unconditionally would break `scripts/test-phase4.js` and automated CI scripts. |
| **Task 33 & 34** | `ops.routes.ts` & `server.ts` (`x-admin-role`) | **Invariant 9** (Role-Based Access) | Removing the header without verifying frontend passes JWT tokens could break the Ops Dashboard. |
| **Task 35** | `notification.routes.ts` (`/test-scan`) | **Invariant 9** (Role-Based Access) | External cron trigger could fail if not updated with appropriate admin credentials. |
| **Task 36** | `data.isolation.test.ts` | **Invariant 4** (Data Boundary Verification) | Regression suite could fail if test personas are not properly seeded. |

---

> [!IMPORTANT]
> **Execution Status:** Analysis pass complete. No code modifications or deletions have been performed. Execution will begin only upon explicit user approval of this task list.
