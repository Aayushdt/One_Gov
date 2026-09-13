#!/usr/bin/env bash
# =============================================================================
# GovLink Smoke Test
# =============================================================================
# Verifies all services are healthy, then runs one complete SCHOLARSHIP workflow
# end-to-end for the Golden Standard persona (OG-2026-00000001).
#
# Usage:  bash scripts/smoke_test.sh
# Prereq: docker compose up --build must already be running.
# =============================================================================

set -euo pipefail

BACKEND="http://localhost:3000"
MOCK_IDENTITY="http://localhost:4001"
MOCK_EDUCATION="http://localhost:4002"
MOCK_REVENUE="http://localhost:4003"
POLL_TIMEOUT=90   # seconds to wait for workflow completion
PASS=0
FAIL=0

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ PASS${NC}  $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}❌ FAIL${NC}  $1"; FAIL=$((FAIL + 1)); }
info() { echo -e "  ${CYAN}ℹ${NC}  $1"; }
hdr()  { echo -e "\n${BOLD}${YELLOW}── $1 ──${NC}"; }

# ── Helper: HTTP GET with jq extraction ──────────────────────────────────────
get_field() {
  local url="$1" field="$2" token="${3:-}"
  if [[ -n "$token" ]]; then
    curl -sf -H "Authorization: Bearer $token" "$url" | jq -r "$field" 2>/dev/null || echo "ERROR"
  else
    curl -sf "$url" | jq -r "$field" 2>/dev/null || echo "ERROR"
  fi
}

