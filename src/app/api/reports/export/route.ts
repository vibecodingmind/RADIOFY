import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { getTenantScope } from "@/lib/tenant";

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isSuper, orgId } = getTenantScope(session);

  const canExport =
    isSuper ||
    AuthorizationService.can(session.user, "VIEW_ROYALTY_REPORTS", {
      membership: session.activeMembership
        ? { orgId: orgId!, role: session.activeMembership.role }
        : undefined,
      targetOrgId: orgId,
    });

  if (!canExport) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.broadcastLog.findMany({
    where: isSuper ? undefined : { station: { orgId } },
    include: { station: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 5000,
  });

  const header = [
    "Air Timestamp (UTC)",
    "Station",
    "Track Title",
    "Featured Artist",
    "Album",
    "Duration (sec)",
    "Peak Listeners",
  ].join(",");

  const rows = logs.map((log) =>
    [
      csvEscape(new Date(log.startedAt).toISOString()),
      csvEscape(log.station.name),
      csvEscape(log.trackTitle),
      csvEscape(log.artist),
      csvEscape(log.album),
      csvEscape(Math.round(log.durationSeconds)),
      csvEscape(log.listenersPeak),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="radiofy-royalty-spins-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
