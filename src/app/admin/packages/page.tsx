import { getAdminPackages } from "@/lib/server/admin";
import { AdminPackagesClient } from "@/components/admin/AdminPackagesClient";

export default async function AdminPackagesPage() {
  const packages = await getAdminPackages();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
      <AdminPackagesClient packages={packages} />
    </main>
  );
}
