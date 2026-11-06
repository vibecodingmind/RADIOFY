import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { findStationInTenantScope, getTenantScope } from "@/lib/tenant";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get("stationId");
  const { isSuper, orgId } = getTenantScope(session);

  let stationFilter: { stationId?: string; station?: { orgId?: string } } = {};
  if (stationId) {
    const station = await findStationInTenantScope(stationId, isSuper, orgId);
    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }
    stationFilter = { stationId: station.id };
  } else if (!isSuper) {
    stationFilter = { station: { orgId } };
  }

  const shows = await prisma.show.findMany({
    where: stationFilter,
    include: {
      station: { select: { id: true, name: true, slug: true } },
      schedules: {
        include: {
          playlist: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ shows });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  try {
    const body = await req.json();
    const { stationId, title, description, hostName, colorCode, bannerUrl } = body;

    if (!stationId || !title || !hostName) {
      return NextResponse.json(
        { error: "stationId, title, and hostName are required" },
        { status: 400 }
      );
    }

    // Verify station belongs to user's org if not superadmin
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    if (!isSuper && station.orgId !== orgId) {
      return NextResponse.json({ error: "Forbidden station access" }, { status: 403 });
    }

    const show = await prisma.show.create({
      data: {
        stationId,
        title,
        description: description || null,
        hostName,
        colorCode: colorCode || "#00E5FF",
        bannerUrl: bannerUrl || null,
      },
      include: {
        station: { select: { id: true, name: true } },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        orgId: station.orgId,
        userId: session.user.id,
        action: "show.create",
        resourceType: "Show",
        resourceId: show.id,
        metadata: JSON.stringify({ title: show.title, hostName: show.hostName }),
      },
    });

    return NextResponse.json({ show }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create show:", error);
    return NextResponse.json({ error: error.message || "Failed to create show" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("id");

  if (!showId) {
    return NextResponse.json({ error: "Show ID required" }, { status: 400 });
  }

  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: { station: true },
  });

  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  const isSuper = session.user.role === "SUPER_ADMIN";
  if (!isSuper && show.station.orgId !== session.activeMembership?.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.show.delete({
    where: { id: showId },
  });

  return NextResponse.json({ success: true });
}
