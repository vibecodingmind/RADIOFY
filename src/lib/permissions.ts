export type PlatformPermission =
  | "MANAGE_PLATFORM"
  | "MANAGE_ALL_USERS"
  | "MANAGE_ALL_ORGANIZATIONS"
  | "MANAGE_STREAM_NODES"
  | "VIEW_GLOBAL_ANALYTICS"
  | "MANAGE_GLOBAL_BILLING"
  | "VIEW_AUDIT_LOGS"
  | "SYSTEM_SETTINGS";

export type OrgPermission =
  | "ORG_OWNER"
  | "MANAGE_ORGANIZATION"
  | "MANAGE_MEMBERS"
  | "INVITE_MEMBERS"
  | "MANAGE_ROLES"
  | "VIEW_BILLING"
  | "MANAGE_BILLING"
  | "MANAGE_API_KEYS"
  | "CREATE_STATION"
  | "DELETE_STATION"
  | "MANAGE_STATION_SETTINGS"
  | "START_STOP_STATION"
  | "MANAGE_MOUNTS"
  | "MANAGE_MEDIA"
  | "MANAGE_PLAYLISTS"
  | "MANAGE_SCHEDULES"
  | "BROADCAST_LIVE"
  | "VIEW_STATION_ANALYTICS"
  | "VIEW_ROYALTY_REPORTS"
  | "MANAGE_WIDGETS";

export const ROLE_PERMISSIONS_MAP: Record<string, OrgPermission[]> = {
  OWNER: [
    "ORG_OWNER",
    "MANAGE_ORGANIZATION",
    "MANAGE_MEMBERS",
    "INVITE_MEMBERS",
    "MANAGE_ROLES",
    "VIEW_BILLING",
    "MANAGE_BILLING",
    "MANAGE_API_KEYS",
    "CREATE_STATION",
    "DELETE_STATION",
    "MANAGE_STATION_SETTINGS",
    "START_STOP_STATION",
    "MANAGE_MOUNTS",
    "MANAGE_MEDIA",
    "MANAGE_PLAYLISTS",
    "MANAGE_SCHEDULES",
    "BROADCAST_LIVE",
    "VIEW_STATION_ANALYTICS",
    "VIEW_ROYALTY_REPORTS",
    "MANAGE_WIDGETS",
  ],
  STATION_MANAGER: [
    "CREATE_STATION",
    "MANAGE_STATION_SETTINGS",
    "START_STOP_STATION",
    "MANAGE_MOUNTS",
    "MANAGE_MEDIA",
    "MANAGE_PLAYLISTS",
    "MANAGE_SCHEDULES",
    "BROADCAST_LIVE",
    "VIEW_STATION_ANALYTICS",
    "VIEW_ROYALTY_REPORTS",
    "MANAGE_WIDGETS",
    "INVITE_MEMBERS",
  ],
  STATION_ADMIN: [
    "MANAGE_STATION_SETTINGS",
    "START_STOP_STATION",
    "MANAGE_MOUNTS",
    "MANAGE_MEDIA",
    "MANAGE_PLAYLISTS",
    "MANAGE_SCHEDULES",
    "BROADCAST_LIVE",
    "VIEW_STATION_ANALYTICS",
    "VIEW_ROYALTY_REPORTS",
    "MANAGE_WIDGETS",
  ],
  MUSIC_MANAGER: ["MANAGE_MEDIA", "MANAGE_PLAYLISTS", "VIEW_STATION_ANALYTICS"],
  PLAYLIST_MANAGER: ["MANAGE_PLAYLISTS", "MANAGE_SCHEDULES", "VIEW_STATION_ANALYTICS"],
  DJ_PRESENTER: ["BROADCAST_LIVE", "VIEW_STATION_ANALYTICS"],
  ANALYTICS_VIEWER: ["VIEW_STATION_ANALYTICS", "VIEW_ROYALTY_REPORTS"],
  BILLING_MANAGER: ["VIEW_BILLING", "MANAGE_BILLING"],
  CUSTOM: [],
};

export interface AuthContextUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "BROADCASTER";
  isActive: boolean;
}

export interface AuthContextOrgMember {
  orgId: string;
  role: string;
  customPermissions?: string[];
}

export class AuthorizationService {
  /**
   * Evaluates if a user has permission to perform an action on a resource within a given context.
   */
  static can(
    user: AuthContextUser,
    action: OrgPermission | PlatformPermission,
    context?: {
      membership?: AuthContextOrgMember;
      targetOrgId?: string;
    }
  ): boolean {
    if (!user || !user.isActive) return false;

    // Super Admin has unrestricted access to everything
    if (user.role === "SUPER_ADMIN") return true;

    // Platform level permission checks
    if (user.role === "SUPPORT_ADMIN") {
      const supportPermissions: (OrgPermission | PlatformPermission)[] = [
        "VIEW_STATION_ANALYTICS",
        "VIEW_AUDIT_LOGS",
      ];
      return supportPermissions.includes(action);
    }

    if (user.role === "BILLING_ADMIN") {
      const billingAdminPermissions: (OrgPermission | PlatformPermission)[] = [
        "MANAGE_GLOBAL_BILLING",
        "VIEW_BILLING",
        "MANAGE_BILLING",
      ];
      return billingAdminPermissions.includes(action);
    }

    // Broadcaster Organization Level Checks
    if (user.role === "BROADCASTER") {
      if (!context?.membership) return false;

      const member = context.membership;
      if (context.targetOrgId && member.orgId !== context.targetOrgId) {
        return false;
      }

      // Check built-in role permissions
      const basePermissions = ROLE_PERMISSIONS_MAP[member.role] || [];
      if (basePermissions.includes(action as OrgPermission)) {
        return true;
      }

      // Check custom role permissions if applicable
      if (
        member.role === "CUSTOM" &&
        member.customPermissions &&
        member.customPermissions.includes(action as string)
      ) {
        return true;
      }
    }

    return false;
  }
}
