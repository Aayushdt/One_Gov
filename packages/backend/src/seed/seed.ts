import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generate50Citizens } from './citizens';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OneGov (GovLink) Interoperability Database...');

  // Reset existing tables to ensure a clean 50-citizen deterministic dataset
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "Appeal", "GrievanceFlag", "EligibilityCertificate", "DataExportRequest", "Notification", "WorkflowStateHistory", "ConsentArtefact", "WorkflowRun", "AuditEntry", "IdentityMap", "Citizen" CASCADE;
    `);
    console.log('  ✓ Cleaned existing tables for fresh deterministic seed');
  } catch (err) {
    console.log('  ℹ Truncate skipped or tables not yet created:', (err as any).message);
  }

  const citizens = generate50Citizens();
  const passwordHash = await bcrypt.hash('demo123', 10);
  const adminEmail = (process.env.ADMIN_EMAIL || 'rahul@govlink.demo').toLowerCase();

  for (const c of citizens) {
    const isAdmin = c.email.toLowerCase() === adminEmail;

    // 1. Create Citizen with Universal OneGov ID & Demographics
    const citizenRecord = await prisma.citizen.create({
      data: {
        id: c.id,
        onegovId: c.onegovId,
        email: c.email,
        name: c.name,
        passwordHash,
        role: isAdmin ? 'ADMIN' : 'CITIZEN',
        phone: c.phone,
        dateOfBirth: c.dateOfBirth,
        gender: c.gender,
        state: c.state,
        district: c.district,
        pincode: c.pincode,
        primaryAddress: c.primaryAddress,
      },
    });

    // 2. Create Federated Identity Map across 8 Silos
    await prisma.identityMap.create({
      data: {
        citizenId: citizenRecord.id,
        identityDeptId: c.departmentMap.identityDeptId,
        revenueDeptId: c.departmentMap.revenueDeptId,
        educationDeptId: c.departmentMap.educationDeptId,
        transportDeptId: c.departmentMap.transportDeptId,
        policeDeptId: c.departmentMap.policeDeptId,
        bankingDeptId: c.departmentMap.bankingDeptId,
        welfareDeptId: c.departmentMap.welfareDeptId,
        municipalDeptId: c.departmentMap.municipalDeptId,
      },
    });

    if (c.num <= 7 || c.num % 10 === 0) {
      console.log(`  ✓ [${c.onegovId}] ${c.name} (${c.email}) -> ${c.personaTag}`);
    }
  }

  // 3. Seed Connector Registry & Service Definitions
  const { seedRegistry } = await import('./registry.seed');
  await seedRegistry(prisma);

  console.log(`\nSuccessfully seeded all 50 deterministic citizens with Universal IDs & 8-department federated maps!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
