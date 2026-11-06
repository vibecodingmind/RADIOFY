import { prisma } from "./prisma";

export class EntitlementService {
  static async getOrgEntitlements(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] } },
          include: { plan: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        stations: { select: { id: true } },
      },
    });

    if (!org) throw new Error("Organization not found");

    const activeSub = org.subscriptions[0];
    const plan = activeSub?.plan;

    const maxStations = plan?.maxStations ?? org.maxStations;
    const maxStorageBytes = plan
      ? BigInt(plan.maxStorageGb) * 1024n * 1024n * 1024n
      : org.storageQuotaBytes;
    const maxBandwidthBytes = plan
      ? BigInt(plan.maxBandwidthGb) * 1024n * 1024n * 1024n
      : org.maxBandwidthBytes;

    return {
      org,
      plan,
      maxStations,
      maxStorageBytes,
      maxBandwidthBytes,
      stationCount: org.stations.length,
      storageUsedBytes: org.storageUsedBytes,
    };
  }

  static async assertCanCreateStation(orgId: string) {
    const ent = await this.getOrgEntitlements(orgId);
    if (ent.stationCount >= ent.maxStations) {
      throw new Error(
        `Station limit reached (${ent.maxStations}). Upgrade your subscription to add more stations.`
      );
    }
    return ent;
  }

  static async assertCanUploadBytes(orgId: string, additionalBytes: number) {
    const ent = await this.getOrgEntitlements(orgId);
    if (ent.storageUsedBytes + BigInt(additionalBytes) > ent.maxStorageBytes) {
      throw new Error("Storage quota exceeded. Upgrade your plan or remove media files.");
    }
    return ent;
  }
}
