const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

const CITIZENS = {
  'IND-IDENT-00001': { externalId: 'IND-IDENT-00001', fullName: 'Priya Sharma', dateOfBirth: '2002-04-15', verified: true, verifiedAt: '2024-01-10T00:00:00Z', source: 'IDENTITY_DEPARTMENT_V2' },
  'IND-IDENT-00002': { externalId: 'IND-IDENT-00002', fullName: 'Rahul Verma', dateOfBirth: '2001-08-22', verified: true, verifiedAt: '2024-01-10T00:00:00Z', source: 'IDENTITY_DEPARTMENT_V2' },
  'IND-IDENT-00003': { externalId: 'IND-IDENT-00003', fullName: 'Sneha Patel', dateOfBirth: '2003-01-30', verified: true, verifiedAt: '2024-01-10T00:00:00Z', source: 'IDENTITY_DEPARTMENT_V2' },
};

app.get('/citizens/:externalId', (req, res) => {
  const citizen = CITIZENS[req.params.externalId];
  if (!citizen) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(citizen);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`mock-identity running on :${PORT}`));
