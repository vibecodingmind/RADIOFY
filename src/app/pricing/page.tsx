import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pricing — Radiofy",
  description: "Subscription plans stored in Radiofy.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { monthlyPriceUsd: "asc" },
  });

  return (
    <MarketingShell title="Pricing">
      {plans.length === 0 ? (
        <p className="text-slate-300">No public plans are configured yet.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-lg border border-white/10 p-5 bg-white/5">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {plan.description ? (
                <p className="text-sm text-slate-300 mt-2">{plan.description}</p>
              ) : null}
              <p className="mt-4 text-2xl font-semibold">
                ${Number(plan.monthlyPriceUsd).toFixed(0)}
                <span className="text-sm font-normal text-slate-400"> / month</span>
              </p>
              <p className="text-sm text-slate-400">
                ${Number(plan.annualPriceUsd).toFixed(0)} billed annually
              </p>
              <ul className="mt-4 text-sm text-slate-300 space-y-1">
                <li>{plan.maxStations} stations</li>
                <li>{plan.maxConcurrentListeners} concurrent listeners</li>
                <li>{plan.maxStorageGb} GB storage</li>
                <li>{plan.maxBandwidthGb} GB bandwidth</li>
              </ul>
              <Link
                href="/register"
                className="inline-block mt-5 text-sm font-semibold text-cyan-300"
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      )}
    </MarketingShell>
  );
}
