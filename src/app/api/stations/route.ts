import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { StationProvisioningService } from "@/lib/station-provisioning";
import { StreamAudioFormat } from "@prisma/client";
import { z } from "zod";

const createStationSchema = z.object({
  name: z.string().min(2, "Station name must be at least 2 characters"),
  description: z.string().optional(),
  genre: z.string().default("Variety"),
  defaultBitrate: z.number().default(320),
  defaultFormat: z.nativeEnum(StreamAudioFormat).default(StreamAudioFormat.OPUS_320),
  crossfadeSec: z.number().default(2.5),
  autoDjEnabled: z.boolean().default(true),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const stations = await prisma.station.findMany({
    where: isSuper ? undefined : { orgId },
    include: {
      mounts: true,
      processState: true,
      _count: {
        select: {
          mediaFiles: true,
          playlists: true,
          shows: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ stations });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const canCreate = AuthorizationService.can(session.user, "CREATE_STATION", {
    membership: session.activeMembership
      ? { orgId, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canCreate && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "You lack permission to provision radio stations" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createStationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const station = await StationProvisioningService.provisionStation({
      orgId,
      ...parsed.data,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId: session.user.id,
        action: "station.provision",
        resourceType: "Station",
        resourceId: station.id,
        metadata: JSON.stringify({ name: station.name, slug: station.slug, port: station.portIngest }),
      },
    });

    return NextResponse.json({ success: true, station });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to provision station";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
