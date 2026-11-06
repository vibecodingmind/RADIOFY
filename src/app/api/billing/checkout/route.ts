import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { PaymentService } from "@/lib/payments/payment-service";
import { PaymentGatewayType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const canManageBilling = AuthorizationService.can(session.user, "MANAGE_BILLING", {
    membership: session.activeMembership
      ? { orgId, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canManageBilling && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { planId, gateway, billingCycle } = body;

  if (!planId || !gateway) {
    return NextResponse.json({ error: "Plan ID and Gateway are required" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const checkout = await PaymentService.initiateCheckout(gateway as PaymentGatewayType, {
      orgId,
      planId,
      billingCycle: billingCycle || "MONTHLY",
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl: `${appUrl}/billing?canceled=true`,
    });

    return NextResponse.json({ success: true, ...checkout });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initiate checkout";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
