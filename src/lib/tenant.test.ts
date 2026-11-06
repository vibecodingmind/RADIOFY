import { describe, it, expect } from "vitest";
import { stationOrgWhere, getTenantScope } from "./tenant";

describe("stationOrgWhere", () => {
  it("returns empty object for super admin", () => {
    expect(stationOrgWhere(true, "org-1")).toEqual({});
  });

  it("scopes to orgId for tenant users", () => {
    expect(stationOrgWhere(false, "org-1")).toEqual({ orgId: "org-1" });
  });

  it("uses invalid id when super is false but orgId missing", () => {
    expect(stationOrgWhere(false, null)).toEqual({ orgId: "__invalid__" });
  });
});

describe("getTenantScope", () => {
  it("detects super admin", () => {
    const s = getTenantScope({
      user: { role: "SUPER_ADMIN" },
      activeMembership: null,
    });
    expect(s.isSuper).toBe(true);
  });
});
