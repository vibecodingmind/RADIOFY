/** Platform roles that may use the admin shell (not broadcaster-only). */
export function isPlatformOperatorRole(
  role: string
): role is "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" {
  return role === "SUPER_ADMIN" || role === "SUPPORT_ADMIN" || role === "BILLING_ADMIN";
}

export function canManagePlansAndGateways(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "BILLING_ADMIN";
}

export function canViewOrganizationsAndStations(role: string): boolean {
  return isPlatformOperatorRole(role);
}

export function canViewAuditLog(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "SUPPORT_ADMIN";
}
