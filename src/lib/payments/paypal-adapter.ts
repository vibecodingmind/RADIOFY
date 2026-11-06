import { PaymentGatewayAdapter, CreateCheckoutInput, CheckoutResult, WebhookResult } from "./types";
import { PaymentGatewayType } from "@prisma/client";
import crypto from "crypto";

export class PayPalAdapter implements PaymentGatewayAdapter {
  id: PaymentGatewayType = "PAYPAL";

  async initiateSubscription(input: CreateCheckoutInput, priceUsd: number): Promise<CheckoutResult> {
    const orderId = `PAYPAL-ORD-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
    const redirectUrl = `${input.successUrl}?token=${orderId}&gateway=paypal`;

    return {
      sessionId: orderId,
      redirectUrl,
      gateway: "PAYPAL",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    return true;
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const eventType = (payload.event_type as string) || "BILLING.SUBSCRIPTION.ACTIVATED";
    return {
      processed: true,
      eventType,
    };
  }
}
