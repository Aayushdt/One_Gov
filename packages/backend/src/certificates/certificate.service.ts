import crypto from 'node:crypto';
import { prisma } from '../config/db';
import { notificationService } from '../notifications/notification.service';

const DEFAULT_PUB_KEY =
  'MCowBQYDK2VwAyEARYI0j1U/JtJ6lMBvKzSrTuY55P9+L9h7zQpHebL2skw=';
const DEFAULT_PRIV_KEY =
  'MC4CAQAwBQYDK2VwBCIEIMLyl7QrcbKQeutp78tjf/wPO8o9frL6/uJ9Lcdf45VQ=';

export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`).join(',') + '}';
}

export interface CertificatePayload {
  runId: string;
  citizenId: string;
  citizenName: string;
  onegovId: string;
  serviceType: string;
  eligibleResult: boolean;
  issuedAt: string;
  expiresAt: string;
}

export class CertificateService {
  private getPrivateKey() {
    const raw = process.env.CERT_PRIVATE_KEY_BASE64 || DEFAULT_PRIV_KEY;
    if (!process.env.CERT_PRIVATE_KEY_BASE64 && process.env.NODE_ENV !== 'test') {
      console.warn('[CertificateService] WARNING: Using hardcoded fallback Ed25519 private key. Set CERT_PRIVATE_KEY_BASE64 for production use.');
    }
    return crypto.createPrivateKey({
      key: Buffer.from(raw, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });
  }

  private getPublicKey() {
    const raw = process.env.CERT_PUBLIC_KEY_BASE64 || DEFAULT_PUB_KEY;
    if (!process.env.CERT_PUBLIC_KEY_BASE64 && process.env.NODE_ENV !== 'test') {
      console.warn('[CertificateService] WARNING: Using hardcoded fallback Ed25519 public key. Set CERT_PUBLIC_KEY_BASE64 for production use.');
    }
    return crypto.createPublicKey({
      key: Buffer.from(raw, 'base64'),
      format: 'der',
      type: 'spki',
    });
  }

  /**
   * Issues a cryptographically signed Ed25519 eligibility certificate for a completed workflow run.
   */
  async issue(runId: string) {
    const run = await prisma.workflowRun.findUniqueOrThrow({
      where: { id: runId },
      include: {
        citizen: {
          select: { id: true, name: true, onegovId: true },
        },
      },
    });

    if (run.eligibleResult !== true) {
      throw new Error(`Cannot issue certificate for ineligible or incomplete run (state=${run.state}, eligibleResult=${run.eligibleResult})`);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

    const payload: CertificatePayload = {
      runId: run.id,
      citizenId: run.citizenId,
      citizenName: run.citizen.name,
      onegovId: run.citizen.onegovId,
      serviceType: run.serviceType,
      eligibleResult: true,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const payloadBuffer = Buffer.from(canonicalStringify(payload));
    const privateKey = this.getPrivateKey();
    const signatureBuffer = crypto.sign(null, payloadBuffer, privateKey);
    const signature = signatureBuffer.toString('base64');

    const cert = await prisma.eligibilityCertificate.upsert({
      where: { runId: run.id },
      create: {
        runId: run.id,
        citizenId: run.citizenId,
        payload: payload as any,
        signature,
        algorithm: 'Ed25519',
        issuedAt: now,
        expiresAt,
      },
      update: {
        payload: payload as any,
        signature,
        issuedAt: now,
        expiresAt,
        revokedAt: null,
      },
    });

    // Notify citizen (Item 5 integration)
    try {
      await notificationService.emitNotification({
        citizenId: run.citizenId,
        type: 'CERTIFICATE_ISSUED',
        title: `Certificate Issued: ${run.serviceType}`,
        body: `Your cryptographically verifiable eligibility certificate for ${run.serviceType} is ready for download.`,
        metadata: { runId: run.id, certificateId: cert.id },
      });
    } catch (nErr) {
      console.error('[CertificateService] Failed to notify citizen:', nErr);
    }

    const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');

    return {
      certificate: cert,
      token,
    };
  }

  /**
   * Verifies an encoded certificate token against the public key and checks revocation status.
   */
  async verify(token: string): Promise<{
    valid: boolean;
    reason?: string;
    payload?: CertificatePayload;
    algorithm?: string;
  }> {
    try {
      const decodedJson = Buffer.from(token, 'base64').toString('utf-8');
      const { payload, signature } = JSON.parse(decodedJson);

      if (!payload || !signature) {
        return { valid: false, reason: 'MALFORMED_TOKEN' };
      }

      // 1. Verify cryptographic signature with Ed25519 public key
      const publicKey = this.getPublicKey();
      const payloadBuffer = Buffer.from(canonicalStringify(payload));
      const signatureBuffer = Buffer.from(signature, 'base64');

      const isSignatureValid = crypto.verify(null, payloadBuffer, publicKey, signatureBuffer);
      if (!isSignatureValid) {
        return { valid: false, reason: 'SIGNATURE_INVALID' };
      }

      // 2. Expiry check
      if (new Date(payload.expiresAt) < new Date()) {
        return { valid: false, reason: 'CERTIFICATE_EXPIRED', payload };
      }

      // 3. Database Revocation check (if registered)
      const existingInDb = await prisma.eligibilityCertificate.findUnique({
        where: { runId: payload.runId },
      });

      if (existingInDb && existingInDb.revokedAt) {
        return { valid: false, reason: 'CERTIFICATE_REVOKED', payload };
      }

      return {
        valid: true,
        payload,
        algorithm: 'Ed25519',
      };
    } catch (err: any) {
      return { valid: false, reason: `VERIFICATION_FAILED: ${err.message}` };
    }
  }

  /**
   * Revokes an existing certificate by runId.
   */
  async revoke(runId: string) {
    return prisma.eligibilityCertificate.updateMany({
      where: { runId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Retrieves certificate by workflow runId.
   */
  async getByRunId(runId: string) {
    const cert = await prisma.eligibilityCertificate.findUnique({
      where: { runId },
    });
    if (!cert) return null;

    const token = Buffer.from(
      JSON.stringify({ payload: cert.payload, signature: cert.signature })
    ).toString('base64');

    return { certificate: cert, token };
  }
}

export const certificateService = new CertificateService();
