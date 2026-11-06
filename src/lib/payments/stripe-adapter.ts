import {
  PaymentGatewayAdapter,
  CreateCheckoutInput,
  CheckoutResult,
  WebhookResult,
} from "./types";
import { PaymentGatewayType } from "@prisma/client";
import crypto from "crypto";
import Stripe from "stripe";

export class StripeAdapter implements PaymentGatewayAdapter {
  id: PaymentGatewayType = "STRIPE";

  private getClient(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key);
  }

  async initiateSubscription(
    input: CreateCheckoutInput,
    priceUsd: number
  ): Promise<CheckoutResult> {
    const client = this.getClient();
    if (!client) {
      const sessionId = `cs_stripe_config_${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId,
        redirectUrl: `${input.cancelUrl}&stripe=config_required&session=${sessionId}`,
        gateway: "STRIPE",
      };
    }

    const unitAmount = Math.round(priceUsd * 100);
    const interval = input.billingCycle === "ANNUAL" ? "year" : "month";

    const session = await client.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Radiofy plan (${input.planId.slice(0, 8)}…)`,
            },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orgId: input.orgId,
        planId: input.planId,
        billingCycle: input.billingCycle,
      },
      subscription_data: {
        metadata: {
          orgId: input.orgId,
          planId: input.planId,
          billingCycle: input.billingCycle,
        },
      },
      success_url: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}&gateway=stripe`,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      sessionId: session.id,
      redirectUrl: session.url,
      gateway: "STRIPE",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return process.env.NODE_ENV !== "production";
    }
    const sig = headers.get("stripe-signature");
    if (!sig) return false;
    try {
      const client = this.getClient();
      if (!client) return false;
      Stripe.webhooks.constructEvent(rawBody, sig, secret);
      return true;
    } catch {
      return false;
    }
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const event = payload as unknown as Stripe.Event;
    const type = event.type || "";

    if (type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session || session.mode !== "subscription") {
        return { processed: true, eventType: type };
      }

      const meta = session.metadata || {};
      const orgId = meta.orgId;
      const planId = meta.planId;
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription && typeof session.subscription === "object"
            ? (session.subscription as Stripe.Subscription).id
            : null;

      if (!orgId || !planId || !subId) {
        return {
          processed: false,
          eventType: type,
          error: "Missing orgId, planId, or subscription on session",
        };
      }

      const amountUsd =
        session.amount_total != null ? Number(session.amount_total) / 100 : 0;

      return {
        processed: true,
        eventType: type,
        subscriptionId: subId,
        activate: {
          orgId,
          planId,
          gatewaySubId: subId,
          amount: amountUsd,
        },
      };
    }

    return {
      processed: true,
      eventType: type || "unknown",
    };
  }
}
