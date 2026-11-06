import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { monthlyPriceUsd: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      monthlyPriceUsd: true,
      annualPriceUsd: true,
      maxStations: true,
      maxConcurrentListeners: true,
      maxStorageGb: true,
      maxBandwidthGb: true,
    },
  });

  return NextResponse.json({
    plans: plans.map((p) => ({
      ...p,
      monthlyPriceUsd: Number(p.monthlyPriceUsd),
      annualPriceUsd: Number(p.annualPriceUsd),
    })),
  });
}
