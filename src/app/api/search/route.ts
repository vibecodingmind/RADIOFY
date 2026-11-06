import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTenantScope, stationOrgWhere } from "@/lib/tenant";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ stations: [], media: [], shows: [], playlists: [] });
  }

  const { isSuper, orgId } = getTenantScope(session);
  const stationScope = stationOrgWhere(isSuper, orgId);

  const [stations, media, shows, playlists] = await Promise.all([
    prisma.station.findMany({
      where: {
        ...stationScope,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { genre: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { id: true, name: true, slug: true, backendStatus: true },
    }),
    prisma.mediaFile.findMany({
      where: {
        ...(isSuper ? {} : { station: { orgId } }),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { artist: { contains: q, mode: "insensitive" } },
          { album: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { id: true, title: true, artist: true, stationId: true },
    }),
    prisma.show.findMany({
      where: {
        ...(isSuper ? {} : { station: { orgId } }),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { hostName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { id: true, title: true, hostName: true, stationId: true },
    }),
    prisma.playlist.findMany({
      where: {
        ...(isSuper ? {} : { station: { orgId } }),
        name: { contains: q, mode: "insensitive" },
      },
      take: 8,
      select: { id: true, name: true, stationId: true, type: true },
    }),
  ]);

  return NextResponse.json({ stations, media, shows, playlists });
}
