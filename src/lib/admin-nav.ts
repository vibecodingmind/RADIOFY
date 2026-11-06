/** Admin shell navigation (paths + labels). Broadcaster console is separate. */
export type AdminNavItem = { href: string; label: string };

export function adminNavItemsForRole(role: string): AdminNavItem[] {
  const base: AdminNavItem[] = [{ href: "/admin", label: "Platform" }];
  if (role === "SUPER_ADMIN" || role === "BILLING_ADMIN") {
    base.push(
      { href: "/admin/organizations", label: "Organizations" },
      { href: "/admin/stations", label: "All stations" },
      { href: "/admin/plans", label: "Plans" },
      { href: "/admin/gateways", label: "Payment gateways" }
    );
  }
  if (role === "SUPER_ADMIN" || role === "SUPPORT_ADMIN") {
    if (!base.some((i) => i.href === "/admin/organizations")) {
      base.push({ href: "/admin/organizations", label: "Organizations" });
    }
    if (!base.some((i) => i.href === "/admin/stations")) {
      base.push({ href: "/admin/stations", label: "All stations" });
    }
    base.push({ href: "/admin/audit", label: "Audit log" });
  }
  return base;
}
