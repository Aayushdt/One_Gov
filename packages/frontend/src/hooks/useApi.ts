/// <reference types="vite/client" />
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('govlink_token');
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    req<{
      citizenId: string;
      onegovId: string;
      name: string;
      state?: string;
      district?: string;
      pincode?: string;
      primaryAddress?: string;
      identityMap?: Record<string, string>;
      token: string;
    }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data: { name: string; email: string; password: string; state?: string; district?: string }) =>
    req<{
      citizenId: string;
      onegovId: string;
      name: string;
      state?: string;
      district?: string;
      pincode?: string;
      primaryAddress?: string;
      identityMap?: Record<string, string>;
      token: string;
    }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  demoLogin: (onegovId: string) =>
    req<{
      citizenId: string;
      onegovId: string;
      name: string;
      state?: string;
      district?: string;
      pincode?: string;
      primaryAddress?: string;
      identityMap?: Record<string, string>;
      token: string;
    }>('/api/auth/demo-login', { method: 'POST', body: JSON.stringify({ onegovId }) }),

  getMe: () =>
    req<any>('/api/auth/me'),

  getCitizens: () =>
    req<{ citizens: Array<{ id: string; onegovId: string; name: string; state?: string; district?: string }> }>('/api/auth/citizens'),

  startWorkflow: (serviceType: string = 'SCHOLARSHIP') =>
    req<{ runId: string; serviceType: string }>('/api/workflow/start', {
      method: 'POST',
      body: JSON.stringify({ serviceType }),
    }),

  getWorkflow: (runId: string) =>
    req<any>(`/api/workflow/${runId}`),

  grantConsent: (runId: string, categories: string[], purpose?: string, requestedBy?: string, maxUses?: number, guardianId?: string) =>
    req<any>('/api/consent/grant', {
      method: 'POST',
      body: JSON.stringify({ runId, categories, purpose, requestedBy, maxUses, guardianId }),
    }),

  renewConsent: (runId: string, extensionHours = 24) =>
    req<{ success: boolean; count: number; expiresAt: string }>(`/api/consent/run/${runId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ extensionHours }),
    }),

  getAllConsents: () =>
    req<{ artefacts: any[] }>('/api/consent/citizen'),

  getConsent: (runId: string) =>
    req<{ artefacts: any[] }>(`/api/consent/run/${runId}`),

  revokeConsent: (runId: string, category?: string) =>
    req<any>(`/api/consent/run/${runId}/revoke`, { method: 'PATCH', body: JSON.stringify({ category }) }),

  getAuditTrail: (citizenId: string) =>
    req<{ entries: any[] }>(`/api/audit/${citizenId}`),

  verifyAuditChain: (citizenId: string) =>
    req<{ valid: boolean; brokenAt?: number; totalEntries: number }>(`/api/audit/${citizenId}/verify`),

  tamperAuditChain: (citizenId: string) =>
    req<{ tamperedSeq: number }>(`/api/audit/${citizenId}/tamper`, { method: 'POST' }),

  restoreAuditChain: (citizenId: string) =>
    req<{ restored: boolean }>(`/api/audit/${citizenId}/restore`, { method: 'POST' }),

  getNotifications: (unreadOnly?: boolean) =>
    req<{ notifications: any[]; unreadCount: number }>(`/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),

  markNotificationRead: (id: string) =>
    req<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    req<{ success: boolean }>('/api/notifications/read-all', { method: 'PATCH' }),

  getMyWorkflows: () =>
    req<{ runs: any[] }>('/api/workflow/citizen'),

  getAuditNarrative: (citizenId: string) =>
    req<{ narratives: any[]; total: number }>(`/api/audit/${citizenId}/narrative`),

  getCertificate: (runId: string) =>
    req<{ certificate: any; token: string }>(`/api/certificate/${runId}`),

  verifyCertificateToken: (token: string) =>
    req<{ valid: boolean; reason?: string; payload?: any; algorithm?: string }>(
      `/api/verify/certificate?token=${encodeURIComponent(token)}`
    ),

  requestDataExport: () =>
    req<any>('/api/export/request', { method: 'POST' }),

  getMyDataExports: () =>
    req<{ exports: any[] }>('/api/export/my'),

  submitAppeal: (data: { runId: string; disputedCategory: string; reason: string; evidenceUrl?: string }) =>
    req<any>('/api/appeals', { method: 'POST', body: JSON.stringify(data) }),

  getAppeal: (id: string) =>
    req<any>(`/api/appeals/${id}`),

  getAppeals: (status?: string) =>
    req<{ appeals: any[] }>(`/api/appeals${status ? `?status=${status}` : ''}`),

  updateAppealStatus: (id: string, status: string, adminNote?: string) =>
    req<any>(`/api/appeals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminNote }) }),

  rerunAppeal: (id: string) =>
    req<any>(`/api/appeals/${id}/rerun`, { method: 'POST' }),

  getRegisteredConnectors: () =>
    req<{ count: number; connectors: any[] }>('/api/registry/connectors'),

  registerConnector: (data: any) =>
    req<any>('/api/registry/connectors', { method: 'POST', body: JSON.stringify(data) }),

  flagAuditEntry: (auditEntryId: string, reason: string) =>
    req<any>('/api/grievances', { method: 'POST', body: JSON.stringify({ auditEntryId, reason }) }),

  getGrievances: (status?: string) =>
    req<{ grievances: any[] }>(`/api/grievances${status ? `?status=${status}` : ''}`),

  resolveGrievance: (id: string, status: string, adminNote?: string) =>
    req<any>(`/api/grievances/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNote }) }),

  runRetention: (retentionGraceDays = 0) =>
    req<any>('/api/ops/retention/run', { method: 'POST', body: JSON.stringify({ retentionGraceDays }) }),

  getOpsMetrics: () =>
    req<{ ok: boolean; connectors: any[] }>('/api/ops/metrics', {
      headers: { 'x-admin-role': 'ADMIN' },
    }),

  resetCircuitBreaker: (connectorSlug: string) =>
    req<{ ok: boolean; message: string }>(`/api/ops/circuits/${connectorSlug}/reset`, {
      method: 'POST',
      headers: { 'x-admin-role': 'ADMIN' },
    }),

  downloadExport: async (exportId: string): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(`${BASE}/api/export/${exportId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`);
    }
    return res.blob();
  },

  verifyPublicCertificate: (token: string) =>
    req<any>(`/api/certificate/public/verify?token=${encodeURIComponent(token)}`),

  getServices: () =>
    req<{ count: number; services: any[] }>('/api/registry/services'),
};
