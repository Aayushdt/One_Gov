const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

// Import or generate the 50 deterministic citizen profiles
let DETERMINISTIC_50_CITIZENS;
try {
  const { generate50Citizens } = require('../../../scripts/deterministic_50_citizens');
  DETERMINISTIC_50_CITIZENS = generate50Citizens();
} catch (e) {
  // Fallback inline generator if path is isolated
  const { generate50Citizens } = require('./citizens');
  DETERMINISTIC_50_CITIZENS = generate50Citizens();
}

const CITIZENS_BY_ID = {};
const POLICE_BY_ID = {};
const MUNICIPAL_BY_ID = {};

DETERMINISTIC_50_CITIZENS.forEach((c) => {
  CITIZENS_BY_ID[c.identityRecord.externalId] = c.identityRecord;
  // Also index by legacy keys for backwards compatibility
  if (c.num === 1) CITIZENS_BY_ID['IND-IDENT-00001'] = c.identityRecord;
  if (c.num === 2) CITIZENS_BY_ID['IND-IDENT-00002'] = c.identityRecord;
  if (c.num === 3) CITIZENS_BY_ID['IND-IDENT-00003'] = c.identityRecord;
  if (c.num === 4) CITIZENS_BY_ID['IND-IDENT-00004'] = c.identityRecord;

  POLICE_BY_ID[c.policeRecord.externalId] = c.policeRecord;
  MUNICIPAL_BY_ID[c.municipalRecord.externalId] = c.municipalRecord;
});

// Identity (UIDAI / Demographics)
app.get('/citizens/:externalId', (req, res) => {
  const citizen = CITIZENS_BY_ID[req.params.externalId];
  if (!citizen) return res.status(404).json({ error: 'NOT_FOUND', department: 'IDENTITY' });
  res.json(citizen);
});

// Police (CCTNS / Clearance)
app.get('/police/:externalId', (req, res) => {
  const police = POLICE_BY_ID[req.params.externalId];
  if (!police) return res.status(404).json({ error: 'NOT_FOUND', department: 'POLICE' });
  res.json(police);
});

// Municipal (Property & Domicile)
app.get('/municipal/:externalId', (req, res) => {
  const municipal = MUNICIPAL_BY_ID[req.params.externalId];
  if (!municipal) return res.status(404).json({ error: 'NOT_FOUND', department: 'MUNICIPAL' });
  res.json(municipal);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mock-identity', records: Object.keys(CITIZENS_BY_ID).length }));

app.listen(PORT, () => console.log(`mock-identity running on :${PORT} with ${Object.keys(CITIZENS_BY_ID).length} records`));
