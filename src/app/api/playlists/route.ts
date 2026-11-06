import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { PlaylistType, PlayMode } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get("stationId");
  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const playlists = await prisma.playlist.findMany({
    where: {
      ...(stationId ? { stationId } : isSuper ? {} : { station: { orgId } }),
    },
    include: {
      station: { select: { id: true, name: true, slug: true } },
      items: {
        include: {
          mediaFile: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = playlists.map((p) => ({
    ...p,
    items: p.items.map((i) => ({
      ...i,
      mediaFile: {
        ...i.mediaFile,
        fileSize: i.mediaFile.fileSize.toString(),
      },
    })),
  }));

  return NextResponse.json({ playlists: serialized });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const canManage = AuthorizationService.can(session.user, "MANAGE_PLAYLISTS", {
    membership: session.activeMembership
      ? { orgId, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canManage && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { stationId, name, type, weight, playMode, startTime, endTime, daysOfWeek } = body;

  if (!stationId || !name) {
    return NextResponse.json(
      { error: "Station ID and playlist name are required" },
      { status: 400 }
    );
  }

  const playlist = await prisma.playlist.create({
    data: {
      stationId,
      name,
      type: (type as PlaylistType) || "ROTATION",
      weight: weight ?? 5,
      playMode: (playMode as PlayMode) || "SHUFFLE",
      startTime,
      endTime,
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    },
  });

  return NextResponse.json({ success: true, playlist });
}
