"use client";

import { useMemo, useState } from "react";
type OrgRow = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  createdAt: string | Date;
  _count: { stations: number; members: number };
  subscriptions: Array<{ plan: { name: string; slug: string } | null }>;
};

export function OrganizationsClient({ organizations }: { organizations: OrgRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return organizations;
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(s) ||
        o.slug.toLowerCase().includes(s) ||
        o.contactEmail.toLowerCase().includes(s)
    );
  }, [organizations, q]);

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Organizations</h1>
          <p className="text-sm text-slate-400 mt-1">All customer accounts on the platform.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, slug, email…"
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 max-w-xs"
        />
      </div>
      <div className="overflow-x-auto border border-white/10 rounded">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400 border-b border-white/10">
            <tr>
              <th className="p-3">Organization</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Stations</th>
              <th className="p-3">Members</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="font-medium text-slate-100">{o.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{o.slug}</div>
                </td>
                <td className="p-3 text-slate-300">{o.contactEmail}</td>
                <td className="p-3 text-slate-300">
                  {o.subscriptions[0]?.plan?.name ?? "—"}
                </td>
                <td className="p-3 text-slate-300">{o._count.stations}</td>
                <td className="p-3 text-slate-300">{o._count.members}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
