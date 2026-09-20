/**
 * packages/backend/src/__tests__/data.isolation.test.ts
 *
 * Task 36 — Automated Data Isolation Test Suite (Invariant 4)
 *
 * Proves that Citizen A cannot access, mutate, or download Citizen B's
 * workflow runs, consents, or certificates.
 *
 * Requires the backend server to be running on http://localhost:3000
 * and two deterministic test persona JWTs to be available.
 *
 * Run: npx ts-node -e "require('./src/__tests__/data.isolation.test')"
 * Or after build: node --test dist/__tests__/data.isolation.test.js
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_API_BASE ?? 'http://localhost:3000';

interface LoginResponse {
  token: string;
  citizenId: string;
}

async function apiRequest(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  let body: any = {};
  try { body = await res.json(); } catch { /* empty response */ }
  return { status: res.status, body };
}

async function loginAs(email: string, password: string): Promise<LoginResponse> {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, `Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return { token: res.body.token, citizenId: res.body.citizenId };
}

async function createWorkflowRun(token: string): Promise<string> {
  const res = await apiRequest('/api/workflow/start', {
    method: 'POST',
    body: JSON.stringify({ serviceType: 'SCHOLARSHIP' }),
  }, token);
  assert.equal(res.status, 200, `Failed to create workflow run: ${JSON.stringify(res.body)}`);
  return res.body.runId;
}

describe('Data Isolation Test Suite (Invariant 4)', () => {
  let citizenAToken: string;
  let citizenBToken: string;
  let runIdA: string; // workflow run owned by Citizen A

  before(async () => {
    // Use two deterministic seeded personas from the demo dataset.
    // These personas are seeded by scripts/generate_synthetic_db.ts.
    // Persona 1: rahul@govlink.demo / demo123
    // Persona 2: priya@govlink.demo / demo123 (second seeded citizen)
    const citizenA = await loginAs('rahul@govlink.demo', 'demo123');
    citizenAToken = citizenA.token;

    const citizenB = await loginAs('priya@govlink.demo', 'demo123');
    citizenBToken = citizenB.token;

    // Create a workflow run as Citizen A
    runIdA = await createWorkflowRun(citizenAToken);
  });

  test('Citizen B cannot view Citizen A\'s workflow run (expects 403)', async () => {
    const res = await apiRequest(`/api/workflow/${runIdA}`, {}, citizenBToken);
    assert.equal(
      res.status,
      403,
      `Expected 403 FORBIDDEN but got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.error, 'FORBIDDEN');
  });

  test('Citizen B cannot advance Citizen A\'s workflow run (expects 403)', async () => {
    const res = await apiRequest(`/api/workflow/${runIdA}/advance`, {
      method: 'POST',
      body: '{}', // Fastify requires non-empty body when Content-Type: application/json
    }, citizenBToken);
    assert.equal(
      res.status,
      403,
      `Expected 403 FORBIDDEN but got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.error, 'FORBIDDEN');
  });

  test('Citizen B cannot view Citizen A\'s consent artefacts (expects 403)', async () => {
    const res = await apiRequest(`/api/consent/run/${runIdA}`, {}, citizenBToken);
    assert.equal(
      res.status,
      403,
      `Expected 403 FORBIDDEN but got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.error, 'FORBIDDEN');
  });

  test('Citizen B cannot grant consent on Citizen A\'s workflow run (expects 403)', async () => {
    const res = await apiRequest('/api/consent/grant', {
      method: 'POST',
      body: JSON.stringify({
        runId: runIdA,
        categories: ['IDENTITY'],
      }),
    }, citizenBToken);
    assert.equal(
      res.status,
      403,
      `Expected 403 FORBIDDEN but got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.error, 'FORBIDDEN');
  });

  test('Citizen B cannot view Citizen A\'s certificate (expects 403 or 404)', async () => {
    const res = await apiRequest(`/api/certificate/${runIdA}`, {}, citizenBToken);
    // Either 403 (forbidden) or 404 (no cert yet) are acceptable — neither should be 200
    assert.ok(
      res.status === 403 || res.status === 404,
      `Expected 403 or 404 but got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
  });

  test('Citizen B cannot issue a certificate for Citizen A\'s run (expects 403)', async () => {
    const res = await apiRequest(`/api/certificate/${runIdA}/issue`, {
      method: 'POST',
      body: '{}', // Fastify requires non-empty body when Content-Type: application/json
    }, citizenBToken);
    assert.equal(
      res.status,
      403,
      `Expected 403 FORBIDDEN but got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.error, 'FORBIDDEN');
  });

  test('Citizen A can still view their own workflow run (expects 200)', async () => {
    const res = await apiRequest(`/api/workflow/${runIdA}`, {}, citizenAToken);
    assert.equal(
      res.status,
      200,
      `Citizen A should be able to view their own run. Got ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    assert.ok(res.body.id === runIdA, 'Run ID in response should match');
  });
});
