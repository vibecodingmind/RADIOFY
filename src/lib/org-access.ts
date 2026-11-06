import { AuthorizationService, OrgPermission } from "./permissions";

type SessionLike = {
  user: {
    id: string;
    email: string;
    name: string;
    role: "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "BROADCASTER";
    isActive: boolean;
  };
  activeMembership?: {
    orgId: string;
    role: string;
    customRole?: { permissions: string[] } | null;
  } | null;
};

export function orgAllows(session: SessionLike, action: OrgPermission): boolean {
  const membership = session.activeMembership;
  return AuthorizationService.can(session.user, action, {
    membership: membership
      ? {
          orgId: membership.orgId,
          role: membership.role,
          customPermissions: membership.customRole?.permissions,
        }
      : undefined,
    targetOrgId: membership?.orgId,
  });
}
