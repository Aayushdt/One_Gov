const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;

const STUDENTS = {
  'UNIV-STU-00001': { studentId: 'UNIV-STU-00001', institutionName: 'National Institute of Technology, Trichy', enrollmentStatus: 'ACTIVE', courseLevel: 'UNDERGRADUATE', academicYear: '2024-25', source: 'EDUCATION_DEPARTMENT_V1' },
  'UNIV-STU-00002': { studentId: 'UNIV-STU-00002', institutionName: 'IIT Delhi', enrollmentStatus: 'ACTIVE', courseLevel: 'UNDERGRADUATE', academicYear: '2024-25', source: 'EDUCATION_DEPARTMENT_V1' },
  'UNIV-STU-00003': { studentId: 'UNIV-STU-00003', institutionName: 'Delhi University', enrollmentStatus: 'ACTIVE', courseLevel: 'POSTGRADUATE', academicYear: '2024-25', source: 'EDUCATION_DEPARTMENT_V1' },
};

app.get('/students/:externalId', (req, res) => {
  const student = STUDENTS[req.params.externalId];
  if (!student) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(student);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`mock-education running on :${PORT}`));
