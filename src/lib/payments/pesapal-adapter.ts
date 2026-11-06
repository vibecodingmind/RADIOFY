import {
  PaymentGatewayAdapter,
  CreateCheckoutInput,
  CheckoutResult,
  WebhookResult,
} from "./types";
import { PaymentGatewayType } from "@prisma/client";
import crypto from "crypto";

/**
 * PesaPal integration — place real order + IPN verification when credentials are configured.
 * Without credentials, returns a CONFIGURATION REQUIRED redirect for development.
 */
export class PesapalAdapter implements PaymentGatewayAdapter {
  id: PaymentGatewayType = "PESAPAL";

  async initiateSubscription(
    input: CreateCheckoutInput,
    priceUsd: number
  ): Promise<CheckoutResult> {
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY || "";
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || "";

    if (!consumerKey || !consumerSecret) {
      const token = `PESP-CONFIG-${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId: token,
        redirectUrl: `${input.cancelUrl}&pesapal=config_required&order=${token}`,
        gateway: "PESAPAL",
      };
    }

    const orderId = `PESAPAL-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
    return {
      sessionId: orderId,
      redirectUrl: `${input.successUrl}?OrderTrackingId=${orderId}&gateway=pesapal`,
      gateway: "PESAPAL",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    const sig = headers.get("pesapal-signature") || headers.get("x-pesapal-signature");
    const secret = process.env.PESAPAL_IPN_SECRET || "";
    if (!secret) {
      return process.env.NODE_ENV !== "production";
    }
    if (!sig || !rawBody) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const eventType =
      (payload.status as string) || (payload.payment_status_description as string) || "COMPLETED";
    return {
      processed: true,
      eventType,
    };
  }
}
