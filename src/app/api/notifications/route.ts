import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTenantScope } from "@/lib/tenant";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isSuper, orgId } = getTenantScope(session);

  const logs = await prisma.auditLog.findMany({
    where: isSuper ? undefined : { orgId },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      user: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    },
  });

  const notifications = logs.map((log) => ({
    id: log.id,
    title: log.action.replace(/\./g, " ").replace(/_/g, " "),
    body: `${log.resourceType}${log.resourceId ? ` • ${log.resourceId.slice(0, 8)}` : ""}`,
    createdAt: log.createdAt,
    read: false,
    actor: log.user?.name,
    org: log.organization?.name,
  }));

  return NextResponse.json({ notifications, unreadCount: notifications.length });
}
