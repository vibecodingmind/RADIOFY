import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { Settings } from "lucide-react";
import { SettingsClient } from "./SettingsClient";
import { getTenantScope, stationOrgWhere } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const { isSuper, orgId } = getTenantScope(session);
  if (!orgId && !isSuper) redirect("/team");

  const org = orgId
    ? await prisma.organization.findUnique({ where: { id: orgId } })
    : null;

  const stations = await prisma.station.findMany({
    where: stationOrgWhere(isSuper, orgId),
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1000px] w-full mx-auto space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-container" />
              <span>Broadcast Organization Settings</span>
            </h1>
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle shadow-panel">
            {org ? (
              <SettingsClient
                org={{
                  id: org.id,
                  name: org.name,
                  slug: org.slug,
                  contactEmail: org.contactEmail,
                  timezone: org.timezone,
                  defaultLanguage: org.defaultLanguage,
                }}
                operatorName={session.user.name}
                operatorEmail={session.user.email}
              />
            ) : (
              <p className="text-xs text-on-surface-variant">
                Superadmin accounts without an org membership can manage tenants from HQ Cockpit.
              </p>
            )}
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
