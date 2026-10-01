import { getAdminProjects } from "@/lib/server/admin";
import { AdminProjectsClient } from "@/components/admin/AdminProjectsClient";

export default async function AdminProjectsPage() {
  const projects = await getAdminProjects();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminProjectsClient projects={projects} />
    </main>
  );
}

