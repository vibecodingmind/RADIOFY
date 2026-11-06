import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { PlayersDirectoryClient } from "./PlayersDirectoryClient";

export const dynamic = "force-dynamic";

export default async function PlayersDirectoryPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const stations = await prisma.station.findMany({
    where: isSuper ? undefined : { orgId },
    include: {
      mounts: true,
      processState: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#E2E8F0] antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto pb-24">
          <PlayersDirectoryClient stations={stations} />
        </main>
      </div>
      <BottomTransportBar />
    </div>
  );
}
