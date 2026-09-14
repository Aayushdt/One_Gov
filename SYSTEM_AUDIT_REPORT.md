# GovLink — End-to-End System Audit & Discrepancy Report

**Audit Date:** September 14, 2026  
**Auditor:** Antigravity (Advanced Agentic Assistant)  
**Scope:** Backend API, Standalone Worker, Frontend Portal, Mock Silos, Docker Stack, Test Suites, and Design System Alignment against `implementation_plan.md`.

---

## 1. Executive Summary

A comprehensive architectural and code-level audit was conducted across the entire GovLink repository. The platform successfully runs all 8 Docker containers, passes **18/18 pre-demo smoke tests** (`scripts/smoke_test.sh`), passes all **Phase 4 integration flows** (`scripts/test-phase4.js`), and passes all 12 isolated unit test suites.

However, a granular inspection revealed **10 distinct findings**, ranging from frontend runtime network errors and broken verification URLs to missing administrative user interfaces and incomplete specifications from the original implementation plan.

> [!NOTE]
> **Remediation Status: ALL 10 FINDINGS RESOLVED (September 14, 2026)**
> All 10 items identified in this audit report have been remediated in code, built, deployed to the live container stack, and verified passing 18/18 smoke test checks and all Phase 4 integration flows. Details in [walkthrough.md](file:///home/aayushchoudhary/.gemini/antigravity-ide/brain/f1ae5434-9eaa-42d6-8ede-598fbdd3698e/walkthrough.md).

---

## 2. High-Severity Functional Errors & Bugs

### 2.1. Relative `fetch()` Failure in Data Export Download
- **Location:** `packages/frontend/src/pages/DataExportPage.tsx:L65`
- **Severity:** High (Runtime Error)
- **Issue:**  
  In `DataExportPage.tsx`, the export download handler executes:
  ```ts
  const response = await fetch(`/api/export/${exportId}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  ```
  The Vite dev server (`vite.config.ts`) has no reverse proxy configured for `/api/`. Therefore, the browser makes a request to `http://localhost:5173/api/export/...`, which hits the Vite development server rather than the Fastify backend on port 3000.
- **Symptom:**  
  Vite returns the single-page application's `index.html` with a 200/404 HTML response instead of JSON. The downloaded file contains HTML rather than the citizen's personal data dossier.
- **Recommended Remediation:**  
  Use the centralized `api` helper or prepend `import.meta.env.VITE_API_BASE_URL` to match all other authenticated requests.

---

### 2.2. Certificate QR Code Verification URL Mismatch
- **Location:** `packages/frontend/src/pages/CertificatePage.tsx:L52-L54` vs. `packages/backend/src/gateway/certificate.routes.ts:L38`
- **Severity:** High (Broken External Verification)
- **Issue:**  
  `CertificatePage.tsx` constructs the QR code verification URL as:
  ```ts
  const verifyUrl = `${window.location.origin}/api/verify/certificate?token=${encodeURIComponent(res.token)}`;
  ```
  This introduces two distinct defects:
  1. **Route mismatch:** The backend route is registered under the prefix `/api/certificate` in `server.ts` with sub-route `/public/verify`, meaning the actual endpoint is `/api/certificate/public/verify`, NOT `/api/verify/certificate`.
  2. **Origin mismatch:** `window.location.origin` resolves to port 5173 (the React frontend). An external verifier scanning the QR code with a phone or camera will send an HTTP GET to port 5173, where no certificate verification handler exists.
- **Symptom:**  
  Scanning the cryptographic certificate QR code produces a 404 Not Found error.
- **Recommended Remediation:**  
  Update the URL generator to target `${API_BASE}/api/certificate/public/verify?token=...` or create a dedicated public verification UI route at `/verify/certificate` in React that calls the backend.

---

## 3. Incomplete Features & Specification Gaps

### 3.1. Missing Admin Review & Moderation UI for Appeals & Grievances
- **Location:** `packages/frontend/src/pages/AppealPage.tsx`, `packages/frontend/src/components/GrievanceFlagButton.tsx`
- **Relevant Plan Section:** Item 9 (Appeals / Reconsideration Flow) & Item 13 (Grievances)
- **Severity:** Medium
- **Issue:**  
  The backend endpoints for administrative resolution are fully functional (`PATCH /api/appeals/:id/status`, `POST /api/appeals/:id/rerun`, `PATCH /api/grievances/:id`), and TypeScript helpers exist in `useApi.ts`. However, there is **no user interface for administrators to view, review, uphold, or dismiss appeals or resolve grievance flags**.
- **Current State:**  
  Citizens can file appeals and flag audit entries through the UI, but administrators can only process them using CLI scripts (`node scripts/test-phase4.js`) or raw `curl` commands.
- **Recommended Remediation:**  
  Add an "Appeals & Grievance Review Queue" tab or screen under `/admin/appeals` accessible to users with the `ADMIN` role.

---

### 3.2. Static Services Catalog vs. Dynamic Registry Database
- **Location:** `packages/frontend/src/pages/ServicesPage.tsx:L20-L60`
- **Relevant Plan Section:** Item 1 (Connector Registry & Service Definition Schema)
- **Severity:** Medium
- **Issue:**  
  Item 1 introduced the `ServiceDefinition` model in Prisma, populated by `seed.ts` and exposed via `GET /api/registry/services`. However, `ServicesPage.tsx` currently renders a hardcoded in-memory array `SERVICES = [...]` containing only 3 services (Scholarship, Transport, Welfare).
- **Symptom:**  
  If an administrator onboards a new government scheme or modifies required categories in the database, the citizen service catalog will not reflect the changes without redeploying frontend code.
- **Recommended Remediation:**  
  Modify `ServicesPage.tsx` to fetch available services from `api.getServices()` on mount, with a fallback to default schemes if offline.

---

### 3.3. Real-Time SSE Stream Replaced with Polling
- **Location:** `packages/frontend/src/components/NotificationBell.tsx:L33`, `packages/backend/src/gateway/notification.routes.ts`
- **Relevant Plan Section:** Item 5 (Real-Time Event Streaming & Notifications)
- **Severity:** Low / Optimization
- **Issue:**  
  Item 5 specified a Server-Sent Events (SSE) endpoint `GET /api/notifications/stream` leveraging Redis Pub/Sub for immediate push notifications. Instead, `notification.routes.ts` implements standard REST query endpoints, and `NotificationBell.tsx` polls the server on a 10-second interval (`setInterval(fetchNotifications, 10000)`).
- **Impact:**  
  While functional, 10-second polling introduces latency for notification delivery and produces unnecessary HTTP request overhead compared to an open SSE stream.

---

### 3.4. Guardian Consent Form Elements Omitted from Frontend
- **Location:** `packages/frontend/src/pages/ConsentPage.tsx` vs. `packages/backend/src/consent/consent.service.ts:L18`
- **Relevant Plan Section:** Item 2 (Guardian Consent for Minors)
- **Severity:** Medium
- **Issue:**  
  The Prisma schema includes `GuardianRelationship` and `ConsentArtefact.guardianId`, and `ConsentService.grantConsent()` supports recording a guardian ID. However, `ConsentPage.tsx` contains no input fields or conditional logic to verify whether an applicant is a minor (under 18 years of age) or collect a guardian's OneGov ID / authorization.
- **Recommended Remediation:**  
  Inspect the citizen's DOB or profile; if aged < 18, render a "Guardian Authorization" card requesting Guardian OneGov ID before enabling the consent grant button.

---

## 4. UI Completeness & Design Inconsistencies

### 4.1. Missing Municipal Department in Data Minimization Toggle
- **Location:** `packages/frontend/src/components/DataMinimizationToggle.tsx`
- **Severity:** Low
- **Issue:**  
  `DataMinimizationToggle.tsx` defines raw vs. minimized field mappings for 7 simulated department silos (`IDENTITY`, `EDUCATION`, `INCOME`, `TRANSPORT`, `POLICE`, `BANKING`, `WELFARE`). It omits the 8th department: **Municipal Land Records (`MUNICIPAL_RAW_FIELDS` / `municipalSnapshot`)**.
- **Impact:**  
  Any workflow involving municipal property verification will not show its data minimization transformation breakdown on the result page.

---

### 4.2. Incomplete Internationalization (i18n) Coverage
- **Location:** `packages/frontend/src/i18n/en.json`
- **Relevant Plan Section:** Item 6 (Multilingual Support)
- **Severity:** Low
- **Issue:**  
  While the translation infrastructure (`react-i18next`, language switcher in `Nav.tsx`, `en.json`, and `hi.json`) is operational, only `Nav.tsx`, `AuditNarrativePage.tsx`, and `OfflineBanner.tsx` utilize `useTranslation()`.
  The newer screens (`ConsentDashboardPage`, `AppealPage`, `CertificatePage`, `DataExportPage`, `AdminOnboardingPage`, `OpsPage`, and `ServicesPage`) have hardcoded English UI strings.
- **Impact:**  
  Switching to Hindi (HI) translates the top navigation bar and audit narrative, but leaves the body of newer pages in English.

---

### 4.3. Offline Banner Present without Local Caching Layer
- **Location:** `packages/frontend/src/components/OfflineBanner.tsx`
- **Severity:** Low / Informational
- **Issue:**  
  The banner states: *"You are currently offline. Showing cached information. Network requests will resume when reconnected."* However, there is no Service Worker registration or IndexedDB caching implementation. If a citizen goes offline, navigating to another page will fail to load network data.

---

## 5. Architectural, Concurrency & Security Edge Cases

### 5.1. Genesis Entry Race Condition in `AuditService.log`
- **Location:** `packages/backend/src/audit/audit.service.ts:L39-L45`
- **Severity:** Low / Concurrency Edge Case
- **Issue:**  
  `AuditService.log()` locks the citizen's previous log entry to prevent sequence collisions:
  ```sql
  SELECT seq, hash FROM "AuditEntry"
  WHERE "citizenId" = ${params.citizenId}
  ORDER BY seq DESC LIMIT 1 FOR UPDATE;
  ```
  On the **first log entry for a new citizen**, 0 rows exist in the table. In PostgreSQL, `SELECT ... FOR UPDATE` on an empty result set acquires **no row locks**.
- **Impact:**  
  If two concurrent requests (e.g., simultaneous login and workflow initiation) attempt to write the genesis entry (`seq = 1`) for a new citizen at the exact same millisecond, both will read `lastEntry = null` and calculate `seq = 1`. PostgreSQL's `@@unique([citizenId, seq])` constraint will abort one transaction with a `P2002` error rather than corrupting the hash chain, but the failing request returns an unhandled 500 internal server error.
- **Recommended Remediation:**  
  Wrap the audit insertion in an optimistic retry block, or acquire an advisory lock on the `citizenId` (`pg_advisory_xact_lock(hashtext(citizenId))`).

---

### 5.2. Test Runner Open Handles on Host Execution
- **Location:** `packages/backend/src/**/__tests__/*.test.ts`, `packages/worker/src/__tests__/*.test.ts`
- **Severity:** Low / Developer Experience
- **Issue:**  
  When executing unit tests on the host environment via `npx ts-node`, modules that instantiate `IORedis` (such as `RateLimiter` or `BullMQ`) or Prisma Client maintain active TCP socket connections. Because the test files do not call `process.exit(0)` or explicitly disconnect their connection pools in `after()`, the process remains active indefinitely after all tests have passed.
- **Recommended Remediation:**  
  Add `after(async () => { await redis.quit(); await prisma.$disconnect(); });` to all test suites.

---

## 6. Audit Summary Checklist

| # | Item / Component | Finding Type | Severity | Status |
|---|---|---|---|---|
| **1** | `DataExportPage.tsx` | Relative `fetch('/api/export/...')` hits port 5173 instead of backend | **High** | Requires Fix |
| **2** | `CertificatePage.tsx` | QR code URL points to invalid subpath `/api/verify/certificate` on frontend port | **High** | Requires Fix |
| **3** | `Appeals & Grievances` | No Administrative Review / Moderation UI implemented in frontend | **Medium** | Missing Feature |
| **4** | `ServicesPage.tsx` | Renders hardcoded array; does not query dynamic `ServiceDefinition` DB API | **Medium** | Incomplete |
| **5** | `ConsentPage.tsx` | Guardian consent verification inputs missing for minor applicants (< 18) | **Medium** | Missing Feature |
| **6** | `NotificationBell.tsx` | Uses 10s polling interval instead of real-time Redis Pub/Sub SSE stream | **Low** | Optimization |
| **7** | `DataMinimizationToggle` | Omitted Municipal Land Records (`municipalSnapshot`) fields | **Low** | Incomplete |
| **8** | `i18n Localization` | Only 3 components use `useTranslation()`; remaining pages hardcoded in English | **Low** | Partial |
| **9** | `OfflineBanner.tsx` | Banner claims cached data is shown, but no Service Worker / IndexedDB exists | **Low** | UX Inconsistency |
| **10**| `AuditService.log` | No row lock on genesis entry (`seq=1`); concurrent writes fail with unhandled 500 | **Low** | Edge Case |

---
*Report generated and saved to `SYSTEM_AUDIT_REPORT.md`.*
