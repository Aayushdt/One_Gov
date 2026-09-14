import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toNarrative } from '../audit.narrator';

describe('Audit Narrator Unit Tests', () => {
  it('should map CITIZEN_LOGIN correctly', () => {
    const res = toNarrative({
      id: 'entry-1',
      seq: 1,
      eventType: 'CITIZEN_LOGIN',
      payload: { onegovId: 'OG-1234' },
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    assert.strictEqual(res.key, 'audit.citizenLogin');
    assert.strictEqual(res.params.onegovId, 'OG-1234');
  });

  it('should map CONSENT_GRANTED correctly', () => {
    const res = toNarrative({
      id: 'entry-2',
      seq: 2,
      eventType: 'CONSENT_GRANTED',
      payload: { runId: 'run-abc', category: 'IDENTITY', purpose: 'Testing' },
      createdAt: new Date(),
    });
    assert.strictEqual(res.key, 'audit.consentGranted');
    assert.strictEqual(res.params.category, 'IDENTITY');
  });

  it('should map CONNECTOR_SUCCESS and CONNECTOR_FAILED', () => {
    const successRes = toNarrative({
      id: 'entry-3',
      seq: 3,
      eventType: 'CONNECTOR_SUCCESS',
      payload: { department: 'UIDAI', verified: true },
      createdAt: new Date(),
    });
    assert.strictEqual(successRes.key, 'audit.connectorSuccess');
    assert.strictEqual(successRes.params.department, 'UIDAI');

    const failedRes = toNarrative({
      id: 'entry-4',
      seq: 4,
      eventType: 'CONNECTOR_FAILED',
      payload: { department: 'CBDT', error: 'Service unavailable' },
      createdAt: new Date(),
    });
    assert.strictEqual(failedRes.key, 'audit.connectorFailed');
    assert.strictEqual(failedRes.params.error, 'Service unavailable');
  });

  it('should map ELIGIBILITY_RESULT and WORKFLOW_STATE_CHANGE', () => {
    const eligRes = toNarrative({
      id: 'entry-5',
      seq: 5,
      eventType: 'ELIGIBILITY_RESULT',
      payload: { runId: 'run-123', eligible: true, serviceType: 'SCHOLARSHIP' },
      createdAt: new Date(),
    });
    assert.strictEqual(eligRes.key, 'audit.eligibilityResult');
    assert.strictEqual(eligRes.params.eligible, 'true');

    const stateRes = toNarrative({
      id: 'entry-6',
      seq: 6,
      eventType: 'WORKFLOW_STATE_CHANGE',
      payload: { runId: 'run-123', fromState: 'PENDING', toState: 'SUBMITTED' },
      createdAt: new Date(),
    });
    assert.strictEqual(stateRes.key, 'audit.workflowStateChange');
    assert.strictEqual(stateRes.params.toState, 'SUBMITTED');
  });

  it('should gracefully handle missing or null payload fields without throwing', () => {
    const emptyPayload = toNarrative({
      id: 'entry-7',
      seq: 7,
      eventType: 'CONSENT_GRANTED',
      payload: null,
      createdAt: '2026-01-01T00:00:00Z',
    });
    assert.strictEqual(emptyPayload.key, 'audit.consentGranted');
    assert.strictEqual(emptyPayload.params.runId, '');

    const unknownEvent = toNarrative({
      id: 'entry-8',
      seq: 8,
      eventType: 'UNKNOWN_CUSTOM_EVENT',
      payload: undefined,
      createdAt: new Date(),
    });
    assert.strictEqual(unknownEvent.key, 'audit.genericEvent');
    assert.strictEqual(unknownEvent.params.eventType, 'UNKNOWN_CUSTOM_EVENT');
  });
});
