import { prisma } from "./prisma";

/**
 * Poll Icecast JSON status for listener counts per mount.
 */
export interface IcecastMountStats {
  mount: string;
  listeners: number;
}

export async function fetchIcecastMountStats(): Promise<IcecastMountStats[]> {
  const host = process.env.STREAM_ICECAST_HOST || "localhost";
  const port = process.env.STREAM_ICECAST_PORT || "8010";
  const adminUser = process.env.STREAM_ICECAST_ADMIN_USER || "admin";
  const adminPass =
    process.env.STREAM_ICECAST_ADMIN_PASSWORD ||
    process.env.STREAM_ICECAST_SOURCE_PASSWORD ||
    "hackme";

  const url = `http://${host}:${port}/admin/stats?mode=json`;
  const auth = Buffer.from(`${adminUser}:${adminPass}`).toString("base64");

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      icestats?: {
        source?:
          | Array<{ listenurl?: string; listeners?: number }>
          | { listenurl?: string; listeners?: number };
      };
    };

    const sources = data.icestats?.source;
    if (!sources) return [];

    const list = Array.isArray(sources) ? sources : [sources];
    return list.map((s) => {
      const listenurl = s.listenurl || "";
      const parts = listenurl.split("/");
      const mountName = parts[parts.length - 1] || "live";
      return {
        mount: `/${mountName}`,
        listeners: Number(s.listeners || 0),
      };
    });
  } catch {
    return [];
  }
}

export async function syncStationListenerCountsFromIcecast() {
  const stats = await fetchIcecastMountStats();
  if (stats.length === 0) return { updated: 0 };

  const stations = await prisma.station.findMany({
    include: { mounts: true },
  });

  let updated = 0;

  for (const station of stations) {
    let total = 0;
    for (const mount of station.mounts) {
      const stat = stats.find((s) => s.mount === mount.mountPath);
      const listeners = stat?.listeners ?? 0;
      total += listeners;
      if (mount.currentListeners !== listeners) {
        await prisma.streamMount.update({
          where: { id: mount.id },
          data: { currentListeners: listeners },
        });
      }
    }

    const peak = Math.max(station.peakListeners, total);
    await prisma.station.update({
      where: { id: station.id },
      data: {
        currentListeners: total,
        peakListeners: peak,
      },
    });
    updated += 1;
  }

  return { updated };
}
