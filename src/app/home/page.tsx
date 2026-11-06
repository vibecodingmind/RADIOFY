import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MarketingHomeHero } from "@/components/marketing/MarketingHomeHero";
import { MarketingFeatureStrip } from "@/components/marketing/MarketingFeatureStrip";
import { MarketingPricingPreview } from "@/components/marketing/MarketingPricingPreview";
import { MarketingFaqTeaser } from "@/components/marketing/MarketingFaqTeaser";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Radiofy — Internet radio hosting",
  description:
    "Host internet radio stations with a broadcaster console, AutoDJ, live ingest, and organization billing.",
};

export default async function MarketingHomePage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { monthlyPriceUsd: "asc" },
    take: 3,
    select: {
      id: true,
      name: true,
      monthlyPriceUsd: true,
      annualPriceUsd: true,
      maxStations: true,
      maxConcurrentListeners: true,
    },
  });

  return (
    <MarketingShell>
      <MarketingHomeHero />
      <MarketingFeatureStrip />
      <MarketingPricingPreview
        plans={plans.map((p) => ({
          ...p,
          monthlyPriceUsd: Number(p.monthlyPriceUsd),
          annualPriceUsd: Number(p.annualPriceUsd),
        }))}
      />
      <MarketingFaqTeaser />
    </MarketingShell>
  );
}
