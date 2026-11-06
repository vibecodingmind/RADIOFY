import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
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

  const schedules = await prisma.stationSchedule.findMany({
    where: stationFilter,
    include: {
      station: { select: { id: true, name: true, slug: true } },
      show: true,
      playlist: { select: { id: true, name: true, type: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ schedules });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  try {
    const body = await req.json();
    const { stationId, showId, playlistId, title, dayOfWeek, startTime, endTime, isRecurring } = body;

    if (!stationId || !title || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "stationId, title, dayOfWeek, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    if (!isSuper && station.orgId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Schedule slot conflict detection: check if there's already an active slot overlapping on this day & station
    const existing = await prisma.stationSchedule.findMany({
      where: {
        stationId,
        dayOfWeek: parseInt(dayOfWeek, 10),
      },
    });

    const isOverlap = existing.some((slot) => {
      // (StartA < EndB) and (EndA > StartB)
      return startTime < slot.endTime && endTime > slot.startTime;
    });

    if (isOverlap) {
      return NextResponse.json(
        { error: `Schedule conflict detected: overlapping slot exists on this day between ${startTime} and ${endTime}.` },
        { status: 409 }
      );
    }

    const schedule = await prisma.stationSchedule.create({
      data: {
        stationId,
        showId: showId || null,
        playlistId: playlistId || null,
        title,
        dayOfWeek: parseInt(dayOfWeek, 10),
        startTime,
        endTime,
        isRecurring: isRecurring !== false,
      },
      include: {
        show: true,
        playlist: true,
      },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json({ error: error.message || "Failed to create schedule" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });

  const schedule = await prisma.stationSchedule.findUnique({
    where: { id },
    include: { station: true },
  });

  if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  const isSuper = session.user.role === "SUPER_ADMIN";
  if (!isSuper && schedule.station.orgId !== session.activeMembership?.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.stationSchedule.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
