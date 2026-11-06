import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/payment-service";
import { PaymentGatewayType } from "@prisma/client";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const gateway = (searchParams.get("gateway")?.toUpperCase() as PaymentGatewayType) || "STRIPE";

  try {
    const rawBody = await req.text();
    const payload = rawBody ? JSON.parse(rawBody) : {};

    const adapter = PaymentService.getAdapter(gateway);
    const isValid = await adapter.verifyWebhook(req.headers, rawBody);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
    }

    const result = await adapter.processWebhook(payload);

    // If test or simulated event:
    if (payload.orgId && payload.planId) {
      await PaymentService.activateSubscriptionFromWebhook(
        payload.orgId,
        payload.planId,
        gateway,
        payload.gatewaySubId || `sub_${Date.now()}`,
        payload.amount || 79.0
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
