import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ROLE_PERMISSIONS_MAP } from "@/lib/permissions";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeMembership = session.activeMembership;
  const permissions = activeMembership
    ? ROLE_PERMISSIONS_MAP[activeMembership.role] || []
    : [];

  const activeOrg = activeMembership?.organization
    ? {
        ...activeMembership.organization,
        storageQuotaBytes: activeMembership.organization.storageQuotaBytes.toString(),
        storageUsedBytes: activeMembership.organization.storageUsedBytes.toString(),
        maxBandwidthBytes: activeMembership.organization.maxBandwidthBytes.toString(),
      }
    : null;

  return NextResponse.json({
    user: session.user,
    activeOrganization: activeOrg,
    activeRole: activeMembership?.role || null,
    permissions,
    organizations: session.memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    })),
  });
}
