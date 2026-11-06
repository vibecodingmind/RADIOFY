"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  Receipt,
  HardDrive,
  Radio,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface PlanItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  maxStations: number;
  maxConcurrentListeners: number;
  maxStorageGb: number;
  maxBandwidthGb: number;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amountPaid: number;
  currency: string;
  status: string;
  paidAt: Date | string | null;
}

export function BillingClient({
  orgId,
  currentPlan,
  availablePlans,
  invoices,
  storageQuotaBytes,
  storageUsedBytes,
  maxStations,
  activeStationCount,
}: {
  orgId: string;
  currentPlan: PlanItem | null;
  availablePlans: PlanItem[];
  invoices: InvoiceItem[];
  storageQuotaBytes: string;
  storageUsedBytes: string;
  maxStations: number;
  activeStationCount: number;
}) {
  const [selectedGateway, setSelectedGateway] = useState<"STRIPE" | "PAYPAL" | "PESAPAL">("STRIPE");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoadingPlanId(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          gateway: selectedGateway,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate checkout");

      if (typeof data.redirectUrl === "string" && data.redirectUrl.startsWith("http")) {
        window.location.assign(data.redirectUrl);
        return;
      }

      setNotice(`Checkout session initiated via ${selectedGateway}. Order Ref: ${data.sessionId}`);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error initiating checkout");
    } finally {
      setLoadingPlanId(null);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded bg-surface-panel border border-border-focus text-primary-container text-xs flex items-center gap-2 shadow-photonic">
          <CheckCircle2 className="w-4 h-4 text-primary-container" />
          <span className="font-mono">{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-container" />
            <span>Subscription & Gateway Billing</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Modular multi-gateway subscription management with server-side webhook reconciliation
          </p>
        </div>

        {/* Gateway Picker */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-on-surface-variant uppercase font-mono text-[10px]">
            ACTIVE GATEWAY:
          </span>
          <div className="inline-flex p-0.5 rounded bg-surface-panel border border-border-subtle">
            {(["STRIPE", "PAYPAL", "PESAPAL"] as const).map((gw) => (
              <button
                key={gw}
                onClick={() => setSelectedGateway(gw)}
                className={`px-3 py-1 rounded font-mono font-semibold transition-colors ${
                  selectedGateway === gw
                    ? "bg-primary-container text-on-primary-container shadow-photonic"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {gw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity & Quotas Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>STATIONS CAPACITY</span>
            <Radio className="w-4 h-4 text-primary-container" />
          </div>
          <div className="text-2xl font-bold text-on-surface font-mono">
            {activeStationCount} / {maxStations}
          </div>
          <div className="text-[11px] text-tertiary">
            {maxStations - activeStationCount} Station Slots Available
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>STORAGE VAULT QUOTA</span>
            <HardDrive className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-2xl font-bold text-on-surface font-mono">
            {formatBytes(Number(storageUsedBytes))}
          </div>
          <div className="text-[11px] text-on-surface-variant">
            Limit: {formatBytes(Number(storageQuotaBytes))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>ACTIVE SUBSCRIPTION</span>
            <ShieldCheck className="w-4 h-4 text-tertiary-container" />
          </div>
          <div className="text-2xl font-bold text-on-surface font-mono">
            {currentPlan?.name || "Standard Broadcaster"}
          </div>
          <div className="text-[11px] text-tertiary font-mono">STATUS: ACTIVE & VERIFIED</div>
        </div>
      </div>

      {/* Plans Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
            Available Broadcast OS Plans
          </span>
          <div className="inline-flex p-0.5 rounded bg-surface-panel border border-border-subtle text-xs font-mono">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-3 py-0.5 rounded ${
                billingCycle === "MONTHLY"
                  ? "bg-surface-elevated text-primary font-bold"
                  : "text-on-surface-variant"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-3 py-0.5 rounded ${
                billingCycle === "ANNUAL"
                  ? "bg-surface-elevated text-primary font-bold"
                  : "text-on-surface-variant"
              }`}
            >
              ANNUAL (20% OFF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const price =
              billingCycle === "ANNUAL" ? plan.annualPriceUsd : plan.monthlyPriceUsd;

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-lg border flex flex-col justify-between space-y-5 transition-all ${
                  isCurrent
                    ? "bg-surface-elevated border-border-focus shadow-photonic"
                    : "bg-surface-panel border-border-subtle hover:border-on-surface-variant/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-on-surface">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-mono text-[9px] font-bold">
                        CURRENT PLAN
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-bold text-on-surface">${price}</span>
                    <span className="text-xs text-on-surface-variant">
                      /{billingCycle === "ANNUAL" ? "yr" : "mo"}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border-subtle text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-tertiary" />
                      <span>{plan.maxStations} Radio Stations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-tertiary" />
                      <span>{plan.maxConcurrentListeners.toLocaleString()} Peak Listeners</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-tertiary" />
                      <span>{plan.maxStorageGb} GB High-Speed Audio Vault</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-tertiary" />
                      <span>AutoDJ Cues & Dayparting</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    disabled={isCurrent || loadingPlanId === plan.id}
                    onClick={() => handleCheckout(plan.id)}
                    className={`w-full py-2 px-3 rounded font-semibold text-xs transition-all ${
                      isCurrent
                        ? "bg-surface-container text-on-surface-variant/50 cursor-default"
                        : "bg-primary-container hover:bg-primary text-on-primary-container shadow-photonic"
                    }`}
                  >
                    {isCurrent
                      ? "Active Subscription"
                      : loadingPlanId === plan.id
                      ? "Routing to Gateway..."
                      : `Upgrade via ${selectedGateway}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices History */}
      <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary-container" />
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
              Billing History & Tax Receipts
            </span>
          </div>
          <span className="text-xs font-mono text-on-surface-variant">
            {invoices.length} Invoices Recorded
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-4 text-center text-xs text-on-surface-variant">
            No previous billing receipts recorded for this organization.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/50 font-mono text-xs">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-on-surface">{inv.invoiceNumber}</div>
                  <div className="text-[10px] text-on-surface-variant">
                    Paid {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "Pending"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-on-surface">
                    ${inv.amountPaid.toFixed(2)} {inv.currency}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-[10px] font-bold">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
