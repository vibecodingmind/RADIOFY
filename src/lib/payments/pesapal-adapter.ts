import {
  PaymentGatewayAdapter,
  CreateCheckoutInput,
  CheckoutResult,
  WebhookResult,
} from "./types";
import { PaymentGatewayType, BillingCycle } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

type TokenResponse = { token?: string; error?: unknown };

type SubmitOrderResponse = {
  order_tracking_id?: string;
  redirect_url?: string;
  error?: unknown;
};

type TransactionStatusResponse = {
  payment_status_description?: string;
  merchant_reference?: string;
  amount?: number;
  currency?: string;
  status?: string;
  status_code?: number;
  message?: string;
};

function pesapalBaseUrl(): string {
  const env = (process.env.PESAPAL_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "live"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";
}

function merchantReference(): string {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `RF-${raw}`;
}

async function getAccessToken(): Promise<string | null> {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY || "";
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || "";
  const url = `${pesapalBaseUrl()}/api/Auth/RequestToken`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as TokenResponse;
  return typeof data.token === "string" ? data.token : null;
}

async function getTransactionStatus(
  token: string,
  orderTrackingId: string
): Promise<TransactionStatusResponse | null> {
  const url = new URL(`${pesapalBaseUrl()}/api/Transactions/GetTransactionStatus`);
  url.searchParams.set("orderTrackingId", orderTrackingId);
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as TransactionStatusResponse;
}

/**
 * PesaPal API 3.0: token → SubmitOrderRequest → redirect; IPN/callback triggers GetTransactionStatus.
 * @see https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/
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

    const notificationId = process.env.PESAPAL_NOTIFICATION_ID || "";
    if (!notificationId) {
      const token = `PESP-NOTIF-${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId: token,
        redirectUrl: `${input.cancelUrl}&pesapal=notification_id_required&order=${token}`,
        gateway: "PESAPAL",
      };
    }

    const email = input.customerEmail?.trim();
    if (!email) {
      throw new Error("Organization contact email is required for PesaPal checkout");
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      const token = `PESP-AUTH-${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId: token,
        redirectUrl: `${input.cancelUrl}&pesapal=auth_failed&order=${token}`,
        gateway: "PESAPAL",
      };
    }

    const merchantRef = merchantReference();
    const currency = (process.env.PESAPAL_CURRENCY || "USD").toUpperCase();
    const billingCycle: BillingCycle = input.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";

    await prisma.pesapalPendingCheckout.upsert({
      where: { merchantReference: merchantRef },
      create: {
        merchantReference: merchantRef,
        orgId: input.orgId,
        planId: input.planId,
        billingCycle,
        amount: priceUsd,
        currency,
      },
      update: {
        planId: input.planId,
        billingCycle,
        amount: priceUsd,
        currency,
      },
    });

    const submitUrl = `${pesapalBaseUrl()}/api/Transactions/SubmitOrderRequest`;
    const description =
      `Radiofy ${input.billingCycle === "ANNUAL" ? "annual" : "monthly"} subscription`.slice(0, 100);

    const body = {
      id: merchantRef,
      currency,
      amount: priceUsd,
      description,
      callback_url: input.successUrl,
      cancellation_url: input.cancelUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: email,
        country_code: (process.env.PESAPAL_COUNTRY_CODE || "US").toUpperCase(),
      },
    };

    const res = await fetch(submitUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as SubmitOrderResponse;
    const redirect = data.redirect_url;
    const trackingId = data.order_tracking_id;

    if (!res.ok || !redirect) {
      await prisma.pesapalPendingCheckout.deleteMany({ where: { merchantReference: merchantRef } });
      const token = `PESP-SUBMIT-${crypto.randomBytes(8).toString("hex")}`;
      return {
        sessionId: token,
        redirectUrl: `${input.cancelUrl}&pesapal=submit_failed&order=${token}`,
        gateway: "PESAPAL",
      };
    }

    return {
      sessionId: trackingId || merchantRef,
      redirectUrl: redirect,
      gateway: "PESAPAL",
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    const secret = process.env.PESAPAL_IPN_SECRET || "";
    const sig = headers.get("pesapal-signature") || headers.get("x-pesapal-signature");

    if (secret && sig) {
      if (!rawBody) return false;
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      return false;
    }

    const trackingId =
      (typeof parsed.OrderTrackingId === "string" && parsed.OrderTrackingId) ||
      (typeof parsed.orderTrackingId === "string" && parsed.orderTrackingId) ||
      (typeof parsed.order_tracking_id === "string" && parsed.order_tracking_id);

    if (!trackingId) return false;

    if (process.env.NODE_ENV === "production" && !secret) {
      console.warn(
        "PesaPal IPN: PESAPAL_IPN_SECRET not set; relying on GetTransactionStatus server-side verification only"
      );
    }

    return true;
  }

  async processWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const orderTrackingId =
      (payload.OrderTrackingId as string) ||
      (payload.orderTrackingId as string) ||
      (payload.order_tracking_id as string) ||
      "";

    const notificationType =
      (payload.OrderNotificationType as string) ||
      (payload.orderNotificationType as string) ||
      "";

    const ipnAckBase = {
      orderNotificationType: notificationType || "IPNCHANGE",
      orderTrackingId,
      status: 200 as const,
    };

    if (!orderTrackingId) {
      return {
        processed: false,
        eventType: "INVALID_IPN",
        error: "Missing OrderTrackingId",
        ipnAck: { ...ipnAckBase, status: 500 },
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        processed: false,
        eventType: "TOKEN_FAILED",
        error: "Could not get PesaPal access token",
        ipnAck: { ...ipnAckBase, status: 500 },
      };
    }

    const status = await getTransactionStatus(token, orderTrackingId);
    if (!status) {
      return {
        processed: false,
        eventType: "STATUS_FAILED",
        error: "GetTransactionStatus failed",
        ipnAck: { ...ipnAckBase, status: 500 },
      };
    }

    const payStatus = (status.payment_status_description || "").toUpperCase();
    const eventType = payStatus || "UNKNOWN";

    if (payStatus !== "COMPLETED") {
      return {
        processed: true,
        eventType,
        ipnAck: ipnAckBase,
      };
    }

    const merchantRef = status.merchant_reference || "";
    if (!merchantRef) {
      return {
        processed: false,
        eventType,
        error: "Missing merchant_reference on transaction status",
        ipnAck: { ...ipnAckBase, status: 500 },
      };
    }

    const pending = await prisma.pesapalPendingCheckout.findUnique({
      where: { merchantReference: merchantRef },
    });

    if (!pending) {
      return {
        processed: false,
        eventType,
        error: "No pending checkout for merchant reference",
        ipnAck: { ...ipnAckBase, status: 500 },
      };
    }

    const amount = typeof status.amount === "number" ? status.amount : Number(pending.amount);

    return {
      processed: true,
      eventType: "COMPLETED",
      subscriptionId: orderTrackingId,
      activate: {
        orgId: pending.orgId,
        planId: pending.planId,
        gatewaySubId: orderTrackingId,
        amount,
        billingCycle: pending.billingCycle,
        currency: pending.currency || status.currency || "USD",
      },
      pesapalMerchantReference: merchantRef,
      ipnAck: ipnAckBase,
    };
  }
}
