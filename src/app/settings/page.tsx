import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { Settings, Shield, Globe, Clock, User, Building } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const org = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
      })
    : null;

  const stations = await prisma.station.findMany({
    where: { orgId: orgId || undefined },
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
            <p className="text-xs text-on-surface-variant">
              Configure system timezone, organization identity, and operator account preferences
            </p>
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <Building className="w-4 h-4 text-primary-container" />
              <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                Organization Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-on-surface-variant mb-1">
                  ORGANIZATION NAME
                </label>
                <div className="p-2.5 rounded bg-surface-container border border-border-subtle font-bold text-on-surface">
                  {org?.name || "AetherWave Broadcasting Group"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-on-surface-variant mb-1">
                  SYSTEM SLUG
                </label>
                <div className="p-2.5 rounded bg-surface-container border border-border-subtle text-primary-container">
                  {org?.slug}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-on-surface-variant mb-1">
                  CONTACT / BILLING EMAIL
                </label>
                <div className="p-2.5 rounded bg-surface-container border border-border-subtle text-on-surface">
                  {org?.contactEmail}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-on-surface-variant mb-1">
                  DEFAULT TIMEZONE
                </label>
                <div className="p-2.5 rounded bg-surface-container border border-border-subtle text-on-surface">
                  {org?.timezone || "UTC"}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <User className="w-4 h-4 text-secondary" />
              <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                Active Console Operator
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[11px] text-on-surface-variant block mb-1">NAME</span>
                <div className="p-2.5 rounded bg-surface-container border border-border-subtle font-bold text-on-surface">
                  {session.user.name}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block mb-1">OPERATOR EMAIL</span>
                <div className="p-2.5 rounded bg-surface-container border border-border-subtle text-on-surface">
                  {session.user.email}
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
