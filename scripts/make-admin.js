#!/usr/bin/env node

/**
 * scripts/make-admin.js
 * One-off CLI command to promote a citizen to ADMIN role.
 *
 * Usage:
 *   node scripts/make-admin.js --email rahul@govlink.demo
 *   node scripts/make-admin.js --onegov-id OG-2026-00000001
 */

const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] || '';
        val = val.replace(/^["'](.*)["']$/, '$1').trim();
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER || 'govlink';
  const pass = process.env.POSTGRES_PASSWORD || 'govlink_secret';
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@localhost:5433/govlink?schema=public`;
}

let PrismaClient;
try {
  ({ PrismaClient } = require('@prisma/client'));
} catch {
  ({ PrismaClient } = require('../packages/backend/node_modules/@prisma/client'));
}
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  let email = null;
  let onegovId = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1].trim().toLowerCase();
      i++;
    } else if (args[i] === '--onegov-id' && args[i + 1]) {
      onegovId = args[i + 1].trim();
      i++;
    }
  }

  if (!email && !onegovId) {
    console.error('Error: Please provide --email <email> or --onegov-id <id>');
    console.error('Example: node scripts/make-admin.js --email rahul@govlink.demo');
    process.exit(1);
  }

  const where = email ? { email } : { onegovId };
  const citizen = await prisma.citizen.findFirst({ where });

  if (!citizen) {
    console.error(`Error: No citizen found matching ${JSON.stringify(where)}`);
    process.exit(1);
  }

  const updated = await prisma.citizen.update({
    where: { id: citizen.id },
    data: { role: 'ADMIN' },
  });

  console.log(`✓ Successfully promoted citizen to ADMIN role:`);
  console.log(`  Name:      ${updated.name}`);
  console.log(`  Email:     ${updated.email}`);
  console.log(`  OneGov ID: ${updated.onegovId}`);
  console.log(`  Role:      ${updated.role}`);
}

main()
  .catch((err) => {
    console.error('Fatal error promoting citizen to admin:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
