"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface GatewayConfig {
  id: string;
  gateway: "STRIPE" | "PAYPAL" | "AZAMPAY";
  isEnabled: boolean;
  isLiveMode: boolean;
  configJson: string;
}

interface GatewaysClientProps {
  initialConfigs: GatewayConfig[];
}

export function GatewaysClient({ initialConfigs }: GatewaysClientProps) {
  const [configs, setConfigs] = useState<GatewayConfig[]>(initialConfigs);
  const [copiedGateway, setCopiedGateway] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [savingGateway, setSavingGateway] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ gateway: string; message: string; isError?: boolean } | null>(null);

  // Form states parsed from configJson
  const getConfigFor = (gw: "STRIPE" | "PAYPAL" | "AZAMPAY") => {
    const found = configs.find((c) => c.gateway === gw);
    try {
      return {
        isEnabled: found?.isEnabled ?? (gw === "STRIPE"),
        isLiveMode: found?.isLiveMode ?? false,
        config: found?.configJson ? JSON.parse(found.configJson) : {},
      };
    } catch {
      return { isEnabled: false, isLiveMode: false, config: {} };
    }
  };

  const [formState, setFormState] = useState({
    STRIPE: getConfigFor("STRIPE"),
    PAYPAL: getConfigFor("PAYPAL"),
    AZAMPAY: getConfigFor("AZAMPAY"),
  });

  const handleCopyWebhook = (gw: string) => {
    const url = `${window.location.origin}/api/billing/webhooks?gateway=${gw}`;
    navigator.clipboard.writeText(url);
    setCopiedGateway(gw);
    setTimeout(() => setCopiedGateway(null), 2500);
  };

  const handleSaveGateway = async (gateway: "STRIPE" | "PAYPAL" | "AZAMPAY") => {
    setSavingGateway(gateway);
    setStatusMessage(null);

    const data = formState[gateway];

    try {
      const res = await fetch("/api/admin/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway,
          isEnabled: data.isEnabled,
          isLiveMode: data.isLiveMode,
          config: data.config,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save configuration");

      setStatusMessage({
        gateway,
        message: `${gateway} credentials and routing successfully saved and active.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        gateway,
        message: err.message,
        isError: true,
      });
    } finally {
      setSavingGateway(null);
    }
  };

  return (
    <div className="p-8 max-w-[1500px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 rounded-lg bg-[#111622] border border-[#1E293B] text-slate-400 hover:text-white transition"
              title="Back to Cockpit"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#00E5FF]" />
              Multi-Gateway Payment Orchestration
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Configure secure API credentials, webhook endpoints, and sandbox/production modes for international and mobile money gateways.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111622] border border-[#1E293B] text-xs text-slate-400">
          <Shield className="w-4 h-4 text-[#00FF66]" />
          <span>Server-Side Signature Verification Enforced</span>
        </div>
      </div>

      {/* Grid of Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gateway 1: Stripe */}
        <div className="bg-[#111622] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#635BFF]/10 border border-[#635BFF]/20 flex items-center justify-center font-bold text-sm text-[#635BFF]">
                  S
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Stripe</h3>
                  <span className="text-[11px] text-slate-400">Credit Card, Apple Pay & SEPA</span>
                </div>
              </div>

              {/* Enabled toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.STRIPE.isEnabled}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      STRIPE: { ...formState.STRIPE, isEnabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#0B0E14] border border-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E5FF]"></div>
              </label>
            </div>

            {/* Live / Test Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg border border-[#1E293B] mb-5 text-xs">
              <span className="text-slate-300 font-semibold">Environment Mode</span>
              <button
                type="button"
                onClick={() =>
                  setFormState({
                    ...formState,
                    STRIPE: { ...formState.STRIPE, isLiveMode: !formState.STRIPE.isLiveMode },
                  })
                }
                className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider font-mono uppercase transition ${
                  formState.STRIPE.isLiveMode
                    ? "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}
              >
                {formState.STRIPE.isLiveMode ? "LIVE PRODUCTION" : "TEST / SANDBOX"}
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  placeholder="pk_test_..."
                  value={formState.STRIPE.config.publishableKey || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      STRIPE: {
                        ...formState.STRIPE,
                        config: { ...formState.STRIPE.config, publishableKey: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Secret Key
                </label>
                <input
                  type={showSecrets.stripe ? "text" : "password"}
                  placeholder="sk_test_..."
                  value={formState.STRIPE.config.secretKey || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      STRIPE: {
                        ...formState.STRIPE,
                        config: { ...formState.STRIPE.config, secretKey: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Webhook Signing Secret
                </label>
                <input
                  type={showSecrets.stripe ? "text" : "password"}
                  placeholder="whsec_..."
                  value={formState.STRIPE.config.webhookSecret || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      STRIPE: {
                        ...formState.STRIPE,
                        config: { ...formState.STRIPE.config, webhookSecret: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              {/* Webhook Endpoint copy */}
              <div className="pt-2">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Stripe Webhook Target URL:
                </span>
                <div className="flex items-center gap-1.5 p-2 bg-[#0B0E14] rounded border border-[#1E293B]">
                  <span className="text-[10px] font-mono text-slate-400 truncate flex-1">
                    .../api/billing/webhooks?gateway=STRIPE
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyWebhook("STRIPE")}
                    className="p-1 hover:text-[#00E5FF] transition text-slate-400"
                    title="Copy full URL"
                  >
                    {copiedGateway === "STRIPE" ? (
                      <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#1E293B]">
            {statusMessage?.gateway === "STRIPE" && (
              <div
                className={`mb-3 p-2 rounded text-xs flex items-center gap-2 ${
                  statusMessage.isError
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusMessage.message}
              </div>
            )}

            <button
              disabled={savingGateway === "STRIPE"}
              onClick={() => handleSaveGateway("STRIPE")}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold text-xs rounded transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingGateway === "STRIPE" ? "Saving..." : "Save Stripe Configuration"}
            </button>
          </div>
        </div>

        {/* Gateway 2: PayPal */}
        <div className="bg-[#111622] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#003087]/20 border border-[#003087]/40 flex items-center justify-center font-bold text-sm text-[#0079C1]">
                  P
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">PayPal</h3>
                  <span className="text-[11px] text-slate-400">PayPal Wallet & Recurring Subscriptions</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.PAYPAL.isEnabled}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      PAYPAL: { ...formState.PAYPAL, isEnabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#0B0E14] border border-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E5FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg border border-[#1E293B] mb-5 text-xs">
              <span className="text-slate-300 font-semibold">Environment Mode</span>
              <button
                type="button"
                onClick={() =>
                  setFormState({
                    ...formState,
                    PAYPAL: { ...formState.PAYPAL, isLiveMode: !formState.PAYPAL.isLiveMode },
                  })
                }
                className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider font-mono uppercase transition ${
                  formState.PAYPAL.isLiveMode
                    ? "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}
              >
                {formState.PAYPAL.isLiveMode ? "LIVE PRODUCTION" : "TEST / SANDBOX"}
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  placeholder="AQ_..."
                  value={formState.PAYPAL.config.clientId || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      PAYPAL: {
                        ...formState.PAYPAL,
                        config: { ...formState.PAYPAL.config, clientId: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Client Secret
                </label>
                <input
                  type={showSecrets.paypal ? "text" : "password"}
                  placeholder="EL_..."
                  value={formState.PAYPAL.config.clientSecret || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      PAYPAL: {
                        ...formState.PAYPAL,
                        config: { ...formState.PAYPAL.config, clientSecret: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Webhook ID
                </label>
                <input
                  type="text"
                  placeholder="4JH..."
                  value={formState.PAYPAL.config.webhookId || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      PAYPAL: {
                        ...formState.PAYPAL,
                        config: { ...formState.PAYPAL.config, webhookId: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div className="pt-2">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  PayPal Webhook Target URL:
                </span>
                <div className="flex items-center gap-1.5 p-2 bg-[#0B0E14] rounded border border-[#1E293B]">
                  <span className="text-[10px] font-mono text-slate-400 truncate flex-1">
                    .../api/billing/webhooks?gateway=PAYPAL
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyWebhook("PAYPAL")}
                    className="p-1 hover:text-[#00E5FF] transition text-slate-400"
                    title="Copy full URL"
                  >
                    {copiedGateway === "PAYPAL" ? (
                      <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#1E293B]">
            {statusMessage?.gateway === "PAYPAL" && (
              <div
                className={`mb-3 p-2 rounded text-xs flex items-center gap-2 ${
                  statusMessage.isError
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusMessage.message}
              </div>
            )}

            <button
              disabled={savingGateway === "PAYPAL"}
              onClick={() => handleSaveGateway("PAYPAL")}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold text-xs rounded transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingGateway === "PAYPAL" ? "Saving..." : "Save PayPal Configuration"}
            </button>
          </div>
        </div>

        {/* Gateway 3: Azam Pay */}
        <div className="bg-[#111622] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FF6600]/20 border border-[#FF6600]/40 flex items-center justify-center font-bold text-sm text-[#FF6600]">
                  A
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Azam Pay</h3>
                  <span className="text-[11px] text-slate-400">Mobile Money (M-Pesa, Airtel, Tigo)</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.AZAMPAY.isEnabled}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      AZAMPAY: { ...formState.AZAMPAY, isEnabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#0B0E14] border border-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E5FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg border border-[#1E293B] mb-5 text-xs">
              <span className="text-slate-300 font-semibold">Environment Mode</span>
              <button
                type="button"
                onClick={() =>
                  setFormState({
                    ...formState,
                    AZAMPAY: { ...formState.AZAMPAY, isLiveMode: !formState.AZAMPAY.isLiveMode },
                  })
                }
                className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider font-mono uppercase transition ${
                  formState.AZAMPAY.isLiveMode
                    ? "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}
              >
                {formState.AZAMPAY.isLiveMode ? "LIVE PRODUCTION" : "TEST / SANDBOX"}
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  placeholder="radiofy_live"
                  value={formState.AZAMPAY.config.appName || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      AZAMPAY: {
                        ...formState.AZAMPAY,
                        config: { ...formState.AZAMPAY.config, appName: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  placeholder="az_client_..."
                  value={formState.AZAMPAY.config.clientId || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      AZAMPAY: {
                        ...formState.AZAMPAY,
                        config: { ...formState.AZAMPAY.config, clientId: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  API Key / Secret
                </label>
                <input
                  type={showSecrets.azampay ? "text" : "password"}
                  placeholder="az_secret_..."
                  value={formState.AZAMPAY.config.apiKey || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      AZAMPAY: {
                        ...formState.AZAMPAY,
                        config: { ...formState.AZAMPAY.config, apiKey: e.target.value },
                      },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded px-3 py-2 text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div className="pt-2">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Azam Pay Webhook Target URL:
                </span>
                <div className="flex items-center gap-1.5 p-2 bg-[#0B0E14] rounded border border-[#1E293B]">
                  <span className="text-[10px] font-mono text-slate-400 truncate flex-1">
                    .../api/billing/webhooks?gateway=AZAMPAY
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyWebhook("AZAMPAY")}
                    className="p-1 hover:text-[#00E5FF] transition text-slate-400"
                    title="Copy full URL"
                  >
                    {copiedGateway === "AZAMPAY" ? (
                      <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#1E293B]">
            {statusMessage?.gateway === "AZAMPAY" && (
              <div
                className={`mb-3 p-2 rounded text-xs flex items-center gap-2 ${
                  statusMessage.isError
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusMessage.message}
              </div>
            )}

            <button
              disabled={savingGateway === "AZAMPAY"}
              onClick={() => handleSaveGateway("AZAMPAY")}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold text-xs rounded transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingGateway === "AZAMPAY" ? "Saving..." : "Save Azam Pay Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
