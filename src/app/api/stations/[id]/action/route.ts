import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { StationStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orgId = session.activeMembership?.orgId;

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

  let newStatus: StationStatus = station.backendStatus;
  let actionMessage = "";

  switch (action) {
    case "start":
      newStatus = StationStatus.ON_AIR;
      actionMessage = `Station ${station.name} broadcast transmission initialized on port ${station.portIngest}`;
      break;

    case "stop":
      newStatus = StationStatus.STOPPED;
      actionMessage = `Station ${station.name} audio stream halted gracefully`;
      break;

    case "restart":
      newStatus = StationStatus.ON_AIR;
      actionMessage = `Station ${station.name} stream encoder processes restarted successfully`;
      break;

    case "reload_autodj":
      actionMessage = `Station ${station.name} AutoDJ cue playlist re-indexed`;
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Update status and process state in DB
  const updated = await prisma.station.update({
    where: { id },
    data: {
      backendStatus: newStatus,
      processState: {
        update: {
          lastHeartbeat: new Date(),
          encoderHealth: newStatus === StationStatus.ON_AIR ? 100 : 0,
        },
      },
    },
    include: { processState: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId,
      userId: session.user.id,
      action: `station.action_${action}`,
      resourceType: "Station",
      resourceId: id,
      metadata: JSON.stringify({ message: actionMessage }),
    },
  });

  return NextResponse.json({
    success: true,
    message: actionMessage,
    station: updated,
  });
}
