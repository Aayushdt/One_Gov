export interface NarrativeResult {
  seq: number;
  id: string;
  createdAt: string;
  eventType: string;
  key: string;
  params: Record<string, string>;
}

/**
 * Converts raw AuditEntry data into an i18n-ready { key, params } structure.
 * Guaranteed to never throw even when payloads are malformed or missing fields.
 */
export function toNarrative(entry: {
  id: string;
  seq: number;
  eventType: string;
  payload: any;
  createdAt: Date | string;
}): NarrativeResult {
  const payload = typeof entry.payload === 'object' && entry.payload !== null ? entry.payload : {};
  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : entry.createdAt.toISOString();

  switch (entry.eventType) {
    case 'CITIZEN_LOGIN':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.citizenLogin',
        params: {
          onegovId: String(payload.onegovId || ''),
        },
      };

    case 'CONSENT_GRANTED':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.consentGranted',
        params: {
          runId: String(payload.runId || ''),
          category: String(
            payload.category ||
              (Array.isArray(payload.categories) ? payload.categories.join(', ') : '')
          ),
          purpose: String(payload.purpose || ''),
        },
      };

    case 'CONSENT_REVOKED':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.consentRevoked',
        params: {
          runId: String(payload.runId || ''),
          category: String(payload.category || 'all categories'),
        },
      };

    case 'CONNECTOR_CALLED':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.connectorCalled',
        params: {
          department: String(payload.department || ''),
          attempt: String(payload.attempt || '1'),
          runId: String(payload.runId || ''),
        },
      };

    case 'CONNECTOR_SUCCESS':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.connectorSuccess',
        params: {
          department: String(payload.department || ''),
          verified: String(payload.verified ?? 'true'),
        },
      };

    case 'CONNECTOR_FAILED':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.connectorFailed',
        params: {
          department: String(payload.department || ''),
          error: String(payload.error || payload.reason || 'Connection failure'),
        },
      };

    case 'WORKFLOW_STATE_CHANGE':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.workflowStateChange',
        params: {
          runId: String(payload.runId || ''),
          fromState: String(payload.fromState || ''),
          toState: String(payload.toState || ''),
        },
      };

    case 'ELIGIBILITY_RESULT':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.eligibilityResult',
        params: {
          runId: String(payload.runId || ''),
          serviceType: String(payload.serviceType || ''),
          eligible: String(payload.eligible ?? ''),
          reason: String(payload.reason || ''),
        },
      };

    case 'DATA_ACCESSED':
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.dataAccessed',
        params: {
          category: String(payload.category || ''),
        },
      };

    default:
      return {
        seq: entry.seq,
        id: entry.id,
        createdAt,
        eventType: entry.eventType,
        key: 'audit.genericEvent',
        params: {
          eventType: entry.eventType,
        },
      };
  }
}
