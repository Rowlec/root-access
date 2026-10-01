import { getAdminAuditLogs } from "@/lib/server/admin";
import { AdminAuditClient } from "@/components/admin/AdminAuditClient";

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminAuditClient logs={logs} />
    </main>
  );
}
