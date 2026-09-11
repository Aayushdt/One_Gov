#!/bin/bash
# GovLink Hackathon Demo Script
# Usage: bash scripts/demo.sh [scenario]
# Scenarios: wow1 (data minimization), wow2 (consent revoke), wow3 (audit chain)

set -e

BASE="http://localhost:3000"

log() { echo -e "\n\033[1;36m>>> $*\033[0m"; }
success() { echo -e "\033[1;32m✓ $*\033[0m"; }
fail() { echo -e "\033[1;31m✗ $*\033[0m"; }

SCENARIO=${1:-wow1}

log "=== GovLink Demo — Scenario: $SCENARIO ==="

# Step 1: Login as Priya (eligible, low income)
CITIZEN_EMAIL="priya@govlink.demo"
CITIZEN_PASSWORD="demo123"

if [ "$SCENARIO" = "wow2" ]; then
  CITIZEN_EMAIL="sneha@govlink.demo"
  log "Using Sneha Patel (Revenue retry demo)"
fi

log "1. Authenticating as $CITIZEN_EMAIL"
AUTH=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CITIZEN_EMAIL\",\"password\":\"$CITIZEN_PASSWORD\"}")

TOKEN=$(echo $AUTH | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
CITIZEN_ID=$(echo $AUTH | python3 -c "import sys,json; print(json.load(sys.stdin)['citizenId'])")
success "Authenticated. citizenId=$CITIZEN_ID"

# Step 2: Start workflow
log "2. Starting scholarship application workflow"
RUN=$(curl -sf -X POST "$BASE/api/workflow/start" -H "Authorization: Bearer $TOKEN")
RUN_ID=$(echo $RUN | python3 -c "import sys,json; print(json.load(sys.stdin)['runId'])")
success "Workflow started. runId=$RUN_ID"

# Step 3: Grant consent for all categories
log "3. Granting consent for IDENTITY, EDUCATION, INCOME"
curl -sf -X POST "$BASE/api/consent/grant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"$RUN_ID\",\"categories\":[\"IDENTITY\",\"EDUCATION\",\"INCOME\"]}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Granted {len(d[\"artefacts\"])} consent artefacts')"

# Step 4: Wait and poll
log "4. Polling workflow state (every 2s)..."
for i in {1..20}; do
  sleep 2
  STATE=$(curl -sf "$BASE/api/workflow/$RUN_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['state'])")
  echo "   [$i] State: $STATE"

  if [ "$STATE" = "SUBMITTED" ]; then
    success "Workflow complete!"
    break
  fi

  if [ "$STATE" = "FAILED" ]; then
    REASON=$(curl -sf "$BASE/api/workflow/$RUN_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('failureReason','unknown'))")
    fail "Workflow FAILED: $REASON"
    break
  fi

  # Wow moment #2: mid-flight revoke during INCOME_VERIFY (PENDING state)
  if [ "$SCENARIO" = "wow2" ] && ([ "$STATE" = "INCOME_VERIFY" ] || [ "$STATE" = "PENDING" ]) && [ "$i" -eq 4 ]; then
    log "  [WOW MOMENT #2] Revoking INCOME consent mid-flight!"
    curl -sf -X PATCH "$BASE/api/consent/run/$RUN_ID/revoke" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"category":"INCOME"}'
    success "Income consent REVOKED — next poll should show FAILED"
  fi
done

# Step 5: Get result
if [ "$STATE" = "SUBMITTED" ]; then
  log "5. Fetching eligibility result"
  curl -sf "$BASE/api/workflow/$RUN_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Eligible: {d[\"eligibleResult\"]}'); inc=d.get(\"incomeSnapshot\",{}); print(f'  Income snapshot (no raw figure): {json.dumps(inc,indent=2)}')"
fi

# Step 6 (Wow moment #3): Audit trail
log "6. [WOW MOMENT #3] Fetching audit trail and verifying hash chain"
curl -sf "$BASE/api/audit/$CITIZEN_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
entries=d['entries']
print(f'  Total entries: {len(entries)}')
for e in entries: print(f'  [{e[\"seq\"]:>3}] {e[\"eventType\"]:<35} hash:{e[\"hash\"][:12]}…')
"

VERIFY=$(curl -sf "$BASE/api/audit/$CITIZEN_ID/verify" -H "Authorization: Bearer $TOKEN")
VALID=$(echo $VERIFY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['valid'])")
TOTAL=$(echo $VERIFY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['totalEntries'])")

if [ "$VALID" = "True" ]; then
  success "Chain integrity: VALID ($TOTAL entries verified)"
else
  BROKEN=$(echo $VERIFY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('brokenAt','?'))")
  fail "Chain BROKEN at entry #$BROKEN"
fi

echo ""
log "=== Demo complete. Visit http://localhost:5173 for the full UI ==="
