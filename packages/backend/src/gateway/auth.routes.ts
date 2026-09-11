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

    const token = app.jwt.sign(
      { citizenId: citizen.id, onegovId: citizen.onegovId, name: citizen.name },
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
      state: citizen.state,
      district: citizen.district,
      pincode: citizen.pincode,
      primaryAddress: citizen.primaryAddress,
      identityMap: citizen.identityMap,
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
    return {
      id: citizen.id,
      onegovId: citizen.onegovId,
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone,
      dateOfBirth: citizen.dateOfBirth,
      gender: citizen.gender,
      state: citizen.state,
      district: citizen.district,
      pincode: citizen.pincode,
      primaryAddress: citizen.primaryAddress,
      identityMap: citizen.identityMap,
    };
  });

  // Directory of all deterministic citizens (useful for demo persona selectors)
  app.get('/citizens', async () => {
    const citizens = await prisma.citizen.findMany({
      select: {
        id: true,
        onegovId: true,
        name: true,
        email: true,
        state: true,
        district: true,
        identityMap: true,
      },
      orderBy: { onegovId: 'asc' },
    });
    return { citizens };
  });
}
