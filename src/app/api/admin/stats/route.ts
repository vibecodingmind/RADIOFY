import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  const [
    totalOrgs,
    totalUsers,
    totalStations,
    activeProcesses,
    totalMedia,
    recentAudits,
    recentTransactions,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.station.count(),
    prisma.stationProcessState.count({ where: { pid: { not: null } } }),
    prisma.mediaFile.count(),
    prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.paymentTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    metrics: {
      totalOrgs,
      totalUsers,
      totalStations,
      activeProcesses,
      totalMedia,
    },
    recentAudits,
    recentTransactions,
  });
}
