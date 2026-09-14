// scripts/test-phase4.js
// Verification of Phase 4 (Items 9, 11, 13)

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('--- PHASE 4 INTEGRATION TEST ---');

  // 1. Authenticate Demo Citizen (Ananya - Standard Citizen) & Admin (Rahul - Admin)
  console.log('1. Testing Auth & Role claims...');
  const ananyaRes = await request('/api/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ onegovId: 'OG-2026-00000006' }),
  });
  if (!ananyaRes.ok) throw new Error(`Ananya login failed: ${JSON.stringify(ananyaRes.data)}`);
  const citizenToken = ananyaRes.data.token;
  const citizenRole = ananyaRes.data.role;
  console.log(`  ✓ Citizen (Ananya) logged in. Role: ${citizenRole}`);

  const rahulRes = await request('/api/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ onegovId: 'OG-2026-00000001' }),
  });
  if (!rahulRes.ok) throw new Error(`Rahul login failed: ${JSON.stringify(rahulRes.data)}`);
  const adminToken = rahulRes.data.token;
  const adminRole = rahulRes.data.role;
  console.log(`  ✓ Admin (Rahul) logged in. Role: ${adminRole}`);

  if (adminRole !== 'ADMIN') {
    throw new Error('Rahul is not ADMIN!');
  }

  // 2. Test Connector Onboarding & Role Guard (Item 11)
  console.log('\n2. Testing Item 11: Department Onboarding & Role Guard...');
  const unauthorizedOnboard = await request('/api/registry/connectors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({
      slug: 'test-transport',
      category: 'TRANSPORT',
      baseUrl: 'http://mock-transport:4005',
    }),
  });
  if (unauthorizedOnboard.status !== 403) {
    throw new Error(`Expected 403 for non-admin, got ${unauthorizedOnboard.status}`);
  }
  console.log('  ✓ Citizen correctly blocked with 403 FORBIDDEN');

  const adminOnboard = await request('/api/registry/connectors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      slug: 'test-transport',
      category: 'TRANSPORT',
      baseUrl: 'http://mock-identity:4001',
      skipHealthCheck: true,
    }),
  });
  if (adminOnboard.status !== 201) {
    throw new Error(`Admin onboard failed: ${JSON.stringify(adminOnboard.data)}`);
  }
  console.log(`  ✓ Admin registered connector successfully: slug=${adminOnboard.data.slug}`);

  // 3. Test Appeals Flow (Item 9)
  console.log('\n3. Testing Item 9: Appeals Flow...');
  // Create a workflow run
  const applyRes = await request('/api/workflow/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({ serviceType: 'SCHOLARSHIP' }),
  });
  if (!applyRes.ok) throw new Error(`Workflow start failed: ${JSON.stringify(applyRes.data)}`);
  const runId = applyRes.data.runId;
  console.log(`  ✓ Created workflow run: ${runId}`);

  // Create an appeal
  const appealRes = await request('/api/appeals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({
      runId,
      disputedCategory: 'INCOME',
      reason: 'Incorrect annual income reported by revenue department for FY2025',
    }),
  });
  if (appealRes.status !== 201) {
    throw new Error(`Appeal submission failed: ${JSON.stringify(appealRes.data)}`);
  }
  const appealId = appealRes.data.id;
  console.log(`  ✓ Appeal filed successfully: id=${appealId}, status=${appealRes.data.status}`);

  // Admin lists appeals
  const listAppealsRes = await request('/api/appeals', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!listAppealsRes.ok || !listAppealsRes.data.appeals?.length) {
    throw new Error(`List appeals failed: ${JSON.stringify(listAppealsRes.data)}`);
  }
  console.log(`  ✓ Admin listed appeals: ${listAppealsRes.data.appeals.length} found`);

  // Admin reviews appeal
  const updateAppealRes = await request(`/api/appeals/${appealId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'UPHELD',
      decisionNotes: 'Rectification accepted after manual verification',
    }),
  });
  if (!updateAppealRes.ok || updateAppealRes.data.status !== 'UPHELD') {
    throw new Error(`Update appeal failed: ${JSON.stringify(updateAppealRes.data)}`);
  }
  console.log(`  ✓ Admin resolved appeal: status=${updateAppealRes.data.status}`);

  // Admin triggers rerun
  const rerunRes = await request(`/api/appeals/${appealId}/rerun`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({}),
  });
  if (!rerunRes.ok) {
    throw new Error(`Rerun failed: ${JSON.stringify(rerunRes.data)}`);
  }
  console.log(`  ✓ Admin triggered rerun: newRunId=${rerunRes.data.newRun.id}`);

  // 4. Test Grievances Flow (Item 13)
  console.log('\n4. Testing Item 13: Grievance Flagging...');
  const auditRes = await request(`/api/audit/${ananyaRes.data.citizenId}`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  if (!auditRes.ok || !auditRes.data.entries?.length) {
    throw new Error(`Fetch audit chain failed: ${JSON.stringify(auditRes.data)}`);
  }
  const targetAuditEntry = auditRes.data.entries[0];
  console.log(`  ✓ Found audit entry ${targetAuditEntry.id} (seq #${targetAuditEntry.seq}, type: ${targetAuditEntry.eventType})`);

  const grievanceRes = await request('/api/grievances', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({
      auditEntryId: targetAuditEntry.id,
      reason: 'Unrecognized data query at odd hours',
    }),
  });
  if (grievanceRes.status !== 201) {
    throw new Error(`Grievance submission failed: ${JSON.stringify(grievanceRes.data)}`);
  }
  const grievanceId = grievanceRes.data.id;
  console.log(`  ✓ Grievance submitted: id=${grievanceId}`);

  const listGrievancesRes = await request('/api/grievances', {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  if (!listGrievancesRes.ok || !listGrievancesRes.data.grievances?.length) {
    throw new Error(`List grievances failed: ${JSON.stringify(listGrievancesRes.data)}`);
  }
  console.log(`  ✓ Citizen listed grievances: found ${listGrievancesRes.data.grievances.length}`);

  const resolveGrievanceRes = await request(`/api/grievances/${grievanceId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'RESOLVED',
      adminNote: 'Audited and confirmed authorized automated verification batch',
    }),
  });
  if (!resolveGrievanceRes.ok || resolveGrievanceRes.data.status !== 'RESOLVED') {
    throw new Error(`Resolve grievance failed: ${JSON.stringify(resolveGrievanceRes.data)}`);
  }
  console.log(`  ✓ Admin resolved grievance: status=${resolveGrievanceRes.data.status}`);

  // 5. Test Data Retention Ops Endpoint (Item 13)
  console.log('\n5. Testing Item 13: Data Retention Job...');
  const retentionRes = await request('/api/ops/retention/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({}),
  });
  if (!retentionRes.ok) {
    throw new Error(`Retention run failed: ${JSON.stringify(retentionRes.data)}`);
  }
  console.log(`  ✓ Retention job executed: cleaned ${retentionRes.data.cleanedRunsCount} runs, evaluated ${retentionRes.data.candidatesEvaluated}, protected active appeals: ${retentionRes.data.excludedDueToAppeals}`);

  console.log('\n=======================================');
  console.log('✓ ALL PHASE 4 INTEGRATION TESTS PASSED!');
  console.log('=======================================');
}

main().catch((err) => {
  console.error('\n❌ Phase 4 Integration Test FAILED:', err.message);
  process.exit(1);
});
