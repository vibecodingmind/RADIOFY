import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(400).nullable().optional(),
  monthlyPriceUsd: z.number().min(0).optional(),
  annualPriceUsd: z.number().min(0).optional(),
  maxStations: z.number().int().min(1).max(500).optional(),
  maxConcurrentListeners: z.number().int().min(1).optional(),
  maxStorageGb: z.number().int().min(1).optional(),
  maxBandwidthGb: z.number().int().min(1).optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "BILLING_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid plan" }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "plan.update",
      resourceType: "SubscriptionPlan",
      resourceId: plan.id,
      metadata: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json({ id: plan.id });
}
