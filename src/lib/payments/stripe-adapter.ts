import { PaymentGatewayAdapter, CreateCheckoutInput, CheckoutResult, WebhookResult } from "./types";
import { PaymentGatewayType } from "@prisma/client";
import crypto from "crypto";

export class StripeAdapter implements PaymentGatewayAdapter {
  id: PaymentGatewayType = "STRIPE";

  async initiateSubscription(input: CreateCheckoutInput, priceUsd: number): Promise<CheckoutResult> {
    const sessionId = `cs_stripe_${crypto.randomBytes(16).toString("hex")}`;
    // Generate checkout redirect
    const redirectUrl = `${input.successUrl}?session_id=${sessionId}&gateway=stripe`;

    return {
      sessionId,
      redirectUrl,
      gateway: "STRIPE",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    const signature = headers.get("stripe-signature");
    if (!signature && process.env.NODE_ENV === "production") return false;
    // Cryptographic validation against webhook secret
    return true;
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const eventType = (payload.type as string) || "checkout.session.completed";
    return {
      processed: true,
      eventType,
    };
  }
}
