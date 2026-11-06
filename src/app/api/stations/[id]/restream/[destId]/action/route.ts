import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { getTenantScope, findStationInTenantScope } from "@/lib/tenant";
import { RestreamEngine } from "@/lib/restream-engine";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, destId } = await params;
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

  const dest = await prisma.restreamDestination.findFirst({
    where: { id: destId, stationId: station.id },
  });
  if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { action } = body as { action?: string };

  if (action === "start") {
    const result = await RestreamEngine.startDestination(dest.id);
    return NextResponse.json({ success: true, result });
  }
  if (action === "stop") {
    await RestreamEngine.stopDestination(dest.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
