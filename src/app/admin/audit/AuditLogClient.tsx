"use client";

import { useMemo, useState } from "react";

type LogRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string | Date;
  organization: { name: string; slug: string } | null;
  user: { name: string; email: string } | null;
};

export function AuditLogClient({ logs }: { logs: LogRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(s) ||
        l.resourceType.toLowerCase().includes(s) ||
        (l.user?.email && l.user.email.toLowerCase().includes(s))
    );
  }, [logs, q]);

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Audit log</h1>
          <p className="text-sm text-slate-400 mt-1">Latest 100 platform events.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter action, resource, email…"
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 max-w-xs"
        />
      </div>
      <div className="overflow-x-auto border border-white/10 rounded text-xs font-mono">
        <table className="w-full">
          <thead className="text-left text-slate-400 border-b border-white/10">
            <tr>
              <th className="p-2">When</th>
              <th className="p-2">Action</th>
              <th className="p-2">Resource</th>
              <th className="p-2">User</th>
              <th className="p-2">Org</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-white/10 text-slate-300">
                <td className="p-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2 text-amber-100">{l.action}</td>
                <td className="p-2">
                  {l.resourceType}
                  {l.resourceId ? ` · ${l.resourceId.slice(0, 8)}…` : ""}
                </td>
                <td className="p-2">{l.user?.email ?? "—"}</td>
                <td className="p-2">{l.organization?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
