const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4003;

let failCounts = {};
try {
  failCounts = JSON.parse(process.env.REVENUE_FAIL_COUNTS || '{}');
} catch (e) {
  console.warn('Could not parse REVENUE_FAIL_COUNTS, defaulting to no failures');
}

const hitCounters = {};

const TAXPAYERS = {
  'PAN-LIKE-00001': {
    externalId: 'PAN-LIKE-00001',
    incomeRange: '₹2,40,000 (0-3LPA Band)',
    incomeBand: 'LOW',
    taxYear: 'AY 2024-25',
    panMasked: 'ABCPS****F',
    filingStatus: 'VERIFIED_ITR_FILED',
    source: 'REVENUE_DEPARTMENT_V3',
  },
  'PAN-LIKE-00002': {
    externalId: 'PAN-LIKE-00002',
    incomeRange: '₹14,50,000 (12LPA+ Band)',
    incomeBand: 'HIGH',
    taxYear: 'AY 2024-25',
    panMasked: 'XYZPV****H',
    filingStatus: 'VERIFIED_ITR_FILED',
    source: 'REVENUE_DEPARTMENT_V3',
  },
  'PAN-LIKE-00003': {
    externalId: 'PAN-LIKE-00003',
    incomeRange: '₹2,80,000 (2-3LPA Band)',
    incomeBand: 'LOW',
    taxYear: 'AY 2024-25',
    panMasked: 'DEFPP****K',
    filingStatus: 'VERIFIED_ITR_FILED',
    source: 'REVENUE_DEPARTMENT_V3',
  },
  'PAN-LIKE-00004': {
    externalId: 'PAN-LIKE-00004',
    incomeRange: '₹1,90,000 (0-3LPA Band)',
    incomeBand: 'LOW',
    taxYear: 'AY 2024-25',
    panMasked: 'GHJPR****M',
    filingStatus: 'VERIFIED_ITR_FILED',
    source: 'REVENUE_DEPARTMENT_V3',
  },
};

app.get('/taxpayers/:externalId', (req, res) => {
  const { externalId } = req.params;
  hitCounters[externalId] = hitCounters[externalId] ?? 0;
  const requiredFailCount = failCounts[externalId] ?? 0;

  if (hitCounters[externalId] < requiredFailCount) {
    hitCounters[externalId]++;
    console.log(`[mock-revenue] Injecting 503 for ${externalId} (hit ${hitCounters[externalId]}/${requiredFailCount})`);
    return res.status(503).json({ error: 'UPSTREAM_UNAVAILABLE', retryAfter: 2 });
  }

  const record = TAXPAYERS[externalId];
  if (!record) return res.status(404).json({ error: 'NOT_FOUND' });
  console.log(`[mock-revenue] Returning SUCCESS for ${externalId}`);
  res.json(record);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`mock-revenue running on :${PORT} (failCounts: ${JSON.stringify(failCounts)})`));
