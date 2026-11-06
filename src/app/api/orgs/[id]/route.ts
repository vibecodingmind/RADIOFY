import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { z } from "zod";

const patchOrgSchema = z.object({
  name: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  timezone: z.string().min(1).optional(),
  defaultLanguage: z.string().min(2).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isSuper = session.user.role === "SUPER_ADMIN";
  const membership = session.memberships.find((m) => m.orgId === id);

  if (!isSuper && !membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    organization: {
      ...org,
      storageQuotaBytes: org.storageQuotaBytes.toString(),
      storageUsedBytes: org.storageUsedBytes.toString(),
      maxBandwidthBytes: org.maxBandwidthBytes.toString(),
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = session.memberships.find((m) => m.orgId === id);
  const isSuper = session.user.role === "SUPER_ADMIN";

  const canManage =
    isSuper ||
    AuthorizationService.can(session.user, "MANAGE_ORGANIZATION", {
      membership: membership
        ? { orgId: id, role: membership.role }
        : undefined,
      targetOrgId: id,
    });

  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      orgId: id,
      userId: session.user.id,
      action: "organization.update",
      resourceType: "Organization",
      resourceId: id,
      metadata: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json({
    organization: {
      ...updated,
      storageQuotaBytes: updated.storageQuotaBytes.toString(),
      storageUsedBytes: updated.storageUsedBytes.toString(),
      maxBandwidthBytes: updated.maxBandwidthBytes.toString(),
    },
  });
}
