import { getAdminUsers } from "@/lib/server/admin";
import { requireAdmin } from "@/lib/server/auth";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  const [admin, users] = await Promise.all([
    requireAdmin(),
    getAdminUsers(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
      <AdminUsersClient users={users} currentAdminEmail={admin.email} />
    </main>
  );
}
