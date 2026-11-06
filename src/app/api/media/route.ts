import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { findStationInTenantScope, getTenantScope } from "@/lib/tenant";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get("stationId");
  const query = searchParams.get("q")?.toLowerCase();

  const { isSuper, orgId } = getTenantScope(session);

  const whereClause: Record<string, unknown> = {};

  if (stationId) {
    const station = await findStationInTenantScope(stationId, isSuper, orgId);
    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }
    whereClause.stationId = station.id;
  } else if (!isSuper) {
    whereClause.station = { orgId };
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { artist: { contains: query, mode: "insensitive" } },
      { album: { contains: query, mode: "insensitive" } },
    ];
  }

  const files = await prisma.mediaFile.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      station: {
        select: { id: true, name: true, slug: true },
      },
    },
    take: 100,
  });

  // Convert BigInt fileSize to string for JSON serialization
  const serialized = files.map((f) => ({
    ...f,
    fileSize: f.fileSize.toString(),
  }));

  return NextResponse.json({ files: serialized });
}
