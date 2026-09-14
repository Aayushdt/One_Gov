import { ConnectorManifest, ServiceDefinition, DataCategory, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/db';

export class ConnectorRegistry {
  private prisma: PrismaClient;
  private connectorCache: Map<string, ConnectorManifest> = new Map();
  private serviceCache: Map<string, ServiceDefinition> = new Map();
  private lastFetchedAt = 0;
  private ttlMs: number;

  constructor(prismaClient: PrismaClient = defaultPrisma, ttlMs = 60_000) {
    this.prisma = prismaClient;
    this.ttlMs = ttlMs;
  }

  /**
   * Clears the in-memory cache.
   */
  invalidateCache(): void {
    this.connectorCache.clear();
    this.serviceCache.clear();
    this.lastFetchedAt = 0;
  }

  /**
   * Loads all active manifests into memory and updates the cache.
   */
  async loadAll(): Promise<Map<string, ConnectorManifest>> {
    try {
      const manifests = await this.prisma.connectorManifest.findMany({
        where: { isActive: true },
      });
      this.connectorCache.clear();
      for (const m of manifests) {
        this.connectorCache.set(m.slug, m);
      }
      this.lastFetchedAt = Date.now();
      return this.connectorCache;
    } catch (err) {
      // DB-unavailable fallback: return current cache if populated
      if (this.connectorCache.size > 0) {
        return this.connectorCache;
      }
      throw err;
    }
  }

  /**
   * Gets a single connector manifest by its unique slug.
   */
  async getConnector(slug: string): Promise<ConnectorManifest | null> {
    const isExpired = Date.now() - this.lastFetchedAt > this.ttlMs;

    if (this.connectorCache.size === 0 || isExpired) {
      try {
        await this.loadAll();
      } catch (err) {
        if (!this.connectorCache.has(slug)) {
          throw err;
        }
      }
    }

    return this.connectorCache.get(slug) ?? null;
  }

  /**
   * Gets a connector by its data category.
   */
  async getConnectorByCategory(category: DataCategory): Promise<ConnectorManifest | null> {
    const isExpired = Date.now() - this.lastFetchedAt > this.ttlMs;
    if (this.connectorCache.size === 0 || isExpired) {
      await this.loadAll();
    }
    for (const manifest of this.connectorCache.values()) {
      if (manifest.category === category && manifest.isActive) {
        return manifest;
      }
    }
    return null;
  }

  /**
   * Gets a service definition by serviceType ("SCHOLARSHIP" | "TRANSPORT" | "WELFARE").
   */
  async getServiceDefinition(serviceType: string): Promise<ServiceDefinition | null> {
    const cached = this.serviceCache.get(serviceType);
    const isExpired = Date.now() - this.lastFetchedAt > this.ttlMs;

    if (cached && !isExpired) {
      return cached;
    }

    try {
      const svc = await this.prisma.serviceDefinition.findUnique({
        where: { serviceType },
      });
      if (svc) {
        this.serviceCache.set(serviceType, svc);
      }
      return svc;
    } catch (err) {
      if (cached) {
        // Fallback to stale cached definition if DB fails
        return cached;
      }
      throw err;
    }
  }

  /**
   * Lists all active connector manifests.
   */
  async getAllConnectors(): Promise<ConnectorManifest[]> {
    const isExpired = Date.now() - this.lastFetchedAt > this.ttlMs;
    if (this.connectorCache.size === 0 || isExpired) {
      await this.loadAll();
    }
    return Array.from(this.connectorCache.values());
  }

  /**
   * Lists all active service definitions.
   */
  async getAllServices(): Promise<ServiceDefinition[]> {
    try {
      const services = await this.prisma.serviceDefinition.findMany({
        where: { isActive: true },
      });
      for (const s of services) {
        this.serviceCache.set(s.serviceType, s);
      }
      return services;
    } catch (err) {
      if (this.serviceCache.size > 0) {
        return Array.from(this.serviceCache.values());
      }
      throw err;
    }
  }
}

export const connectorRegistry = new ConnectorRegistry();
