import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { MediaStorageService } from "@/lib/media-storage";
import { EntitlementService } from "@/lib/entitlements";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const canUpload = AuthorizationService.can(session.user, "MANAGE_MEDIA", {
    membership: session.activeMembership
      ? { orgId, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canUpload && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const stationId = formData.get("stationId") as string | null;

    if (!file || !stationId) {
      return NextResponse.json(
        { error: "Audio file and station ID are required" },
        { status: 400 }
      );
    }

    // Verify station belongs to organization
    const station = await prisma.station.findFirst({
      where: {
        id: stationId,
        ...(session.user.role === "SUPER_ADMIN" ? {} : { orgId }),
      },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await EntitlementService.assertCanUploadBytes(station.orgId, buffer.length);

    // Parse audio ID3 metadata and persist to storage
    const parsed = await MediaStorageService.saveAndParseAudio(
      buffer,
      file.name,
      stationId
    );

    // Save record to DB
    const mediaFile = await prisma.mediaFile.create({
      data: {
        stationId: station.id,
        originalFilename: file.name,
        storageKey: parsed.storageKey,
        fileSize: BigInt(parsed.fileSize),
        mimeType: parsed.mimeType,
        duration: parsed.duration,
        title: parsed.title,
        artist: parsed.artist,
        album: parsed.album,
        genre: parsed.genre || station.genre,
        year: parsed.year,
        bpm: parsed.bpm,
        lufs: parsed.lufs,
        cueInSec: 0.0,
        cueOutSec: parsed.duration,
      },
    });

    await prisma.organization.update({
      where: { id: station.orgId },
      data: {
        storageUsedBytes: {
          increment: BigInt(parsed.fileSize),
        },
      },
    });

    return NextResponse.json({
      success: true,
      mediaFile: {
        ...mediaFile,
        fileSize: mediaFile.fileSize.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const msg = error instanceof Error ? error.message : "Upload processing failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
