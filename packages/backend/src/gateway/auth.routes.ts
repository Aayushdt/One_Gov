import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { auditService } from '../audit/audit.service';

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { email: string; password: string } }>('/login', async (req, reply) => {
    const { email, password } = req.body;
    const citizen = await prisma.citizen.findUnique({ where: { email } });
    if (!citizen) return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });

    const valid = await bcrypt.compare(password, citizen.passwordHash);
    if (!valid) return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });

    const token = app.jwt.sign({ citizenId: citizen.id, name: citizen.name }, { expiresIn: '24h' });

    await auditService.log({ citizenId: citizen.id, eventType: 'CITIZEN_LOGIN', actor: citizen.id, payload: { email: citizen.email } }).catch(() => {});

    return { citizenId: citizen.id, name: citizen.name, token };
  });
}
