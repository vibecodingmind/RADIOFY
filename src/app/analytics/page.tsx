import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { Activity, Radio, TrendingUp, Globe2, Clock, Users, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const stations = await prisma.station.findMany({
    where: isSuper ? undefined : { orgId },
    orderBy: { currentListeners: "desc" },
  });

  const totalListeners = stations.reduce((acc, s) => acc + s.currentListeners, 0);
  const totalPeak = stations.reduce((acc, s) => acc + s.peakListeners, 0);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-container" />
              <span>Real-Time Broadcast Analytics & Concurrency</span>
            </h1>
            <p className="text-xs text-on-surface-variant">
              Telemetry rollup across edge clusters, listener session duration, and geographical dispersion
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase">
                Active Listeners
              </span>
              <div className="text-2xl font-bold text-on-surface font-mono">
                {totalListeners.toLocaleString()}
              </div>
              <div className="text-[11px] text-tertiary flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>+14.2% vs. 24h avg</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase">
                24h Peak Concurrent
              </span>
              <div className="text-2xl font-bold text-on-surface font-mono">
                {totalPeak.toLocaleString()}
              </div>
              <div className="text-[11px] text-secondary font-mono">21:40 UTC Sunset Peak</div>
            </div>

            <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase">
                Total Listening Hours
              </span>
              <div className="text-2xl font-bold text-on-surface font-mono">412,840</div>
              <div className="text-[11px] text-on-surface-variant font-mono">91.4% Monthly Quota</div>
            </div>

            <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase">
                Buffer Health
              </span>
              <div className="text-2xl font-bold text-tertiary font-mono">99.99%</div>
              <div className="text-[11px] text-on-surface-variant font-mono">Underrun: 0.001%</div>
            </div>
          </div>

          {/* Station breakdown */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
              Live Concurrency by Station Channel
            </span>

            <div className="divide-y divide-border-subtle/50 font-mono text-xs">
              {stations.map((st) => (
                <div key={st.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-primary-container" />
                    <div>
                      <div className="font-bold text-on-surface">{st.name}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        {st.defaultBitrate}kbps {st.defaultFormat.split("_")[0]} • Port {st.portIngest}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-primary-container font-bold text-sm">
                      {st.currentListeners.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-on-surface-variant">
                      Peak: {st.peakListeners.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
