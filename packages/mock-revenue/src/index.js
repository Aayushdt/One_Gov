const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4003;

// Deterministic failure injection: parse REVENUE_FAIL_COUNTS env var
// Format: JSON object mapping externalId -> number of times to fail before succeeding
// e.g. '{"PAN-LIKE-00003":1}' means Sneha's first call fails, second succeeds
let failCounts = {};
try {
  failCounts = JSON.parse(process.env.REVENUE_FAIL_COUNTS || '{}');
} catch (e) {
  console.warn('Could not parse REVENUE_FAIL_COUNTS, defaulting to no failures');
}

// In-memory hit counter per externalId
const hitCounters = {};

const TAXPAYERS = {
  'PAN-LIKE-00001': { externalId: 'PAN-LIKE-00001', incomeRange: '0-3LPA', incomeBand: 'LOW', taxYear: '2024-25', source: 'REVENUE_DEPARTMENT_V3' },
  'PAN-LIKE-00002': { externalId: 'PAN-LIKE-00002', incomeRange: '12LPA+', incomeBand: 'HIGH', taxYear: '2024-25', source: 'REVENUE_DEPARTMENT_V3' },
  'PAN-LIKE-00003': { externalId: 'PAN-LIKE-00003', incomeRange: '2-3LPA', incomeBand: 'LOW', taxYear: '2024-25', source: 'REVENUE_DEPARTMENT_V3' },
};

app.get('/taxpayers/:externalId', (req, res) => {
  const { externalId } = req.params;
  hitCounters[externalId] = hitCounters[externalId] ?? 0;
  const requiredFailCount = failCounts[externalId] ?? 0;

  if (hitCounters[externalId] < requiredFailCount) {
    hitCounters[externalId]++;
    console.log(`[mock-revenue] Injecting 503 for ${externalId} (hit ${hitCounters[externalId]}/${requiredFailCount})`);
    return res.status(503).json({ error: 'UPSTREAM_UNAVAILABLE', retryAfter: 5 });
  }

  const record = TAXPAYERS[externalId];
  if (!record) return res.status(404).json({ error: 'NOT_FOUND' });
  console.log(`[mock-revenue] Returning SUCCESS for ${externalId}`);
  res.json(record);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`mock-revenue running on :${PORT} (failCounts: ${JSON.stringify(failCounts)})`));
