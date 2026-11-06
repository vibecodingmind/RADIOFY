import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { StreamAudioFormat } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isSuper = session.user.role === "SUPER_ADMIN";
  const orgId = session.activeMembership?.orgId;

  // Search by either UUID or slug
  const station = await prisma.station.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(isSuper ? {} : { orgId }),
    },
    include: {
      mounts: true,
      processState: true,
      shows: true,
      playlists: true,
      djAccounts: {
        select: {
          id: true,
          username: true,
          mountAllowed: true,
          isActive: true,
          createdAt: true,
        },
      },
      broadcastLogs: {
        take: 10,
        orderBy: { startedAt: "desc" },
      },
      _count: {
        select: {
          mediaFiles: true,
          playlists: true,
          schedules: true,
        },
      },
    },
  });

  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  return NextResponse.json({ station });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orgId = session.activeMembership?.orgId;

  const canEdit = AuthorizationService.can(session.user, "MANAGE_STATION_SETTINGS", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canEdit && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    description,
    genre,
    defaultBitrate,
    defaultFormat,
    crossfadeSec,
    autoDjEnabled,
    publicPageEnabled,
  } = body;

  const updated = await prisma.station.update({
    where: { id },
    data: {
      name,
      description,
      genre,
      defaultBitrate,
      defaultFormat: defaultFormat as StreamAudioFormat,
      crossfadeSec,
      autoDjEnabled,
      publicPageEnabled,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId,
      userId: session.user.id,
      action: "station.update_settings",
      resourceType: "Station",
      resourceId: id,
      metadata: JSON.stringify(body),
    },
  });

  return NextResponse.json({ success: true, station: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orgId = session.activeMembership?.orgId;

  const canDelete = AuthorizationService.can(session.user, "DELETE_STATION", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canDelete && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.station.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: session.user.id,
      action: "station.delete",
      resourceType: "Station",
      resourceId: id,
    },
  });

  return NextResponse.json({ success: true, message: "Station deleted" });
}
