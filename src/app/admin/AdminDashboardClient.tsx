"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Server,
  Radio,
  Users,
  CreditCard,
  HardDrive,
  Activity,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sliders,
  Clock,
  Cpu,
} from "lucide-react";

interface AdminDashboardClientProps {
  organizations: any[];
  stations: any[];
  auditLogs: any[];
  transactions: any[];
  adminUser: any;
}

export function AdminDashboardClient({
  organizations,
  stations,
  auditLogs,
  transactions,
  adminUser,
}: AdminDashboardClientProps) {
  const [searchOrg, setSearchOrg] = useState("");
  const [activeTab, setActiveTab] = useState<"tenants" | "stations" | "audits">("tenants");

  const runningStations = stations.filter((s) => s.backendStatus === "ON_AIR" || s.processState?.pid).length;
  const totalStations = stations.length;

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchOrg.toLowerCase()) ||
      o.slug.toLowerCase().includes(searchOrg.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1700px] mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#00E5FF]" />
              Platform Superadmin Cockpit
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FF0055]/10 text-[#FF0055] border border-[#FF0055]/20 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-ping" />
              HQ LEVEL ACCESS
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Global tenant orchestration, cluster node telemetry, multi-gateway billing governance, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/gateways"
            className="flex items-center gap-2 px-4 py-2 bg-[#111622] hover:bg-[#1E293B] text-white border border-[#1E293B] text-xs font-semibold rounded-md transition"
          >
            <CreditCard className="w-4 h-4 text-[#00E5FF]" />
            PAYMENT GATEWAYS
          </Link>
          <div className="text-right">
            <div className="text-xs text-white font-semibold">{adminUser.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{adminUser.email}</div>
          </div>
        </div>
      </div>

      {/* Global Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Broadcaster Organizations
            </span>
            <Users className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{organizations.length}</span>
            <span className="text-xs text-[#00FF66] font-mono">Tenants</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Across 3 multi-tenant subscription tiers
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Radio Stations
            </span>
            <Radio className="w-4 h-4 text-[#00FF66]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#00FF66]">{runningStations}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalStations} Online</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {( (runningStations / (totalStations || 1)) * 100 ).toFixed(1)}% Operational availability
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Streaming Node Fleet
            </span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">4</span>
            <span className="text-xs text-purple-400 font-mono">Global Edge Clusters</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Frankfurt • US-East • Tokyo • London
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recent Transactions
            </span>
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{transactions.length}</span>
            <span className="text-xs text-yellow-400 font-mono">Settled</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Stripe, PayPal & PesaPal verified
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#1E293B] pb-2">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${
            activeTab === "tenants"
              ? "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          Broadcaster Organizations ({organizations.length})
        </button>

        <button
          onClick={() => setActiveTab("stations")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${
            activeTab === "stations"
              ? "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Radio className="w-4 h-4" />
          Station Network ({stations.length})
        </button>

        <button
          onClick={() => setActiveTab("audits")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${
            activeTab === "audits"
              ? "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Platform Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Tenants */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tenant organization..."
                value={searchOrg}
                onChange={(e) => setSearchOrg(e.target.value)}
                className="w-full bg-[#10131a] border border-[#1E293B] pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 rounded-md focus:border-[#00E5FF] outline-none"
              />
            </div>
          </div>

          <div className="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0E14] text-slate-400 border-b border-[#1E293B] font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Plan / Tier</th>
                    <th className="py-3 px-4">Stations</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Storage Usage</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredOrgs.map((org) => {
                    const activePlan = org.subscriptions?.[0]?.plan?.name || "Starter Tier";
                    const storagePercent = Math.min(
                      100,
                      Math.round((Number(org.storageUsedBytes) / (Number(org.storageQuotaBytes) || 1)) * 100)
                    );

                    return (
                      <tr key={org.id} className="hover:bg-[#1E293B]/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
                            <div>
                              <div>{org.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">slug: {org.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                            {activePlan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {org.stations?.length || 0}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {org.members?.length || 0} members
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>{storagePercent}%</span>
                              <span className="font-mono">
                                {(Number(org.storageUsedBytes) / 1024 / 1024).toFixed(0)} MB
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00E5FF] rounded-full"
                                style={{ width: `${storagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href="/"
                            className="inline-flex items-center gap-1 text-[11px] text-[#00E5FF] hover:underline"
                          >
                            Inspect <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stations */}
      {activeTab === "stations" && (
        <div className="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0E14] text-slate-400 border-b border-[#1E293B] font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Port</th>
                  <th className="py-3 px-4">Bitrate / Format</th>
                  <th className="py-3 px-4">Engine State</th>
                  <th className="py-3 px-4">Mount Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {stations.map((st) => (
                  <tr key={st.id} className="hover:bg-[#1E293B]/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-[#00E5FF]" />
                        <div>
                          <div>{st.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{st.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {st.organization?.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#00E5FF]">
                      :{st.portIngest}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {st.defaultBitrate} kbps ({st.defaultFormat})
                    </td>
                    <td className="py-3.5 px-4">
                      {st.backendStatus === "ON_AIR" || st.processState?.pid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20">
                          ON-AIR / ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          STANDBY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {st.mounts?.map((m: any) => m.path).join(", ") || "/live"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/stations/${st.slug}`}
                        className="inline-flex items-center gap-1 text-[11px] text-[#00E5FF] hover:underline"
                      >
                        Manage <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === "audits" && (
        <div className="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className="p-4 bg-[#0B0E14] border-b border-[#1E293B] flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              Immutable Audit Event Log
            </span>
            <span className="text-[11px] font-mono text-slate-400">Showing last 20 events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0E14] text-slate-400 border-b border-[#1E293B] font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1E293B]/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()} UTC
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#00E5FF]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.user ? log.user.name || log.user.email : "System / Daemon"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.organization?.name || "Global / System"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {log.resourceType} {log.resourceId ? `#${log.resourceId.slice(0, 8)}` : ""}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] truncate max-w-xs">
                      {log.metadata || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
