import { prisma } from "./prisma";
import { startOfDay, subDays, startOfMonth, endOfDay } from "date-fns";

export type AnalyticsRange =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "custom";

export function resolveRange(
  range: AnalyticsRange,
  customFrom?: string,
  customTo?: string
): { from: Date; to: Date } {
  const now = new Date();
  const to = endOfDay(now);

  switch (range) {
    case "today":
      return { from: startOfDay(now), to };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to };
    case "last30":
      return { from: startOfDay(subDays(now, 29)), to };
    case "thisMonth":
      return { from: startOfMonth(now), to };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : startOfDay(subDays(now, 7)),
        to: customTo ? new Date(customTo) : to,
      };
    default:
      return { from: startOfDay(subDays(now, 6)), to };
  }
}

export async function getAnalyticsSummary(opts: {
  orgId?: string;
  isSuper: boolean;
  range: AnalyticsRange;
  customFrom?: string;
  customTo?: string;
}) {
  const { from, to } = resolveRange(opts.range, opts.customFrom, opts.customTo);
  const stationWhere = opts.isSuper ? {} : { orgId: opts.orgId };

  const stations = await prisma.station.findMany({
    where: stationWhere,
    select: {
      id: true,
      name: true,
      slug: true,
      currentListeners: true,
      peakListeners: true,
      defaultBitrate: true,
      defaultFormat: true,
      portIngest: true,
    },
    orderBy: { currentListeners: "desc" },
  });

  const stationIds = stations.map((s) => s.id);

  const [sessions, logs, rollups] = await Promise.all([
    prisma.streamListenerSession.findMany({
      where: {
        stationId: { in: stationIds },
        connectedAt: { gte: from, lte: to },
      },
      select: { durationSeconds: true, bytesTransferred: true },
    }),
    prisma.broadcastLog.findMany({
      where: {
        stationId: { in: stationIds },
        startedAt: { gte: from, lte: to },
      },
      select: { durationSeconds: true, listenersPeak: true },
    }),
    prisma.bandwidthRollup.findMany({
      where: {
        stationId: { in: stationIds },
        date: { gte: from, lte: to },
      },
    }),
  ]);

  const totalListeners = stations.reduce((a, s) => a + s.currentListeners, 0);
  const peakConcurrent = stations.reduce((a, s) => a + s.peakListeners, 0);

  const listeningSecondsFromSessions = sessions.reduce((a, s) => a + s.durationSeconds, 0);
  const listeningSecondsFromRollups = rollups.reduce(
    (a, r) => a + Number(r.totalSecondsListened),
    0
  );
  const listeningSeconds =
    listeningSecondsFromSessions > 0 ? listeningSecondsFromSessions : listeningSecondsFromRollups;

  const bytesServed = rollups.reduce((a, r) => a + Number(r.totalBytesServed), 0);
  const spins = logs.length;
  const avgListenersOnSpins =
    logs.length > 0
      ? logs.reduce((a, l) => a + l.listenersPeak, 0) / logs.length
      : 0;

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    kpis: {
      activeListeners: totalListeners,
      peakConcurrent,
      listeningHours: Math.round(listeningSeconds / 3600),
      bytesServed: bytesServed.toString(),
      broadcastSpins: spins,
      avgListenersOnSpins: Math.round(avgListenersOnSpins),
    },
    stations,
  };
}
