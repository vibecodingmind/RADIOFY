import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: stationId } = await params;
  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const djs = await prisma.djAccount.findMany({
    where: {
      stationId,
      ...(isSuper ? {} : { station: { orgId } }),
    },
    select: {
      id: true,
      username: true,
      mountAllowed: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ djs });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: stationId } = await params;
  const orgId = session.activeMembership?.orgId;

  const canManage = AuthorizationService.can(session.user, "MANAGE_STATION_SETTINGS", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canManage && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, mountAllowed } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const dj = await prisma.djAccount.create({
    data: {
      stationId,
      username: username.toLowerCase().trim(),
      passwordHash,
      mountAllowed: mountAllowed || "/live",
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      mountAllowed: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, dj });
}
