export type NarrativeKey =
  | 'audit.citizenLogin'
  | 'audit.consentGranted'
  | 'audit.consentRevoked'
  | 'audit.connectorCalled'
  | 'audit.connectorSuccess'
  | 'audit.connectorFailed'
  | 'audit.workflowStateChange'
  | 'audit.eligibilityResult'
  | 'audit.dataAccessed'
  | 'audit.genericEvent';

export const ENGLISH_NARRATIVE_TEMPLATES: Record<NarrativeKey, (params: Record<string, string>) => string> = {
  'audit.citizenLogin': (_p) =>
    `Citizen logged in securely using verified credentials.`,
  'audit.consentGranted': (p) =>
    `Consent was granted for ${p.category || 'requested data'} to process application run ${p.runId ? p.runId.slice(0, 8) : ''}…`,
  'audit.consentRevoked': (p) =>
    `Consent was revoked for ${p.category || 'all categories'} on application run ${p.runId ? p.runId.slice(0, 8) : ''}…`,
  'audit.connectorCalled': (p) =>
    `Federated gateway queried the ${p.department || 'upstream department'} registry (attempt ${p.attempt || '1'}).`,
  'audit.connectorSuccess': (p) =>
    `Successfully retrieved and verified normalized record from ${p.department || 'department'}.`,
  'audit.connectorFailed': (p) =>
    `Query to ${p.department || 'department'} encountered an issue: ${p.error || 'Connection failed'}.`,
  'audit.workflowStateChange': (p) =>
    `Application workflow transitioned from ${p.fromState || 'initial'} to ${p.toState || 'next'} state.`,
  'audit.eligibilityResult': (p) =>
    p.eligible === 'true'
      ? `Eligibility evaluation passed: Citizen qualifies for the ${p.serviceType || 'service'} scheme.`
      : `Eligibility evaluation completed: Citizen did not meet criteria (${p.reason || 'Criteria not met'}).`,
  'audit.dataAccessed': (p) =>
    `System processed ${p.category || 'data category'} in compliance with minimization constraints.`,
  'audit.genericEvent': (p) =>
    `System recorded event: ${p.eventType || 'Security checkpoint'}.`,
};
