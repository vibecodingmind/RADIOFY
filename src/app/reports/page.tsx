import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { FileSpreadsheet, Download, ShieldCheck, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RoyaltyReportsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const [logs, stations] = await Promise.all([
    prisma.broadcastLog.findMany({
      where: isSuper ? undefined : { station: { orgId } },
      include: {
        station: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
    prisma.station.findMany({
      where: isSuper ? undefined : { orgId },
    }),
  ]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
              <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary-container" />
                <span>SoundExchange & Royalty Spin Logs</span>
              </h1>
              <p className="text-xs text-on-surface-variant">
                Audited transmission history formatted for statutory licensing and performance royalty compliance
              </p>
            </div>

            <button
              onClick={undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SoundExchange CSV</span>
            </button>
          </div>

          <div className="rounded-lg bg-surface-panel border border-border-subtle overflow-hidden shadow-panel">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider bg-surface-container/40">
                  <th className="py-2.5 px-3">Air Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Track Title</th>
                  <th className="py-2.5 px-3">Featured Artist</th>
                  <th className="py-2.5 px-3">Album</th>
                  <th className="py-2.5 px-3 text-right">Duration</th>
                  <th className="py-2.5 px-3 text-right">Listeners</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                      No broadcast spin logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-2.5 px-3 text-on-surface-variant">
                        {new Date(log.startedAt).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-2.5 px-3 text-primary-container font-semibold">
                        {log.station.name}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface font-sans font-bold">
                        {log.trackTitle}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface">{log.artist}</td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{log.album || "—"}</td>
                      <td className="py-2.5 px-3 text-right text-on-surface">
                        {Math.floor(log.durationSeconds / 60)}:
                        {Math.floor(log.durationSeconds % 60)
                          .toString()
                          .padStart(2, "0")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-tertiary font-bold">
                        {log.listenersPeak.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
