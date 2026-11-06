import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { OrgMemberRole } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: orgId } = await params;
  const membership = session.memberships.find((m) => m.orgId === orgId);

  const canView = AuthorizationService.can(session.user, "MANAGE_MEMBERS", {
    membership: membership
      ? { orgId: membership.orgId, role: membership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canView && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      customRole: true,
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: orgId } = await params;
  const membership = session.memberships.find((m) => m.orgId === orgId);

  const canManage = AuthorizationService.can(session.user, "MANAGE_ROLES", {
    membership: membership
      ? { orgId: membership.orgId, role: membership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canManage && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { memberId, role, customRoleId } = body;

  if (!memberId || !role) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: {
      role: role as OrgMemberRole,
      customRoleId: role === "CUSTOM" ? customRoleId : null,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId,
      userId: session.user.id,
      action: "member.role_update",
      resourceType: "OrganizationMember",
      resourceId: memberId,
      metadata: JSON.stringify({ role, customRoleId }),
    },
  });

  return NextResponse.json({ success: true, member: updated });
}
