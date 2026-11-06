import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { Activity } from "lucide-react";
import { AnalyticsClient } from "./AnalyticsClient";
import { getAnalyticsSummary } from "@/lib/analytics-service";
import { getTenantScope } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const { isSuper, orgId } = getTenantScope(session);
  const initial = await getAnalyticsSummary({ orgId, isSuper, range: "last7" });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={initial.stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-container" />
              <span>Broadcast Analytics</span>
            </h1>
            <p className="text-xs text-on-surface-variant">
              Listener concurrency, listening hours, and spin volume from database telemetry
            </p>
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <AnalyticsClient initial={initial} />
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
