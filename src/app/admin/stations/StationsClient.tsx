"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  name: string;
  slug: string;
  backendStatus: string;
  defaultBitrate: number;
  organization: { id: string; name: string; slug: string };
  processState: { lastHeartbeat: string | Date; pid: number | null } | null;
};

export function StationsClient({ stations }: { stations: Row[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return stations;
    return stations.filter(
      (st) =>
        st.name.toLowerCase().includes(s) ||
        st.slug.toLowerCase().includes(s) ||
        st.organization.name.toLowerCase().includes(s) ||
        st.organization.slug.toLowerCase().includes(s)
    );
  }, [stations, q]);

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">All stations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Global list across organizations. Use the broadcaster console to edit one org&apos;s
            stations.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search station or org…"
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 max-w-xs"
        />
      </div>
      <div className="overflow-x-auto border border-white/10 rounded">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400 border-b border-white/10">
            <tr>
              <th className="p-3">Station</th>
              <th className="p-3">Organization</th>
              <th className="p-3">Status</th>
              <th className="p-3">Bitrate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((st) => (
              <tr key={st.id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="font-medium text-slate-100">{st.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{st.slug}</div>
                </td>
                <td className="p-3 text-slate-300">{st.organization.name}</td>
                <td className="p-3">
                  <span className="text-amber-100 font-mono text-xs">{st.backendStatus}</span>
                  {st.processState?.pid ? (
                    <span className="ml-2 text-[10px] text-slate-500">pid {st.processState.pid}</span>
                  ) : null}
                </td>
                <td className="p-3 text-slate-300 font-mono">{st.defaultBitrate} kbps</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
