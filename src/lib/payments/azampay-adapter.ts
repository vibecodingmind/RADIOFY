import { PaymentGatewayAdapter, CreateCheckoutInput, CheckoutResult, WebhookResult } from "./types";
import { PaymentGatewayType } from "@prisma/client";
import crypto from "crypto";

export class AzamPayAdapter implements PaymentGatewayAdapter {
  id: PaymentGatewayType = "AZAMPAY";

  async initiateSubscription(input: CreateCheckoutInput, priceUsd: number): Promise<CheckoutResult> {
    const ref = `AZAM-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    const redirectUrl = `${input.successUrl}?reference=${ref}&gateway=azampay`;

    return {
      sessionId: ref,
      redirectUrl,
      gateway: "AZAMPAY",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    return true;
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    return {
      processed: true,
      eventType: "azampay.checkout.success",
    };
  }
}
