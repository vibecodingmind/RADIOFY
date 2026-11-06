"use client";

import { useState } from "react";
import {
  Network,
  Key,
  Webhook,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  ExternalLink,
  Shield,
  Activity,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
}

interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  eventSubscriptions: string[];
  isActive: boolean;
  createdAt: Date | string;
  deliveryLogs: {
    id: string;
    eventType: string;
    responseStatus: number | null;
    success: boolean;
    durationMs: number;
    createdAt: Date | string;
  }[];
}

export function DeveloperClient({
  initialKeys,
  initialWebhooks,
}: {
  initialKeys: ApiKeyItem[];
  initialWebhooks: WebhookItem[];
}) {
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(initialWebhooks);
  const [keyName, setKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function copy(key: string, val: string) {
    navigator.clipboard.writeText(val);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2500);
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");

      setKeys([data.apiKey, ...keys]);
      setNewlyCreatedKey(data.apiKey.fullKey);
      setKeyName("");
      setNotice("Scoped API key created successfully. Store it safely.");
      setTimeout(() => setNotice(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating key");
    }
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create webhook");

      setWebhooks([{ ...data.webhook, deliveryLogs: [] }, ...webhooks]);
      setWebhookUrl("");
      setNotice(`Webhook endpoint registered with HMAC secret`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error registering webhook");
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
      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <Network className="w-5 h-5 text-primary-container" />
          <span>Developer Platform, API Keys & Webhooks</span>
        </h1>
        <p className="text-xs text-on-surface-variant">
          Programmatic access to station control, stream telemetry relays, and HMAC signed webhook dispatches
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* API Keys (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary-container" />
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                  Scoped API Access Keys
                </h2>
              </div>
              <span className="text-xs font-mono text-tertiary">{keys.length} Active Keys</span>
            </div>

            {/* Revealed Key Banner */}
            {newlyCreatedKey && (
              <div className="p-3 rounded bg-primary-container/15 border border-border-focus text-xs font-mono space-y-1">
                <span className="text-[10px] text-primary uppercase font-bold block">
                  COPY YOUR API KEY NOW (WILL NOT BE SHOWN AGAIN)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-semibold truncate mr-2">
                    {newlyCreatedKey}
                  </span>
                  <button
                    onClick={() => copy("newKey", newlyCreatedKey)}
                    className="text-primary-container hover:text-primary shrink-0"
                  >
                    {copiedText === "newKey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Keys Table */}
            <div className="divide-y divide-border-subtle/50 font-mono text-xs">
              {keys.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant">
                  No API keys generated yet.
                </div>
              ) : (
                keys.map((k) => (
                  <div key={k.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-on-surface">{k.name}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        Prefix: <span className="text-primary-container">{k.keyPrefix}••••</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-on-surface-variant">
                      Created {new Date(k.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Key Form */}
            <form onSubmit={handleCreateKey} className="pt-2 border-t border-border-subtle flex gap-2">
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key label e.g. Mobile Listener App"
                className="flex-1 px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container text-xs font-semibold shadow-photonic font-mono"
              >
                Create Key
              </button>
            </form>
          </div>
        </div>

        {/* Webhooks (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-secondary" />
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                  Real-time Webhook Endpoints
                </h2>
              </div>
              <span className="text-xs font-mono text-secondary">{webhooks.length} Endpoints</span>
            </div>

            <div className="divide-y divide-border-subtle/50 font-mono text-xs">
              {webhooks.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant">
                  No webhook endpoints registered.
                </div>
              ) : (
                webhooks.map((wh) => (
                  <div key={wh.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface truncate mr-2">{wh.url}</span>
                      <span className="px-1.5 py-0.2 rounded bg-tertiary-container/20 text-tertiary text-[9px] font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span>Secret: {wh.secret.substring(0, 10)}••••</span>
                      <span>Events: {wh.eventSubscriptions.join(", ")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Register Webhook Form */}
            <form onSubmit={handleCreateWebhook} className="pt-2 border-t border-border-subtle flex gap-2">
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhooks/radiofy"
                className="flex-1 px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-semibold shadow-photonic font-mono"
              >
                Register Webhook
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
