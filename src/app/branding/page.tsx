import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { Palette, Radio, Upload, Image, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const stations = await prisma.station.findMany({
    where: { orgId: orgId || undefined },
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
            <p className="text-xs text-on-surface-variant">
              Upload custom radio logos, social share banners, and embeddable player theme colors
            </p>
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
              Primary Brand Assets
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded bg-surface-container border border-border-subtle text-xs space-y-3 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container">
                  <Radio className="w-10 h-10" />
                </div>
                <div>
                  <div className="font-bold text-on-surface">Station Icon Logo</div>
                  <div className="text-[11px] text-on-surface-variant">512x512px PNG / WebP</div>
                </div>
                <button className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-elevated text-xs font-semibold text-primary border border-border-subtle">
                  Upload Logo
                </button>
              </div>

              <div className="p-4 rounded bg-surface-container border border-border-subtle text-xs space-y-3 text-center">
                <div className="w-full h-20 rounded bg-surface-panel border border-border-subtle flex items-center justify-center text-on-surface-variant">
                  <Image className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <div className="font-bold text-on-surface">Web Player Header Banner</div>
                  <div className="text-[11px] text-on-surface-variant">1200x400px JPG / PNG</div>
                </div>
                <button className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-elevated text-xs font-semibold text-secondary border border-border-subtle">
                  Upload Banner
                </button>
              </div>
            </div>
          </div>
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
