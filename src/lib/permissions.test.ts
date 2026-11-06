import { describe, expect, it } from "vitest";
import { AuthorizationService } from "./permissions";

const broadcaster = {
  id: "u1",
  email: "dj@example.com",
  name: "DJ",
  role: "BROADCASTER" as const,
  isActive: true,
};

describe("AuthorizationService org roles", () => {
  it("lets billing managers manage billing", () => {
    expect(
      AuthorizationService.can(broadcaster, "MANAGE_BILLING", {
        membership: { orgId: "org-1", role: "BILLING_MANAGER" },
        targetOrgId: "org-1",
      })
    ).toBe(true);
  });

  it("blocks DJs from billing and station settings", () => {
    const ctx = {
      membership: { orgId: "org-1", role: "DJ_PRESENTER" },
      targetOrgId: "org-1",
    };
    expect(AuthorizationService.can(broadcaster, "MANAGE_BILLING", ctx)).toBe(false);
    expect(AuthorizationService.can(broadcaster, "MANAGE_STATION_SETTINGS", ctx)).toBe(false);
    expect(AuthorizationService.can(broadcaster, "BROADCAST_LIVE", ctx)).toBe(true);
  });

  it("rejects a membership aimed at another organization", () => {
    expect(
      AuthorizationService.can(broadcaster, "MANAGE_MEDIA", {
        membership: { orgId: "org-1", role: "OWNER" },
        targetOrgId: "org-2",
      })
    ).toBe(false);
  });
});
