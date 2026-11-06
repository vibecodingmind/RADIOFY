"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Copy,
  Check,
  Trash2,
  Lock,
  Radio,
  Sliders,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface MemberItem {
  id: string;
  role: string;
  joinedAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface InviteItem {
  id: string;
  email: string;
  role: string;
  token: string;
  createdAt: Date | string;
}

interface TeamManagerClientProps {
  orgId: string;
  currentUserId: string;
  initialMembers: MemberItem[];
  initialInvites: InviteItem[];
  rolePermissions: Record<string, string[]>;
}

export function TeamManagerClient({
  orgId,
  currentUserId,
  initialMembers,
  initialInvites,
  rolePermissions,
}: TeamManagerClientProps) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [invites, setInvites] = useState<InviteItem[]>(initialInvites);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STATION_MANAGER");
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "matrix">("members");

  const builtInRoles = [
    { id: "STATION_MANAGER", name: "Station Manager", desc: "Manage assigned stations and station operations" },
    { id: "STATION_ADMIN", name: "Station Administrator", desc: "Manage stream configuration, encoders & mounts" },
    { id: "MUSIC_MANAGER", name: "Music Manager", desc: "Upload audio files, manage metadata & media library" },
    { id: "PLAYLIST_MANAGER", name: "Playlist Manager", desc: "Manage AutoDJ rotations, cues and dayparting" },
    { id: "DJ_PRESENTER", name: "DJ / Presenter", desc: "Connect live to Harbor mount and host live shows" },
    { id: "ANALYTICS_VIEWER", name: "Analytics Viewer", desc: "View real-time listener telemetry and royalty reports" },
    { id: "BILLING_MANAGER", name: "Billing Manager", desc: "Manage subscriptions, payment methods and invoices" },
  ];

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      setInvites([data.invite, ...invites]);
      setInviteEmail("");
      setSuccessNotice(`Invitation generated for ${data.invite.email}`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : "Error sending invitation");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/orgs/${orgId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setSuccessNotice("Member role updated successfully");
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : "Error updating role");
    }
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invites/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {successNotice && (
        <div className="p-3 rounded bg-tertiary-container/20 border border-tertiary-container/50 text-tertiary text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successNotice}</span>
        </div>
      )}
      {errorNotice && (
        <div className="p-3 rounded bg-error-container/20 border border-error/50 text-error text-xs flex items-center gap-2">
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-container" />
            <span>Broadcaster Team & Permissions</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Manage organization members, assign station operational roles, and enforce RBAC
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-0.5 rounded bg-surface-panel border border-border-subtle text-xs">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === "members"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Team Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === "matrix"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Role Permission Matrix
          </button>
        </div>
      </div>

      {activeTab === "members" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Members Table (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Active Operators & Roles
                </span>
                <span className="text-xs font-mono text-tertiary">
                  {members.length} Active Accounts
                </span>
              </div>

              <div className="divide-y divide-border-subtle/50">
                {members.map((member) => {
                  const isSelf = member.user.id === currentUserId;
                  const isOwner = member.role === "OWNER";

                  return (
                    <div
                      key={member.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.avatarUrl ? (
                          <Image
                            src={member.user.avatarUrl}
                            alt={member.user.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover border border-border-subtle"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary-container font-bold flex items-center justify-center text-xs">
                            {member.user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span>{member.user.name}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary-container text-[9px] font-mono">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant font-mono">
                            {member.user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <span className="px-2.5 py-1 rounded bg-secondary-container/30 text-secondary text-xs font-mono font-bold border border-secondary/40">
                            ORGANIZATION OWNER
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="px-2.5 py-1 rounded bg-surface-container border border-border-subtle text-xs text-on-surface font-mono focus:outline-none focus:border-border-focus"
                          >
                            {builtInRoles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Invites Section */}
            {invites.length > 0 && (
              <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-vu-warning-amber" />
                    <span>Pending Invitations</span>
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant">
                    {invites.length} Pending
                  </span>
                </div>

                <div className="divide-y divide-border-subtle/50">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-on-surface font-mono">
                          {inv.email}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono">
                          Assigned Role: {inv.role.replace("_", " ")}
                        </div>
                      </div>

                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container hover:bg-surface-elevated text-xs font-mono border border-border-subtle transition-colors"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3 h-3 text-tertiary" />
                            <span className="text-tertiary">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-on-surface-variant" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invite Member Form (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
                <UserPlus className="w-4 h-4 text-primary-container" />
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Invite New Operator
                </h3>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Operator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="dj@aetherwave.fm"
                      className="w-full pl-8 pr-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Operational Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                  >
                    {builtInRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 rounded bg-surface-container border border-border-subtle text-[11px] text-on-surface-variant">
                  {builtInRoles.find((r) => r.id === inviteRole)?.desc}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-1.5 px-3 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic disabled:opacity-50"
                >
                  {loading ? "Generating Invite..." : "Send Broadcaster Invite"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Permission Matrix View */
        <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Shield className="w-4 h-4 text-primary-container" />
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Centralized RBAC Permission Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-on-surface-variant uppercase text-[10px] tracking-wider">
                  <th className="py-2 pr-4 font-semibold">Permission Flag</th>
                  <th className="py-2 px-2 text-center">Owner</th>
                  <th className="py-2 px-2 text-center">Station Mgr</th>
                  <th className="py-2 px-2 text-center">Station Admin</th>
                  <th className="py-2 px-2 text-center">Music Mgr</th>
                  <th className="py-2 px-2 text-center">Playlist Mgr</th>
                  <th className="py-2 px-2 text-center">DJ / Pres</th>
                  <th className="py-2 px-2 text-center">Analytics</th>
                  <th className="py-2 px-2 text-center">Billing Mgr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40 font-mono text-[11px]">
                {[
                  { name: "MANAGE_ORGANIZATION", label: "Organization Settings & Name" },
                  { name: "MANAGE_MEMBERS", label: "Invite & Remove Operators" },
                  { name: "MANAGE_ROLES", label: "Change Member Permissions" },
                  { name: "MANAGE_BILLING", label: "Upgrade Plan & Invoices" },
                  { name: "CREATE_STATION", label: "Create & Provision Stations" },
                  { name: "MANAGE_STATION_SETTINGS", label: "Configure Encoders & Mounts" },
                  { name: "START_STOP_STATION", label: "Start / Stop Broadcast Engine" },
                  { name: "MANAGE_MEDIA", label: "Upload & Edit Audio Library" },
                  { name: "MANAGE_PLAYLISTS", label: "AutoDJ Rotations & Scheduling" },
                  { name: "BROADCAST_LIVE", label: "Live Harbor Ingest & Studio Deck" },
                  { name: "VIEW_STATION_ANALYTICS", label: "Listener Telemetry & Maps" },
                  { name: "VIEW_ROYALTY_REPORTS", label: "SoundExchange Export Logs" },
                ].map((perm) => (
                  <tr key={perm.name} className="hover:bg-surface-container/50">
                    <td className="py-2 pr-4 text-on-surface font-sans">
                      <div className="font-semibold">{perm.label}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">{perm.name}</div>
                    </td>
                    {["OWNER", "STATION_MANAGER", "STATION_ADMIN", "MUSIC_MANAGER", "PLAYLIST_MANAGER", "DJ_PRESENTER", "ANALYTICS_VIEWER", "BILLING_MANAGER"].map((role) => {
                      const hasPerm = rolePermissions[role]?.includes(perm.name);
                      return (
                        <td key={role} className="py-2 px-2 text-center">
                          {hasPerm ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-tertiary-container/20 text-tertiary font-bold text-xs leading-4">
                              ✓
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/30">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
