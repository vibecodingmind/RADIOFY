import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPriceUsd: "asc" },
  });

  return NextResponse.json({ plans });
}
