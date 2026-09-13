import { FastifyInstance } from 'fastify';

const MOCK_SERVICES = [
  { key: 'mock-identity', label: 'Identity (UIDAI)', url: process.env.IDENTITY_API_URL ?? 'http://mock-identity:4001' },
  { key: 'mock-education', label: 'Education (NAD)', url: process.env.EDUCATION_API_URL ?? 'http://mock-education:4002' },
  { key: 'mock-revenue', label: 'Revenue (CBDT)', url: process.env.REVENUE_API_URL ?? 'http://mock-revenue:4003' },
];

async function probe(url: string): Promise<{ ok: boolean; latencyMs: number; detail?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: true, latencyMs, detail: (body as any).status ?? 'ok' };
    }
    return { ok: false, latencyMs, detail: `HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, detail: err?.message ?? 'unreachable' };
  }
}

export async function healthRoutes(app: FastifyInstance) {
  // Aggregate health of all connected services
  app.get('/services', async () => {
    const results = await Promise.allSettled(
      MOCK_SERVICES.map(async (svc) => {
        const probe_result = await probe(svc.url);
        return { key: svc.key, label: svc.label, ...probe_result };
      })
    );

    const services = results.map((r) => {
      if (r.status === 'fulfilled') return r.value;
      return { key: 'unknown', label: 'Unknown', ok: false, latencyMs: 0, detail: 'promise rejected' };
    });

    const allOk = services.every((s) => s.ok);

    return {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      backend: { ok: true, label: 'Backend (Fastify)' },
      services,
    };
  });
}
