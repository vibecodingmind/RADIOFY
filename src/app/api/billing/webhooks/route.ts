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
      (payload.orderTrackingId as string);
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
        if (gateway === "PESAPAL") {
          const orderTrackingId =
            (payload.OrderTrackingId as string) ||
            (payload.order_tracking_id as string) ||
            (payload.orderTrackingId as string) ||
            eventId;
          return NextResponse.json({
            orderNotificationType: "IPNCHANGE",
            orderTrackingId,
            status: 200,
          });
        }
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    const result = await adapter.processWebhook(payload);

    if (result.activate) {
      const a = result.activate;
      await PaymentService.activateSubscriptionFromWebhook(
        a.orgId,
        a.planId,
        gateway,
        a.gatewaySubId,
        a.amount,
        a.billingCycle ?? "MONTHLY",
        a.currency ?? "USD"
      );
      if (gateway === "PESAPAL" && result.pesapalMerchantReference) {
        await prisma.pesapalPendingCheckout
          .deleteMany({ where: { merchantReference: result.pesapalMerchantReference } })
          .catch(() => undefined);
      }
    }

    if (eventId) {
      try {
        await prisma.processedPaymentWebhook.create({
          data: { gateway, eventId },
        });
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          if (gateway === "PESAPAL") {
            const orderTrackingId =
              (payload.OrderTrackingId as string) ||
              (payload.order_tracking_id as string) ||
              (payload.orderTrackingId as string) ||
              eventId;
            const ack =
              result.ipnAck ||
              ({
                orderNotificationType: "IPNCHANGE",
                orderTrackingId,
                status: 200,
              } as Record<string, unknown>);
            return NextResponse.json(ack);
          }
          return NextResponse.json({ success: true, duplicate: true });
        }
        throw e;
      }
    }

    if (gateway === "PESAPAL" && result.ipnAck) {
      return NextResponse.json(result.ipnAck);
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