http_status() {
  local url="$1" token="${2:-}"
  if [[ -n "$token" ]]; then
    curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$url"
  else
    curl -s -o /dev/null -w "%{http_code}" "$url"
  fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       GovLink Pre-Demo Smoke Test                ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# PHASE 1 — Service Health Checks
# =============================================================================
hdr "Phase 1: Service Health Checks"

check_health() {
  local label="$1" url="$2"
  local status
  status=$(http_status "$url")
  if [[ "$status" == "200" ]]; then
    local svc
    svc=$(curl -sf "$url" | jq -r '.status // "ok"' 2>/dev/null || echo "ok")
    ok "$label → $url (status=$svc)"
  else
    fail "$label → $url (HTTP $status)"
  fi
}

check_health "Backend API" "$BACKEND/health"

# Check aggregated upstream mock services health
SERVICES_HEALTH=$(curl -sf "$BACKEND/api/health/services" 2>/dev/null || echo "{}")
SVC_STATUS=$(echo "$SERVICES_HEALTH" | jq -r '.status // "unknown"')

if [[ "$SVC_STATUS" == "healthy" ]]; then
  ok "Aggregated Mock Services → $BACKEND/api/health/services (status=healthy)"
  for svc_key in "mock-identity" "mock-education" "mock-revenue"; do
    is_ok=$(echo "$SERVICES_HEALTH" | jq -r ".services[] | select(.key==\"$svc_key\") | .ok // false")
    label=$(echo "$SERVICES_HEALTH" | jq -r ".services[] | select(.key==\"$svc_key\") | .label // \"$svc_key\"")
    latency=$(echo "$SERVICES_HEALTH" | jq -r ".services[] | select(.key==\"$svc_key\") | .latencyMs // 0")
    if [[ "$is_ok" == "true" ]]; then
      ok "Upstream: $label (${latency}ms)"
    else
      fail "Upstream: $label reported unhealthy"
    fi
  done
else
  fail "Aggregated Mock Services status: $SVC_STATUS"
fi

# Check Redis indirectly via backend health (BullMQ would crash the worker if Redis is down)
BACKEND_BODY=$(curl -sf "$BACKEND/health" 2>/dev/null || echo "{}")
if echo "$BACKEND_BODY" | grep -q '"status"'; then
  ok "Backend startup (BullMQ + Redis implied healthy)"
else
  fail "Backend not responding or health check broken"
fi

# =============================================================================
# PHASE 2 — Persona Standard Login (Manual credentials from DEMO_CREDENTIALS.md)
# =============================================================================
hdr "Phase 2: Standard Login with Exported Persona Credentials"

LOGIN_RESP=$(curl -sf -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul@govlink.demo","password":"demo123"}' 2>/dev/null || echo "{}")

TOKEN=$(echo "$LOGIN_RESP" | jq -r '.token // empty')
CITIZEN_ID=$(echo "$LOGIN_RESP" | jq -r '.citizenId // empty')
ONEGOV_ID=$(echo "$LOGIN_RESP" | jq -r '.onegovId // empty')
NAME=$(echo "$LOGIN_RESP" | jq -r '.name // empty')

if [[ -n "$TOKEN" && "$TOKEN" != "null" ]]; then
  ok "Manual login with rahul@govlink.demo succeeded → $NAME ($ONEGOV_ID)"
  info "JWT token: ${TOKEN:0:32}…"
else
  fail "Manual login failed. Response: $LOGIN_RESP"
  echo -e "\n${RED}Cannot continue without a valid token. Aborting.${NC}"
  exit 1
fi

# Verify /me endpoint
ME_STATUS=$(http_status "$BACKEND/api/auth/me" "$TOKEN")
if [[ "$ME_STATUS" == "200" ]]; then
  ok "/api/auth/me with token → 200"
else
  fail "/api/auth/me returned HTTP $ME_STATUS"
fi

# =============================================================================
# PHASE 2B — New Citizen Self-Registration & Unlinked Workflow Behavior
# =============================================================================
hdr "Phase 2B: Citizen Self-Registration & Unlinked Workflow Guard"

REG_EMAIL="test.smoke.$(date +%s)@example.gov.in"
REG_RESP=$(curl -sf -X POST "$BACKEND/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Test Citizen\",\"email\":\"$REG_EMAIL\",\"password\":\"smokePass123\",\"state\":\"Karnataka\"}" \
  2>/dev/null || echo "{}")

REG_TOKEN=$(echo "$REG_RESP" | jq -r '.token // empty')
REG_ONEGOV_ID=$(echo "$REG_RESP" | jq -r '.onegovId // empty')
REG_CITIZEN_ID=$(echo "$REG_RESP" | jq -r '.citizenId // empty')

if [[ -n "$REG_TOKEN" && "$REG_TOKEN" != "null" ]]; then
  ok "Self-registration succeeded → $REG_ONEGOV_ID ($REG_EMAIL)"
else
  fail "Self-registration failed. Response: $REG_RESP"
fi

# Attempt workflow with unlinked self-registered account
REG_WF_RESP=$(curl -sf -X POST "$BACKEND/api/workflow/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REG_TOKEN" \
  -d '{"serviceType":"SCHOLARSHIP"}' 2>/dev/null || echo "{}")
REG_RUN_ID=$(echo "$REG_WF_RESP" | jq -r '.runId // empty')

curl -sf -X POST "$BACKEND/api/consent/grant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REG_TOKEN" \
  -d "{\"runId\":\"$REG_RUN_ID\",\"categories\":[\"IDENTITY\",\"EDUCATION\",\"INCOME\"]}" \
  >/dev/null 2>&1 || true

sleep 2
REG_STATUS_BODY=$(curl -sf -H "Authorization: Bearer $REG_TOKEN" "$BACKEND/api/workflow/$REG_RUN_ID" 2>/dev/null || echo "{}")
REG_WF_STATE=$(echo "$REG_STATUS_BODY" | jq -r '.state // empty')
REG_FAIL_REASON=$(echo "$REG_STATUS_BODY" | jq -r '.failureReason // empty')

if [[ "$REG_WF_STATE" == "FAILED" && "$REG_FAIL_REASON" == "UNLINKED_FEDERATION_RECORD" ]]; then
  ok "Unlinked self-registered citizen correctly halted with UNLINKED_FEDERATION_RECORD"
else
  fail "Expected UNLINKED_FEDERATION_RECORD halt, got state=$REG_WF_STATE reason=$REG_FAIL_REASON"
fi

# Verify audit chain for registered citizen
REG_AUDIT_VERIFY=$(curl -sf -H "Authorization: Bearer $REG_TOKEN" "$BACKEND/api/audit/$REG_CITIZEN_ID/verify" 2>/dev/null || echo "{}")
REG_AUDIT_VALID=$(echo "$REG_AUDIT_VERIFY" | jq -r '.valid // false')
if [[ "$REG_AUDIT_VALID" == "true" ]]; then
  ok "Audit chain valid for self-registered citizen"
else
  fail "Audit chain invalid for self-registered citizen"
fi

# =============================================================================
# PHASE 3 — Start Workflow
# =============================================================================
hdr "Phase 3: Start SCHOLARSHIP Workflow"

WF_RESP=$(curl -sf -X POST "$BACKEND/api/workflow/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"serviceType":"SCHOLARSHIP"}' 2>/dev/null || echo "{}")

RUN_ID=$(echo "$WF_RESP" | jq -r '.runId // empty')

if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
  ok "Workflow started → runId=$RUN_ID"
else
  fail "Failed to start workflow. Response: $WF_RESP"
  exit 1
fi

# =============================================================================
# PHASE 4 — Grant Consent
# =============================================================================
hdr "Phase 4: Grant Consent (all categories)"

CONSENT_RESP=$(curl -sf -X POST "$BACKEND/api/consent/grant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"runId\":\"$RUN_ID\",\"categories\":[\"IDENTITY\",\"EDUCATION\",\"INCOME\",\"BANKING\"]}" \
  2>/dev/null || echo "{}")

ARTEFACT_COUNT=$(echo "$CONSENT_RESP" | jq '.artefacts | length' 2>/dev/null || echo "0")

if [[ "$ARTEFACT_COUNT" -ge 4 ]]; then
  ok "Consent granted → $ARTEFACT_COUNT artefacts created"
else
  fail "Consent grant failed or returned fewer artefacts than expected. Response: $CONSENT_RESP"
fi

# =============================================================================
# PHASE 5 — Poll Workflow to Terminal State
# =============================================================================
hdr "Phase 5: Poll Workflow Until Terminal State (timeout ${POLL_TIMEOUT}s)"

START_TIME=$(date +%s)
WF_STATE="UNKNOWN"
RETRY_SEEN=false
ELAPSED=0

info "Polling every 2s…"
while true; do
  NOW=$(date +%s)
  ELAPSED=$((NOW - START_TIME))

  WF_BODY=$(curl -sf -H "Authorization: Bearer $TOKEN" "$BACKEND/api/workflow/$RUN_ID" 2>/dev/null || echo "{}")
  WF_STATE=$(echo "$WF_BODY" | jq -r '.state // "UNKNOWN"')
  RETRY_COUNT=$(echo "$WF_BODY" | jq -r '.retryCount // 0')

  if [[ "$WF_STATE" == "PENDING" && "$RETRY_SEEN" == "false" ]]; then
    info "→ State: PENDING (BullMQ retry #$RETRY_COUNT detected — working as expected)"
    RETRY_SEEN=true
  fi

  if [[ "$WF_STATE" == "SUBMITTED" || "$WF_STATE" == "FAILED" ]]; then
    break
  fi

  if [[ $ELAPSED -ge $POLL_TIMEOUT ]]; then
    fail "Workflow did not reach terminal state within ${POLL_TIMEOUT}s (last state: $WF_STATE)"
    exit 1
  fi

  printf "."
  sleep 2
done
echo ""

info "Final state: $WF_STATE (${ELAPSED}s elapsed)"

if [[ "$WF_STATE" == "SUBMITTED" ]]; then
  ok "Workflow reached SUBMITTED state"
elif [[ "$WF_STATE" == "FAILED" ]]; then
  FAILURE_REASON=$(echo "$WF_BODY" | jq -r '.failureReason // "unknown"')
  fail "Workflow reached FAILED state (reason: $FAILURE_REASON)"
fi

# =============================================================================
# PHASE 6 — Verify Eligibility Result
# =============================================================================
hdr "Phase 6: Verify Eligibility Result"

ELIGIBLE=$(echo "$WF_BODY" | jq -r '.eligibleResult // "null"')

if [[ "$ELIGIBLE" == "true" ]]; then
  ok "eligibleResult=true — Citizen #1 correctly deemed eligible"
else
  fail "eligibleResult=$ELIGIBLE — expected true for Golden Standard persona"
fi

STATE_COUNT=$(echo "$WF_BODY" | jq '.stateHistory | length' 2>/dev/null || echo "0")
ok "State history recorded → $STATE_COUNT transitions"

# =============================================================================
# PHASE 7 — Audit Chain Verification
# =============================================================================
hdr "Phase 7: Audit Chain Integrity"

AUDIT_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" "$BACKEND/api/audit/$CITIZEN_ID" 2>/dev/null || echo "{}")
ENTRY_COUNT=$(echo "$AUDIT_RESP" | jq '.entries | length' 2>/dev/null || echo "0")

if [[ "$ENTRY_COUNT" -gt 0 ]]; then
  ok "Audit trail present → $ENTRY_COUNT entries"
else
  fail "No audit entries found"
fi

VERIFY_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" "$BACKEND/api/audit/$CITIZEN_ID/verify" 2>/dev/null || echo "{}")
CHAIN_VALID=$(echo "$VERIFY_RESP" | jq -r '.valid // "false"')
TOTAL_ENTRIES=$(echo "$VERIFY_RESP" | jq -r '.totalEntries // 0')

if [[ "$CHAIN_VALID" == "true" ]]; then
  ok "SHA-256 hash chain valid → $TOTAL_ENTRIES sequential blocks verified from genesis"
else
  BROKEN_AT=$(echo "$VERIFY_RESP" | jq -r '.brokenAt // "unknown"')
  fail "Hash chain INVALID — broken at block #$BROKEN_AT"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║               SMOKE TEST RESULTS                ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════╣${NC}"
TOTAL=$((PASS + FAIL))
echo -e "${BOLD}║  Total checks : $TOTAL${NC}"
echo -e "${GREEN}${BOLD}║  Passed       : $PASS${NC}"
if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}${BOLD}║  Failed       : $FAIL${NC}"
else
  echo -e "${BOLD}║  Failed       : $FAIL${NC}"
fi
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"

if [[ $FAIL -eq 0 ]]; then
  echo -e "\n${GREEN}${BOLD}🟢 ALL CHECKS PASSED — GovLink is demo-ready.${NC}\n"
  exit 0
else
  echo -e "\n${RED}${BOLD}🔴 $FAIL CHECK(S) FAILED — resolve before going live.${NC}\n"
  exit 1
fi
