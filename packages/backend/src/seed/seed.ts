import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GovLink database...');

  // Seed citizens
  const citizens = [
    { id: 'citizen-alpha', email: 'priya@govlink.demo', name: 'Priya Sharma', password: 'demo123', identityDeptId: 'IND-IDENT-00001', educationDeptId: 'UNIV-STU-00001', revenueDeptId: 'PAN-LIKE-00001' },
    { id: 'citizen-beta', email: 'rahul@govlink.demo', name: 'Rahul Verma', password: 'demo123', identityDeptId: 'IND-IDENT-00002', educationDeptId: 'UNIV-STU-00002', revenueDeptId: 'PAN-LIKE-00002' },
    { id: 'citizen-gamma', email: 'sneha@govlink.demo', name: 'Sneha Patel', password: 'demo123', identityDeptId: 'IND-IDENT-00003', educationDeptId: 'UNIV-STU-00003', revenueDeptId: 'PAN-LIKE-00003' },
    { id: 'citizen-delta', email: 'vikram@govlink.demo', name: 'Vikramaditya Roy', password: 'demo123', identityDeptId: 'IND-IDENT-00004', educationDeptId: 'UNIV-STU-00004', revenueDeptId: 'PAN-LIKE-00004' },
  ];

  for (const c of citizens) {
    const passwordHash = await bcrypt.hash(c.password, 10);
    await prisma.citizen.upsert({
      where: { id: c.id },
      create: { id: c.id, email: c.email, name: c.name, passwordHash },
      update: { email: c.email, name: c.name, passwordHash },
    });

    await prisma.identityMap.upsert({
      where: { citizenId: c.id },
      create: { citizenId: c.id, identityDeptId: c.identityDeptId, educationDeptId: c.educationDeptId, revenueDeptId: c.revenueDeptId },
      update: { identityDeptId: c.identityDeptId, educationDeptId: c.educationDeptId, revenueDeptId: c.revenueDeptId },
    });

    console.log(`  ✓ Seeded citizen: ${c.name} (${c.email})`);
  }

  console.log('Seeding complete.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
