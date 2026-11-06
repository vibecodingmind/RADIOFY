import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { getTenantScope } from "@/lib/tenant";
import { StreamSupervisor } from "@/lib/stream-supervisor";
import { tickAutoDjForStation } from "@/lib/autodj-engine";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isSuper, orgId } = getTenantScope(session);

  const canControl = AuthorizationService.can(session.user, "START_STOP_STATION", {
    membership: session.activeMembership
      ? { orgId: orgId!, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canControl && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  const station = await prisma.station.findUnique({
    where: { id },
  });

  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  if (!isSuper && station.orgId !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let supervisorResult: unknown = null;
  let actionMessage = "";

  switch (action) {
    case "start":
      supervisorResult = await StreamSupervisor.start(id);
      await tickAutoDjForStation(id);
      actionMessage = `Station ${station.name} is ON AIR (port ${station.portIngest})`;
      break;

    case "stop":
      supervisorResult = await StreamSupervisor.stop(id);
      actionMessage = `Station ${station.name} stream halted`;
      break;

    case "restart":
      supervisorResult = await StreamSupervisor.restart(id);
      await tickAutoDjForStation(id);
      actionMessage = `Station ${station.name} encoder restarted`;
      break;

    case "reload_autodj":
      supervisorResult = await StreamSupervisor.reloadAutoDj(id);
      actionMessage = `Station ${station.name} AutoDJ playlist re-indexed`;
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.station.findUnique({
    where: { id },
    include: { processState: true },
  });

  await prisma.auditLog.create({
    data: {
      orgId: station.orgId,
      userId: session.user.id,
      action: `station.action_${action}`,
      resourceType: "Station",
      resourceId: id,
      metadata: JSON.stringify({ message: actionMessage, supervisorResult }),
    },
  });

  return NextResponse.json({
    success: true,
    message: actionMessage,
    supervisor: supervisorResult,
    station: updated,
  });
}
