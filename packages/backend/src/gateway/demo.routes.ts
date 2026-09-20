import { FastifyInstance } from 'fastify';
import { prisma } from '../config/db';
import { auditService } from '../audit/audit.service';

/**
 * Demo-only login — accepts a OneGov ID (OG-2026-XXXXXXXX) and returns a JWT
 * without requiring a password. Only valid for the pre-seeded demo personas.
 * Never expose this in production; it is guarded by the OG-2026- prefix check.
 */
export async function demoRoutes(app: FastifyInstance) {
  app.post<{ Body: { onegovId: string } }>('/demo-login', async (req, reply) => {
    // Task 32: Disable passwordless demo login in production to prevent credential bypass.
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'NOT_FOUND' });
    }

    const { onegovId } = req.body ?? {};

    if (!onegovId || !onegovId.startsWith('OG-2026-')) {
      return reply.status(400).send({ error: 'INVALID_ONEGOV_ID' });
    }

    const citizen = await prisma.citizen.findUnique({
      where: { onegovId },
      include: { identityMap: true },
    });

    if (!citizen) {
      return reply.status(404).send({ error: 'PERSONA_NOT_FOUND' });
    }

    const token = app.jwt.sign(
      { citizenId: citizen.id, onegovId: citizen.onegovId, name: citizen.name, role: citizen.role },
      { expiresIn: '24h' }
    );

    await auditService
      .log({
        citizenId: citizen.id,
        eventType: 'CITIZEN_LOGIN',
        actor: citizen.id,
        payload: { onegovId: citizen.onegovId, method: 'DEMO_ONE_CLICK' },
      })
      .catch(() => {});

    return {
      citizenId: citizen.id,
      onegovId: citizen.onegovId,
      name: citizen.name,
      role: citizen.role,
      state: citizen.state,
      district: citizen.district,
      pincode: citizen.pincode,
      primaryAddress: citizen.primaryAddress,
      identityMap: citizen.identityMap,
      token,
    };
  });
}
