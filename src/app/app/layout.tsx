import { AppSidebar } from "@/components/app/AppSidebar";
import { MobileAppNav } from "@/components/app/MobileAppNav";
import { isDatabaseConfigured } from "@/db";
import { redirect } from "next/navigation";
import { ForbiddenError, isClerkConfigured } from "@/lib/server/auth";
import { getWorkspaceOverview } from "@/lib/server/projects";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let overview: Awaited<ReturnType<typeof getWorkspaceOverview>> | null = null;

  if (isClerkConfigured() && isDatabaseConfigured()) {
    try {
      overview = await getWorkspaceOverview();
    } catch (error) {
      if (error instanceof ForbiddenError) redirect("/blocked");
      throw error;
    }
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background/70">
      <AppSidebar
        balance={overview?.wallet?.balance ?? 20}
        isAdmin={overview?.user.role === "admin"}
        projects={(overview?.projects ?? []).map(({ id, title }) => ({ id, title }))}
      />
      <div className="min-w-0 flex-1 overflow-y-auto">
        <MobileAppNav
          balance={overview?.wallet?.balance ?? 20}
          projects={(overview?.projects ?? []).map(({ id, title }) => ({ id, title }))}
        />
        {children}
      </div>
    </div>
  );
}
