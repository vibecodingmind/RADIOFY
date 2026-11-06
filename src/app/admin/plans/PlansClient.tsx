"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  maxStations: number;
  maxConcurrentListeners: number;
  maxStorageGb: number;
  maxBandwidthGb: number;
  isPublic: boolean;
  isActive: boolean;
};

export function PlansClient({ plans }: { plans: PlanRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    monthlyPriceUsd: 29,
    annualPriceUsd: 290,
    maxStations: 2,
    maxConcurrentListeners: 100,
    maxStorageGb: 10,
    maxBandwidthGb: 100,
    isPublic: true,
    isActive: true,
  });

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create plan");
      setForm({ ...form, name: "", slug: "", description: "" });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create plan");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(plan: PlanRow, field: "isActive" | "isPublic") {
    setError(null);
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !plan[field] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Subscription plans</h1>
        <p className="text-sm text-slate-400 mt-1">
          Public active plans appear on the marketing pricing page.
        </p>
      </div>

      <div className="overflow-x-auto border border-white/10 rounded">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="p-3">Plan</th>
              <th className="p-3">Monthly</th>
              <th className="p-3">Stations</th>
              <th className="p-3">Storage</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-xs text-slate-500">{plan.slug}</div>
                </td>
                <td className="p-3">${plan.monthlyPriceUsd}</td>
                <td className="p-3">{plan.maxStations}</td>
                <td className="p-3">{plan.maxStorageGb} GB</td>
                <td className="p-3 space-x-2">
                  <button type="button" className="underline" onClick={() => toggle(plan, "isActive")}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </button>
                  <button type="button" className="underline" onClick={() => toggle(plan, "isPublic")}>
                    {plan.isPublic ? "Public" : "Hidden"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={createPlan} className="grid sm:grid-cols-2 gap-3 border border-white/10 rounded p-4">
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2"
        />
        <input
          required
          placeholder="slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2"
        />
        <input
          type="number"
          value={form.monthlyPriceUsd}
          onChange={(e) => setForm({ ...form, monthlyPriceUsd: Number(e.target.value) })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2"
        />
        <input
          type="number"
          value={form.annualPriceUsd}
          onChange={(e) => setForm({ ...form, annualPriceUsd: Number(e.target.value) })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2"
        />
        <input
          type="number"
          value={form.maxStations}
          onChange={(e) => setForm({ ...form, maxStations: Number(e.target.value) })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2"
        />
        <input
          type="number"
          value={form.maxStorageGb}
          onChange={(e) => setForm({ ...form, maxStorageGb: Number(e.target.value) })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 bg-amber-300 text-slate-950 font-semibold rounded py-2"
        >
          {saving ? "Saving…" : "Create plan"}
        </button>
        {error ? <p className="sm:col-span-2 text-sm text-red-300">{error}</p> : null}
      </form>
    </div>
  );
}
