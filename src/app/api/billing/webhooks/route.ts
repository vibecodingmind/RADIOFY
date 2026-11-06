import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/payment-service";
import { PaymentGatewayType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function webhookEventId(
  gateway: PaymentGatewayType,
  payload: Record<string, unknown>
): string | null {
  if (gateway === "STRIPE" && typeof payload.id === "string") {
    return payload.id;
  }
  if (gateway === "PAYPAL" && typeof payload.id === "string") {
    return payload.id;
  }
  if (gateway === "PESAPAL") {
    const t =
      (payload.OrderTrackingId as string) ||
      (payload.order_tracking_id as string) ||
      (payload.merchant_reference as string);
    return t || null;
  }
  return null;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const gateway =
    (searchParams.get("gateway")?.toUpperCase() as PaymentGatewayType) || "STRIPE";

  try {
    const rawBody = await req.text();
    const payload: Record<string, unknown> = rawBody ? JSON.parse(rawBody) : {};

    const adapter = PaymentService.getAdapter(gateway);
    const isValid = await adapter.verifyWebhook(req.headers, rawBody);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
    }

    const eventId = webhookEventId(gateway, payload);
    if (eventId) {
      const existing = await prisma.processedPaymentWebhook.findUnique({
        where: {
          gateway_eventId: { gateway, eventId },
        },
      });
      if (existing) {
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    const result = await adapter.processWebhook(payload);

    if (result.activate) {
      const { orgId, planId, gatewaySubId, amount } = result.activate;
      await PaymentService.activateSubscriptionFromWebhook(
        orgId,
        planId,
        gateway,
        gatewaySubId,
        amount
      );
    }

    if (eventId) {
      try {
        await prisma.processedPaymentWebhook.create({
          data: { gateway, eventId },
        });
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return NextResponse.json({ success: true, duplicate: true });
        }
        throw e;
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
