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

let DETERMINISTIC_50_CITIZENS;
try {
  const { generate50Citizens } = require('../../../scripts/deterministic_50_citizens');
  DETERMINISTIC_50_CITIZENS = generate50Citizens();
} catch (e) {
  const { generate50Citizens } = require('./citizens');
  DETERMINISTIC_50_CITIZENS = generate50Citizens();
}

const TAXPAYERS_BY_ID = {};
const TRANSPORT_BY_ID = {};
const BANKING_BY_ID = {};

DETERMINISTIC_50_CITIZENS.forEach((c) => {
  TAXPAYERS_BY_ID[c.revenueRecord.externalId] = c.revenueRecord;
  // Legacy backward-compatibility indexes
  if (c.num === 1) TAXPAYERS_BY_ID['PAN-LIKE-00001'] = c.revenueRecord;
  if (c.num === 2) TAXPAYERS_BY_ID['PAN-LIKE-00002'] = c.revenueRecord;
  if (c.num === 3) TAXPAYERS_BY_ID['PAN-LIKE-00003'] = c.revenueRecord;
  if (c.num === 4) TAXPAYERS_BY_ID['PAN-LIKE-00004'] = c.revenueRecord;

  TRANSPORT_BY_ID[c.transportRecord.externalId] = c.transportRecord;
  BANKING_BY_ID[c.bankingRecord.externalId] = c.bankingRecord;
});

// Revenue / Income Tax (CBDT / PAN)
app.get('/taxpayers/:externalId', (req, res) => {
  const { externalId } = req.params;
  hitCounters[externalId] = hitCounters[externalId] ?? 0;
  const requiredFailCount = failCounts[externalId] ?? 0;

  if (hitCounters[externalId] < requiredFailCount) {
    hitCounters[externalId]++;
    console.log(`[mock-revenue] Injecting 503 for ${externalId} (hit ${hitCounters[externalId]}/${requiredFailCount})`);
    return res.status(503).json({ error: 'UPSTREAM_UNAVAILABLE', retryAfter: 2 });
  }

  const record = TAXPAYERS_BY_ID[externalId];
  if (!record) return res.status(404).json({ error: 'NOT_FOUND', department: 'REVENUE' });
  console.log(`[mock-revenue] Returning SUCCESS for ${externalId}`);
  res.json(record);
});

// Transport / RTO (Parivahan / Driving Licence)
app.get('/transport/:externalId', (req, res) => {
  const transport = TRANSPORT_BY_ID[req.params.externalId];
  if (!transport) return res.status(404).json({ error: 'NOT_FOUND', department: 'TRANSPORT' });
  res.json(transport);
});

// Banking & DBT (Core Banking / e-KYC)
app.get('/banking/:externalId', (req, res) => {
  const banking = BANKING_BY_ID[req.params.externalId];
  if (!banking) return res.status(404).json({ error: 'NOT_FOUND', department: 'BANKING' });
  res.json(banking);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mock-revenue', records: Object.keys(TAXPAYERS_BY_ID).length }));

app.listen(PORT, () => console.log(`mock-revenue running on :${PORT} with ${Object.keys(TAXPAYERS_BY_ID).length} records (failCounts: ${JSON.stringify(failCounts)})`));
