import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { getTenantScope, findStationInTenantScope } from "@/lib/tenant";
import { RestreamEngine } from "@/lib/restream-engine";
import { RestreamPlatform } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  platform: z.nativeEnum(RestreamPlatform).optional(),
  label: z.string().min(1).max(120).optional(),
  rtmpIngestUrl: z
    .string()
    .min(12)
    .refine((u) => /^rtmps?:\/\//i.test(u), "Must be an rtmp or rtmps URL")
    .optional(),
  enabled: z.boolean().optional(),
  bitrateKbps: z.number().min(64).max(320).optional(),
});

function assertCanManage(session: Awaited<ReturnType<typeof getSessionUser>>, orgId: string | null | undefined) {
  if (!session) return false;
  const isSuper = session.user.role === "SUPER_ADMIN";
  return (
    isSuper ||
    AuthorizationService.can(session.user, "MANAGE_STATION_SETTINGS", {
      membership: session.activeMembership
        ? { orgId: orgId!, role: session.activeMembership.role }
        : undefined,
      targetOrgId: orgId ?? undefined,
    })
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, destId } = await params;
  const { isSuper, orgId } = getTenantScope(session);
  if (!assertCanManage(session, orgId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const station = await findStationInTenantScope(id, isSuper, orgId);
  if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });

  const existing = await prisma.restreamDestination.findFirst({
    where: { id: destId, stationId: station.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updated = await prisma.restreamDestination.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json({ destination: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, destId } = await params;
  const { isSuper, orgId } = getTenantScope(session);
  if (!assertCanManage(session, orgId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const station = await findStationInTenantScope(id, isSuper, orgId);
  if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });

  const existing = await prisma.restreamDestination.findFirst({
    where: { id: destId, stationId: station.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await RestreamEngine.stopDestination(existing.id);
  await prisma.restreamDestination.delete({ where: { id: existing.id } });

  return NextResponse.json({ success: true });
}
