import {
  PaymentGatewayAdapter,
  CreateCheckoutInput,
  CheckoutResult,
  WebhookResult,
} from "./types";
import { PaymentGatewayType } from "@prisma/client";
import crypto from "crypto";

type PaypalTokenResponse = { access_token: string };

function paypalBaseUrl(): string {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function basicAuthHeader(): string {
  const id = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

async function getPayPalAccessToken(): Promise<string | null> {
  const url = `${paypalBaseUrl()}/v1/oauth2/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as PaypalTokenResponse;
  return data.access_token || null;
}

/** Encode org + plan for PayPal custom_id (max 127 chars). */
function encodeCustomId(
  orgId: string,
  planId: string,
  billingCycle: "MONTHLY" | "ANNUAL"
): string {
  return `${orgId}|${planId}|${billingCycle}`;
}

function decodeCustomId(
  customId: string | undefined
): { orgId: string; planId: string; billingCycle: "MONTHLY" | "ANNUAL" } | null {
  if (!customId) return null;
  const parts = customId.split("|");
  if (parts.length < 2) return null;
  const orgId = parts[0];
  const planId = parts[1];
  const cycle =
    parts[2] === "ANNUAL" || parts[2] === "MONTHLY" ? parts[2] : "MONTHLY";
  if (!orgId || !planId) return null;
  return { orgId, planId, billingCycle: cycle };
}

function moneyValue(amountUsd: number): string {
  return amountUsd.toFixed(2);
}

/**
 * Create a catalog product, billing plan, and subscription; return approval URL.
 * Optional PAYPAL_PLAN_MONTHLY_ID / PAYPAL_PLAN_ANNUAL_ID skip plan creation when set.
 */
async function createSubscriptionCheckout(
  accessToken: string,
  input: CreateCheckoutInput,
  priceUsd: number
): Promise<CheckoutResult | null> {
  const base = paypalBaseUrl();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const billingCycle = input.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const envPlanId =
    billingCycle === "ANNUAL"
      ? process.env.PAYPAL_PLAN_ANNUAL_ID || ""
      : process.env.PAYPAL_PLAN_MONTHLY_ID || "";

  let planId = envPlanId;

  if (!planId) {
    const productRes = await fetch(`${base}/v1/catalogs/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `Radiofy ${billingCycle.toLowerCase()} (${input.planId.slice(0, 8)})`,
        type: "SERVICE",
      }),
    });
    if (!productRes.ok) return null;
    const product = (await productRes.json()) as { id: string };

    const intervalUnit = billingCycle === "ANNUAL" ? "YEAR" : "MONTH";
    const planRes = await fetch(`${base}/v1/billing/plans`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        product_id: product.id,
        name: `Radiofy plan ${billingCycle}`,
        billing_cycles: [
          {
            frequency: { interval_unit: intervalUnit, interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: moneyValue(priceUsd),
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });
    if (!planRes.ok) return null;
    const plan = (await planRes.json()) as { id: string };
    planId = plan.id;
  }

  const billing = input.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const customId = encodeCustomId(input.orgId, input.planId, billing);
  const subRes = await fetch(`${base}/v1/billing/subscriptions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: "Radiofy",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });

  if (!subRes.ok) return null;
  const sub = (await subRes.json()) as {
    id: string;
    links?: { href: string; rel: string; method?: string }[];
  };

  const approve = sub.links?.find((l) => l.rel === "approve" && l.href);
  if (!approve?.href) return null;

  return {
    sessionId: sub.id,
    redirectUrl: approve.href,
    gateway: "PAYPAL",
  };
}

export class PayPalAdapter implements PaymentGatewayAdapter {
  id: PaymentGatewayType = "PAYPAL";

  async initiateSubscription(
    input: CreateCheckoutInput,
    priceUsd: number
  ): Promise<CheckoutResult> {
    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      const orderId = `PAYPAL-CONFIG-${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId: orderId,
        redirectUrl: `${input.cancelUrl}&paypal=config_required&token=${orderId}`,
        gateway: "PAYPAL",
      };
    }

    const token = await getPayPalAccessToken();
    if (!token) {
      const orderId = `PAYPAL-AUTH-${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId: orderId,
        redirectUrl: `${input.cancelUrl}&paypal=token_failed&token=${orderId}`,
        gateway: "PAYPAL",
      };
    }

    const checkout = await createSubscriptionCheckout(token, input, priceUsd);
    if (checkout) return checkout;

    const orderId = `PAYPAL-ERR-${crypto.randomBytes(8).toString("hex")}`;
    return {
      sessionId: orderId,
      redirectUrl: `${input.cancelUrl}&paypal=checkout_failed&token=${orderId}`,
      gateway: "PAYPAL",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || "";
    if (!webhookId) {
      return process.env.NODE_ENV !== "production";
    }

    const transmissionId = headers.get("paypal-transmission-id");
    const transmissionTime = headers.get("paypal-transmission-time");
    const certUrl = headers.get("paypal-cert-url");
    const authAlgo = headers.get("paypal-auth-algo");
    const transmissionSig = headers.get("paypal-transmission-sig");

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !rawBody) {
      return false;
    }

    let webhookEvent: Record<string, unknown>;
    try {
      webhookEvent = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return false;
    }

    const token = await getPayPalAccessToken();
    if (!token) return false;

    const verifyRes = await fetch(`${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    });

    if (!verifyRes.ok) return false;
    const verdict = (await verifyRes.json()) as { verification_status?: string };
    return verdict.verification_status === "SUCCESS";
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const eventType = (payload.event_type as string) || "UNKNOWN";

    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const resource = payload.resource as Record<string, unknown> | undefined;
      const subId = typeof resource?.id === "string" ? resource.id : null;
      const customId = typeof resource?.custom_id === "string" ? resource.custom_id : undefined;

      const decoded = decodeCustomId(customId);
      if (!subId || !decoded) {
        return {
          processed: false,
          eventType,
          error: "Missing subscription id or custom_id (org|plan|cycle)",
        };
      }

      let amount = 0;
      const billingInfo = resource?.billing_info as Record<string, unknown> | undefined;
      const lastPayment = billingInfo?.last_payment as Record<string, unknown> | undefined;
      const amtObj = lastPayment?.amount as Record<string, unknown> | undefined;
      if (amtObj?.value != null) {
        amount = Number(amtObj.value);
      }

      return {
        processed: true,
        eventType,
        subscriptionId: subId,
        activate: {
          orgId: decoded.orgId,
          planId: decoded.planId,
          gatewaySubId: subId,
          amount,
          billingCycle: decoded.billingCycle,
        },
      };
    }

    return {
      processed: true,
      eventType,
    };
  }
}
