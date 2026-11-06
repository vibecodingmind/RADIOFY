import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { toClientJson } from "@/lib/serialize-client";
import { canViewAuditLog } from "@/lib/admin-roles";
import { AuditLogClient } from "./AuditLogClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!canViewAuditLog(session.user.role)) redirect("/admin");

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const data = toClientJson(logs) as typeof logs;

  return (
    <AdminShell role={session.user.role} user={session.user}>
      <AuditLogClient logs={data} />
    </AdminShell>
  );
}
