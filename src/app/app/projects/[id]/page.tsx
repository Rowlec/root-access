import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProjectHubView } from "@/components/project/ProjectHubView";
import { fetchProjectHubData } from "@/lib/server/projects";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hubData = await fetchProjectHubData(id);

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10 space-y-6">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Quay lại danh sách dự án
      </Link>

      <ProjectHubView initialData={hubData} />
    </main>
  );
}
