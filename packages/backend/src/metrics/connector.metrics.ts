import { prisma } from '../config/db';

export type MetricEventType = 'SUCCESS' | 'FAILURE' | 'RETRY' | 'CIRCUIT_OPEN';

export class ConnectorMetricsService {
  /**
   * Records a connector metric event in the database.
   */
  async recordEvent(
    connectorSlug: string,
    eventType: MetricEventType,
    durationMs?: number,
    statusCode?: number
  ): Promise<void> {
    try {
      await prisma.connectorMetric.create({
        data: {
          connectorSlug,
          eventType,
          durationMs: durationMs !== undefined ? Math.round(durationMs) : null,
          statusCode: statusCode ?? null,
        },
      });
    } catch (err) {
      console.error(`[Metrics] Failed to record ${eventType} for ${connectorSlug}:`, (err as any).message);
    }
  }

  /**
   * Aggregates connector metrics over the last N hours (default 24h).
   */
  async getAggregatedStats(hours = 24) {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const metrics = await prisma.connectorMetric.findMany({
      where: { recordedAt: { gte: since } },
    });

    const statsBySlug: Record<
      string,
      {
        totalCalls: number;
        successes: number;
        failures: number;
        retries: number;
        circuitOpens: number;
        avgDurationMs: number;
        totalDurationMs: number;
        durationCount: number;
      }
    > = {};

    for (const m of metrics) {
      if (!statsBySlug[m.connectorSlug]) {
        statsBySlug[m.connectorSlug] = {
          totalCalls: 0,
          successes: 0,
          failures: 0,
          retries: 0,
          circuitOpens: 0,
          avgDurationMs: 0,
          totalDurationMs: 0,
          durationCount: 0,
        };
      }
      const entry = statsBySlug[m.connectorSlug];
      if (m.eventType === 'SUCCESS') entry.successes++;
      if (m.eventType === 'FAILURE') entry.failures++;
      if (m.eventType === 'RETRY') entry.retries++;
      if (m.eventType === 'CIRCUIT_OPEN') entry.circuitOpens++;

      if (m.eventType === 'SUCCESS' || m.eventType === 'FAILURE') {
        entry.totalCalls++;
      }

      if (m.durationMs !== null && m.durationMs !== undefined) {
        entry.totalDurationMs += m.durationMs;
        entry.durationCount++;
      }
    }

    const result = Object.entries(statsBySlug).map(([slug, s]) => ({
      connectorSlug: slug,
      totalCalls: s.totalCalls,
      successes: s.successes,
      failures: s.failures,
      retries: s.retries,
      circuitOpens: s.circuitOpens,
      successRate: s.totalCalls > 0 ? Math.round((s.successes / s.totalCalls) * 100) : 100,
      avgDurationMs: s.durationCount > 0 ? Math.round(s.totalDurationMs / s.durationCount) : 0,
    }));

    return result;
  }
}

export const connectorMetrics = new ConnectorMetricsService();
