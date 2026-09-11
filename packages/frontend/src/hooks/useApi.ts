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
      email: string;
      state?: string;
      district?: string;
      pincode?: string;
      primaryAddress?: string;
      identityMap?: Record<string, string>;
      token: string;
    }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getMe: () =>
    req<any>('/api/auth/me'),

  getCitizens: () =>
    req<{ citizens: any[] }>('/api/auth/citizens'),

  startWorkflow: (serviceType: string = 'SCHOLARSHIP') =>
    req<{ runId: string; serviceType: string }>('/api/workflow/start', {
      method: 'POST',
      body: JSON.stringify({ serviceType }),
    }),

  getWorkflow: (runId: string) =>
    req<any>(`/api/workflow/${runId}`),

  grantConsent: (runId: string, categories: string[], purpose?: string, requestedBy?: string) =>
    req<any>('/api/consent/grant', {
      method: 'POST',
      body: JSON.stringify({ runId, categories, purpose, requestedBy }),
    }),

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
};
