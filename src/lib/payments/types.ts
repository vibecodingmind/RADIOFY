import { PaymentGatewayType } from "@prisma/client";

export interface CreateCheckoutInput {
  orgId: string;
  planId: string;
  billingCycle: "MONTHLY" | "ANNUAL";
  successUrl: string;
  cancelUrl: string;
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
}

export interface PaymentGatewayAdapter {
  id: PaymentGatewayType;
  initiateSubscription(input: CreateCheckoutInput, priceUsd: number): Promise<CheckoutResult>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<boolean>;
  processWebhook(payload: Record<string, unknown>): Promise<WebhookResult>;
}
