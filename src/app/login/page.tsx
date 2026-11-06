"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      const role = data.user?.role as string | undefined;
      const platform =
        role === "SUPER_ADMIN" || role === "SUPPORT_ADMIN" || role === "BILLING_ADMIN";
      router.push(platform ? "/admin" : "/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function quickFill(userEmail: string, pass: string) {
    setEmail(userEmail);
    setPassword(pass);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient photonic glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-panel border border-border-subtle">
            <Radio className="w-4 h-4 text-primary-container" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-container">
              AetherCast Broadcast OS v4.2
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Command Center Sign In
          </h1>
          <p className="text-sm text-on-surface-variant">
            Connect to mission-critical telemetry, AutoDJ and edge encoders
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-lg bg-surface-panel border border-border-subtle shadow-panel space-y-5">
          {error && (
            <div className="p-3 rounded bg-error-container/30 border border-error/50 text-error text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@aetherwave.fm"
                  className="w-full pl-9 pr-3 py-2 rounded bg-surface-container-lowest border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Access Key / Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded bg-surface-container-lowest border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary transition-all shadow-photonic disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Initialize Console Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill QA Accounts */}
          <div className="pt-4 border-t border-border-subtle space-y-2">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary-container" />
              <span>Instant Demo Operator Accounts</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill("elena.rostova@radiofy.com", "AdminPass123!")}
                className="p-2 rounded bg-surface-container hover:bg-surface-elevated border border-border-subtle text-left transition-colors"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Elena Rostova</span>
                </div>
                <div className="text-[10px] text-on-surface-variant">HQ Superadmin</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill("alex@neonhorizon.fm", "Broadcaster123!")}
                className="p-2 rounded bg-surface-container hover:bg-surface-elevated border border-border-subtle text-left transition-colors"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-tertiary">
                  <Radio className="w-3 h-3" />
                  <span>Alex Vance</span>
                </div>
                <div className="text-[10px] text-on-surface-variant">Broadcaster Owner</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center text-xs text-on-surface-variant">
          New broadcaster organization?{" "}
          <Link
            href="/register"
            className="text-primary-container hover:underline font-semibold"
          >
            Create Radiofy Organization
          </Link>
        </div>
      </div>
    </div>
  );
}
