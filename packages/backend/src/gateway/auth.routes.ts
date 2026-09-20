import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { auditService } from '../audit/audit.service';

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post<{ Body: { email: string; password: string } }>('/login', async (req, reply) => {
    const { email, password } = req.body;
    const citizen = await prisma.citizen.findUnique({
      where: { email },
      include: { identityMap: true },
    });
    if (!citizen) return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });

    const valid = await bcrypt.compare(password, citizen.passwordHash);
    if (!valid) return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });

    const guardianRelationships = await prisma.guardianRelationship.findMany({
      where: { guardianId: citizen.id },
      select: { dependentId: true },
    });
    const guardianFor = guardianRelationships.map((r) => r.dependentId);

    const token = app.jwt.sign(
      { citizenId: citizen.id, onegovId: citizen.onegovId, name: citizen.name, role: citizen.role, guardian_for: guardianFor },
      { expiresIn: '24h' }
    );

    await auditService.log({
      citizenId: citizen.id,
      eventType: 'CITIZEN_LOGIN',
      actor: citizen.id,
      payload: { email: citizen.email, onegovId: citizen.onegovId }
    }).catch(() => {});

    return {
      citizenId: citizen.id,
      onegovId: citizen.onegovId,
      name: citizen.name,
      email: citizen.email,
      role: citizen.role,
      state: citizen.state,
      district: citizen.district,
      pincode: citizen.pincode,
      primaryAddress: citizen.primaryAddress,
      identityMap: citizen.identityMap,
      token,
    };
  });

  // Register New Citizen Account
  app.post<{ Body: { name: string; email: string; password: string; state?: string; district?: string } }>('/register', async (req, reply) => {
    const { name, email, password, state, district } = req.body ?? {};
    if (!name?.trim() || !email?.trim() || !password) {
      return reply.status(400).send({ error: 'MISSING_FIELDS', message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.citizen.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return reply.status(409).send({ error: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists.' });
    }

    const count = await prisma.citizen.count();
    const regNum = 90000000 + count + 1;
    const onegovId = `OG-2026-${String(regNum).padStart(8, '0')}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const citizen = await prisma.citizen.create({
      data: {
        onegovId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        state: state?.trim() || 'National Capital Region',
        district: district?.trim() || 'Central',
        pincode: '110001',
      },
      include: { identityMap: true },
    });

    const token = app.jwt.sign(
      { citizenId: citizen.id, onegovId: citizen.onegovId, name: citizen.name, role: citizen.role },
      { expiresIn: '24h' }
    );

    await auditService.log({
      citizenId: citizen.id,
      eventType: 'CITIZEN_LOGIN',
      actor: citizen.id,
      payload: { email: citizen.email, onegovId: citizen.onegovId, event: 'SELF_REGISTRATION' },
    }).catch(() => {});

    return {
      citizenId: citizen.id,
      onegovId: citizen.onegovId,
      name: citizen.name,
      email: citizen.email,
      role: citizen.role,
      state: citizen.state,
      district: citizen.district,
      pincode: citizen.pincode,
      primaryAddress: citizen.primaryAddress,
      identityMap: citizen.identityMap, // null for unlinked accounts
      token,
    };
  });

  // Get Current Citizen Profile
  app.get('/me', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const me = req.user as any;
    const citizen = await prisma.citizen.findUnique({
      where: { id: me.citizenId },
      include: { identityMap: true },
    });
    if (!citizen) return reply.status(404).send({ error: 'NOT_FOUND' });
    // Mask federated registry references dynamically so raw IDs never traverse the network
    const maskedIdentityMap = citizen.identityMap ? {
      identityDeptId: citizen.identityMap.identityDeptId ? `SIM-AADHAAR-XXXX-${citizen.identityMap.identityDeptId.slice(-4)}` : null,
      revenueDeptId: citizen.identityMap.revenueDeptId ? `SIM-PAN-XXXX-${citizen.identityMap.revenueDeptId.slice(-4)}` : null,
      educationDeptId: citizen.identityMap.educationDeptId ? `SIM-EDU-XXXX-${citizen.identityMap.educationDeptId.slice(-4)}` : null,
      transportDeptId: citizen.identityMap.transportDeptId ? `SIM-DL-XXXX-${citizen.identityMap.transportDeptId.slice(-4)}` : null,
    } : null;

    return {
      id: citizen.id,
      onegovId: citizen.onegovId,
      name: citizen.name,
      email: citizen.email,
      role: citizen.role,
      phone: citizen.phone,
      dateOfBirth: citizen.dateOfBirth,
      gender: citizen.gender,
      state: citizen.state,
      district: citizen.district,
      pincode: citizen.pincode,
      primaryAddress: citizen.primaryAddress,
      identityMap: maskedIdentityMap,
    };
  });

  // Task 31: Directory of deterministic citizens for demo persona selectors.
  // Returns only display-safe fields — identityMap (simulated Aadhaar/PAN/NAD IDs) is intentionally excluded.
  // Email and passwordHash are never exposed. Demo UI only needs onegovId for one-click login.
  app.get('/citizens', async () => {
    const citizens = await prisma.citizen.findMany({
      select: {
        id: true,
        onegovId: true,
        name: true,
        state: true,
        district: true,
      },
      orderBy: { onegovId: 'asc' },
    });
    return { citizens };
  });
}
