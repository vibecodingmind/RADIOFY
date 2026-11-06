import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { MediaStorageService } from "@/lib/media-storage";
import { findMediaFileInTenantScope, getTenantScope } from "@/lib/tenant";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isSuper, orgId } = getTenantScope(session);

  const canEdit = AuthorizationService.can(session.user, "MANAGE_MEDIA", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canEdit && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await findMediaFileInTenantScope(id, isSuper, orgId);
  if (!existing) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, artist, album, genre, year, cueInSec, cueOutSec } = body;

  const updated = await prisma.mediaFile.update({
    where: { id: existing.id },
    data: {
      title,
      artist,
      album,
      genre,
      year,
      cueInSec,
      cueOutSec,
    },
  });

  return NextResponse.json({
    success: true,
    mediaFile: {
      ...updated,
      fileSize: updated.fileSize.toString(),
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isSuper, orgId } = getTenantScope(session);

  const canDelete = AuthorizationService.can(session.user, "MANAGE_MEDIA", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canDelete && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mediaFile = await findMediaFileInTenantScope(id, isSuper, orgId);

  if (!mediaFile) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  await MediaStorageService.deleteAudioFile(mediaFile.storageKey);

  await prisma.organization.update({
    where: { id: mediaFile.station.orgId },
    data: {
      storageUsedBytes: {
        decrement: mediaFile.fileSize,
      },
    },
  });

  await prisma.mediaFile.delete({
    where: { id: mediaFile.id },
  });

  return NextResponse.json({ success: true, message: "Media file deleted" });
}
