import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { getTenantScope, findStationInTenantScope } from "@/lib/tenant";
import { RestreamPlatform } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  platform: z.nativeEnum(RestreamPlatform),
  label: z.string().min(1).max(120),
  rtmpIngestUrl: z
    .string()
    .min(12)
    .refine((u) => /^rtmps?:\/\//i.test(u), "Must be an rtmp or rtmps URL"),
  enabled: z.boolean().optional(),
  bitrateKbps: z.number().min(64).max(320).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isSuper, orgId } = getTenantScope(session);

  const station = await findStationInTenantScope(id, isSuper, orgId);
  if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });

  const destinations = await prisma.restreamDestination.findMany({
    where: { stationId: station.id },
    orderBy: { createdAt: "desc" },
  });

  const masked = destinations.map((d) => ({
    id: d.id,
    platform: d.platform,
    label: d.label,
    enabled: d.enabled,
    status: d.status,
    bitrateKbps: d.bitrateKbps,
    lastError: d.lastError,
    processPid: d.processPid,
    hasRtmpConfigured: Boolean(d.rtmpIngestUrl && d.rtmpIngestUrl.length > 12),
    /** Never expose full RTMP URL to client */
    rtmpHint: d.rtmpIngestUrl.slice(0, 28) + "…",
    createdAt: d.createdAt,
  }));

  return NextResponse.json({ destinations: masked });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isSuper, orgId } = getTenantScope(session);

  const canManage =
    isSuper ||
    AuthorizationService.can(session.user, "MANAGE_STATION_SETTINGS", {
      membership: session.activeMembership
        ? { orgId: orgId!, role: session.activeMembership.role }
        : undefined,
      targetOrgId: orgId,
    });

  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const station = await findStationInTenantScope(id, isSuper, orgId);
  if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const dest = await prisma.restreamDestination.create({
    data: {
      stationId: station.id,
      platform: parsed.data.platform,
      label: parsed.data.label,
      rtmpIngestUrl: parsed.data.rtmpIngestUrl,
      enabled: parsed.data.enabled ?? true,
      bitrateKbps: parsed.data.bitrateKbps ?? 128,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: station.orgId,
      userId: session.user.id,
      action: "restream.create",
      resourceType: "RestreamDestination",
      resourceId: dest.id,
      metadata: JSON.stringify({ platform: dest.platform, label: dest.label }),
    },
  });

  return NextResponse.json({
    destination: {
      id: dest.id,
      platform: dest.platform,
      label: dest.label,
      status: dest.status,
    },
  });
}
