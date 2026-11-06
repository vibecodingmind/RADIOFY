import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { Palette } from "lucide-react";
import { BrandingClient } from "./BrandingClient";
import { getTenantScope, stationOrgWhere } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const { isSuper, orgId } = getTenantScope(session);

  const stations = await prisma.station.findMany({
    where: stationOrgWhere(isSuper, orgId),
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      playerBannerUrl: true,
      playerAccentColor: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1000px] w-full mx-auto space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary-container" />
              <span>Station Branding & Custom Styling</span>
            </h1>
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle shadow-panel">
            <BrandingClient stations={stations} />
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
