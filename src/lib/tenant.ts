import { prisma } from "./prisma";

export function getTenantScope(session: {
  user: { role: string };
  activeMembership?: { orgId: string } | null;
}) {
  const isSuper = session.user.role === "SUPER_ADMIN";
  const orgId = session.activeMembership?.orgId;
  return { isSuper, orgId };
}

/** Prisma `where` fragment for org-owned stations (non-super users). */
export function stationOrgWhere(isSuper: boolean, orgId?: string | null) {
  if (isSuper) return {};
  if (!orgId) return { orgId: "__invalid__" };
  return { orgId };
}

export async function findStationInTenantScope(
  stationId: string,
  isSuper: boolean,
  orgId?: string | null
) {
  return prisma.station.findFirst({
    where: {
      id: stationId,
      ...stationOrgWhere(isSuper, orgId),
    },
  });
}

export async function findMediaFileInTenantScope(
  mediaFileId: string,
  isSuper: boolean,
  orgId?: string | null
) {
  return prisma.mediaFile.findFirst({
    where: {
      id: mediaFileId,
      ...(isSuper ? {} : { station: { orgId: orgId ?? "__invalid__" } }),
    },
    include: { station: { select: { orgId: true } } },
  });
}
