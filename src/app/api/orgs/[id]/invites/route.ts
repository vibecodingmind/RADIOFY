import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { OrgMemberRole } from "@prisma/client";
import crypto from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: orgId } = await params;
  const membership = session.memberships.find((m) => m.orgId === orgId);

  const canView = AuthorizationService.can(session.user, "INVITE_MEMBERS", {
    membership: membership
      ? { orgId: membership.orgId, role: membership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canView && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.organizationInvite.findMany({
    where: { orgId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: orgId } = await params;
  const membership = session.memberships.find((m) => m.orgId === orgId);

  const canInvite = AuthorizationService.can(session.user, "INVITE_MEMBERS", {
    membership: membership
      ? { orgId: membership.orgId, role: membership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canInvite && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Generate invitation token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.organizationInvite.create({
    data: {
      orgId,
      email: email.toLowerCase(),
      role: (role as OrgMemberRole) || "STATION_MANAGER",
      token,
      expiresAt,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId,
      userId: session.user.id,
      action: "member.invite_created",
      resourceType: "OrganizationInvite",
      resourceId: invite.id,
      metadata: JSON.stringify({ email, role }),
    },
  });

  return NextResponse.json({
    success: true,
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invites/${token}`,
    },
  });
}
