import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

function assertPlanAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN" || role === "BILLING_ADMIN";
}

const planSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  description: z.string().max(400).optional(),
  monthlyPriceUsd: z.number().min(0),
  annualPriceUsd: z.number().min(0),
  maxStations: z.number().int().min(1).max(500),
  maxConcurrentListeners: z.number().int().min(1),
  maxStorageGb: z.number().int().min(1),
  maxBandwidthGb: z.number().int().min(1),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || !assertPlanAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { monthlyPriceUsd: "asc" } });
  return NextResponse.json({
    plans: plans.map((p) => ({
      ...p,
      monthlyPriceUsd: Number(p.monthlyPriceUsd),
      annualPriceUsd: Number(p.annualPriceUsd),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !assertPlanAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = planSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid plan" }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "plan.create",
      resourceType: "SubscriptionPlan",
      resourceId: plan.id,
      metadata: JSON.stringify({ slug: plan.slug }),
    },
  });

  return NextResponse.json({ id: plan.id });
}
