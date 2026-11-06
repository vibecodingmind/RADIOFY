import { PaymentGatewayType } from "@prisma/client";

export interface CreateCheckoutInput {
  orgId: string;
  planId: string;
  billingCycle: "MONTHLY" | "ANNUAL";
  successUrl: string;
  cancelUrl: string;
  /** Billing contact (e.g. org contact email) for gateways that require it */
  customerEmail?: string;
}

export interface CheckoutResult {
  sessionId: string;
  redirectUrl: string;
  gateway: PaymentGatewayType;
}

export interface WebhookResult {
  processed: boolean;
  eventType: string;
  invoiceId?: string;
  subscriptionId?: string;
  error?: string;
  /** When verification succeeded and payload authorizes activation */
  activate?: {
    orgId: string;
    planId: string;
    gatewaySubId: string;
    amount: number;
    billingCycle?: "MONTHLY" | "ANNUAL";
    currency?: string;
  };
  /** PesaPal SubmitOrderRequest `id` — delete pending checkout row after activation */
  pesapalMerchantReference?: string;
  /** PesaPal IPN expects a JSON ack body (status 200 / 500); see https://developer.pesapal.com */
  ipnAck?: Record<string, unknown>;
}

export interface PaymentGatewayAdapter {
  id: PaymentGatewayType;
  initiateSubscription(input: CreateCheckoutInput, priceUsd: number): Promise<CheckoutResult>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<boolean>;
  processWebhook(payload: Record<string, unknown>): Promise<WebhookResult>;
}
