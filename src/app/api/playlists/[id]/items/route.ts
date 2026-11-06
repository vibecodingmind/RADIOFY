import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;
  const orgId = session.activeMembership?.orgId;

  const canManage = AuthorizationService.can(session.user, "MANAGE_PLAYLISTS", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canManage && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { mediaFileId, cueFadeSec } = body;

  if (!mediaFileId) {
    return NextResponse.json({ error: "Media file ID is required" }, { status: 400 });
  }

  const existingCount = await prisma.playlistItem.count({
    where: { playlistId },
  });

  const item = await prisma.playlistItem.create({
    data: {
      playlistId,
      mediaFileId,
      order: existingCount + 1,
      cueFadeSec: cueFadeSec ?? 2.0,
    },
    include: {
      mediaFile: true,
    },
  });

  return NextResponse.json({
    success: true,
    item: {
      ...item,
      mediaFile: {
        ...item.mediaFile,
        fileSize: item.mediaFile.fileSize.toString(),
      },
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "Item ID required" }, { status: 400 });
  }

  await prisma.playlistItem.delete({
    where: { id: itemId, playlistId },
  });

  return NextResponse.json({ success: true, message: "Track removed from playlist" });
}
