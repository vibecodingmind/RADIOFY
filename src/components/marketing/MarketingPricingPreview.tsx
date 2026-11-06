import Link from "next/link";

export type PublicPlanPreview = {
  id: string;
  name: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  maxStations: number;
  maxConcurrentListeners: number;
};

export function MarketingPricingPreview({ plans }: { plans: PublicPlanPreview[] }) {
  const display = plans.slice(0, 3);
  if (display.length === 0) return null;
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold mb-2">Plans</h2>
      <p className="text-sm text-slate-400 mb-6">
        Prices come from your live plan catalog. See the full comparison on{" "}
        <Link href="/pricing" className="text-cyan-300 underline">
          Pricing
        </Link>
        .
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {display.map((p) => (
          <div key={p.id} className="rounded-lg border border-white/10 p-4 bg-white/5">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="mt-2 text-2xl font-semibold">
              ${p.monthlyPriceUsd.toFixed(0)}
              <span className="text-sm font-normal text-slate-400"> / mo</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ${p.annualPriceUsd.toFixed(0)} / yr
            </p>
            <ul className="mt-3 text-xs text-slate-300 space-y-1">
              <li>{p.maxStations} stations</li>
              <li>{p.maxConcurrentListeners} concurrent listeners</li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
