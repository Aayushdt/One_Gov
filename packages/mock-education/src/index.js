const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;

const STUDENTS = {
  'UNIV-STU-00001': {
    studentId: 'UNIV-STU-00001',
    institutionName: 'National Institute of Technology, Trichy',
    enrollmentStatus: 'ACTIVE',
    courseLevel: 'UNDERGRADUATE',
    program: 'B.Tech in Computer Science & Engineering',
    academicYear: '2024-25 (Year 3)',
    cgpa: '8.92 / 10.0',
    source: 'EDUCATION_DEPARTMENT_V1',
  },
  'UNIV-STU-00002': {
    studentId: 'UNIV-STU-00002',
    institutionName: 'IIT Delhi',
    enrollmentStatus: 'ACTIVE',
    courseLevel: 'POSTGRADUATE',
    program: 'M.Tech in Mechanical Systems Design',
    academicYear: '2024-25 (Year 1)',
    cgpa: '7.85 / 10.0',
    source: 'EDUCATION_DEPARTMENT_V1',
  },
  'UNIV-STU-00003': {
    studentId: 'UNIV-STU-00003',
    institutionName: 'Delhi University',
    enrollmentStatus: 'ACTIVE',
    courseLevel: 'POSTGRADUATE',
    program: 'M.Sc in Applied Mathematics & Statistics',
    academicYear: '2024-25 (Year 2)',
    cgpa: '9.10 / 10.0',
    source: 'EDUCATION_DEPARTMENT_V1',
  },
  'UNIV-STU-00004': {
    studentId: 'UNIV-STU-00004',
    institutionName: 'Jadavpur University',
    enrollmentStatus: 'ACTIVE',
    courseLevel: 'UNDERGRADUATE',
    program: 'B.A. (Hons) in Economics & Public Policy',
    academicYear: '2024-25 (Year 2)',
    cgpa: '8.40 / 10.0',
    source: 'EDUCATION_DEPARTMENT_V1',
  },
};

app.get('/students/:externalId', (req, res) => {
  const student = STUDENTS[req.params.externalId];
  if (!student) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(student);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`mock-education running on :${PORT}`));
