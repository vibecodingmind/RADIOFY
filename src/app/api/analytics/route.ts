import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTenantScope } from "@/lib/tenant";
import { getAnalyticsSummary, AnalyticsRange } from "@/lib/analytics-service";
import { AuthorizationService } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isSuper, orgId } = getTenantScope(session);

  const canView =
    isSuper ||
    AuthorizationService.can(session.user, "VIEW_STATION_ANALYTICS", {
      membership: session.activeMembership
        ? { orgId: orgId!, role: session.activeMembership.role }
        : undefined,
      targetOrgId: orgId,
    });

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "last7") as AnalyticsRange;
  const customFrom = searchParams.get("from") || undefined;
  const customTo = searchParams.get("to") || undefined;

  const summary = await getAnalyticsSummary({
    orgId,
    isSuper,
    range,
    customFrom,
    customTo,
  });

  return NextResponse.json(summary);
}
