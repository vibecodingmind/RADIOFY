import { PaymentGatewayAdapter, CreateCheckoutInput, CheckoutResult } from "./types";
import { StripeAdapter } from "./stripe-adapter";
import { PayPalAdapter } from "./paypal-adapter";
import { PesapalAdapter } from "./pesapal-adapter";
import { PaymentGatewayType } from "@prisma/client";
import { prisma } from "../prisma";

export class PaymentService {
  private static adapters: Record<PaymentGatewayType, PaymentGatewayAdapter> = {
    STRIPE: new StripeAdapter(),
    PAYPAL: new PayPalAdapter(),
    PESAPAL: new PesapalAdapter(),
  };

  static getAdapter(gateway: PaymentGatewayType): PaymentGatewayAdapter {
    const adapter = this.adapters[gateway];
    if (!adapter) throw new Error(`Unsupported payment gateway: ${gateway}`);
    return adapter;
  }

  static async initiateCheckout(
    gateway: PaymentGatewayType,
    input: CreateCheckoutInput
  ): Promise<CheckoutResult> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: input.planId },
    });

    if (!plan || !plan.isActive) throw new Error("Subscription plan not found or inactive");

    const price =
      input.billingCycle === "ANNUAL"
        ? Number(plan.annualPriceUsd)
        : Number(plan.monthlyPriceUsd);

    const adapter = this.getAdapter(gateway);
    return adapter.initiateSubscription(input, price);
  }

  /**
   * Verified server-side confirmation: Activates subscription only after trusted gateway webhook
   */
  static async activateSubscriptionFromWebhook(
    orgId: string,
    planId: string,
    gateway: PaymentGatewayType,
    gatewaySubId: string,
    amount: number
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new Error("Plan not found");

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      // 1. Create or update subscription
      const sub = await tx.subscription.upsert({
        where: { id: `sub_${orgId}` },
        create: {
          id: `sub_${orgId}`,
          orgId,
          planId,
          status: "ACTIVE",
          billingCycle: "MONTHLY",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          paymentGateway: gateway,
          gatewaySubId,
        },
        update: {
          planId,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          paymentGateway: gateway,
          gatewaySubId,
        },
      });

      // 2. Update organization quotas from new plan
      await tx.organization.update({
        where: { id: orgId },
        data: {
          maxStations: plan.maxStations,
          storageQuotaBytes: BigInt(plan.maxStorageGb) * 1024n * 1024n * 1024n,
          maxBandwidthBytes: BigInt(plan.maxBandwidthGb) * 1024n * 1024n * 1024n,
        },
      });

      // 3. Create paid invoice record
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
      const invoice = await tx.invoice.create({
        data: {
          orgId,
          subscriptionId: sub.id,
          invoiceNumber,
          amountDue: amount,
          amountPaid: amount,
          currency: "USD",
          status: "PAID",
          paidAt: now,
          dueDate: now,
          paymentMethod: gateway,
        },
      });

      // 4. Create transaction
      await tx.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          orgId,
          gateway,
          transactionRef: gatewaySubId,
          amount,
          currency: "USD",
          status: "SUCCESS",
        },
      });

      return sub;
    });
  }
}
