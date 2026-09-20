const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;

let DETERMINISTIC_50_CITIZENS;
try {
  const { generate50Citizens } = require('../scripts/deterministic_50_citizens');
  DETERMINISTIC_50_CITIZENS = generate50Citizens();
} catch (e) {
  const { generate50Citizens } = require('./citizens');
  DETERMINISTIC_50_CITIZENS = generate50Citizens();
}

const STUDENTS_BY_ID = {};
const WELFARE_BY_ID = {};

DETERMINISTIC_50_CITIZENS.forEach((c) => {
  STUDENTS_BY_ID[c.educationRecord.studentId] = c.educationRecord;
  // Legacy backward-compatibility indexes
  if (c.num === 1) STUDENTS_BY_ID['UNIV-STU-00001'] = c.educationRecord;
  if (c.num === 2) STUDENTS_BY_ID['UNIV-STU-00002'] = c.educationRecord;
  if (c.num === 3) STUDENTS_BY_ID['UNIV-STU-00003'] = c.educationRecord;
  if (c.num === 4) STUDENTS_BY_ID['UNIV-STU-00004'] = c.educationRecord;

  WELFARE_BY_ID[c.welfareRecord.externalId] = c.welfareRecord;
});

// Education (NAD / Degree / University)
app.get('/students/:externalId', (req, res) => {
  const student = STUDENTS_BY_ID[req.params.externalId];
  if (!student) return res.status(404).json({ error: 'NOT_FOUND', department: 'EDUCATION' });
  res.json(student);
});

// Public Welfare & PDS (Subsidies / Ration)
app.get('/welfare/:externalId', (req, res) => {
  const welfare = WELFARE_BY_ID[req.params.externalId];
  if (!welfare) return res.status(404).json({ error: 'NOT_FOUND', department: 'WELFARE' });
  res.json(welfare);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mock-education', records: Object.keys(STUDENTS_BY_ID).length }));

app.listen(PORT, () => console.log(`mock-education running on :${PORT} with ${Object.keys(STUDENTS_BY_ID).length} records`));
