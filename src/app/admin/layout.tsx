import { redirect } from "next/navigation";
import { ForbiddenError, requireAdmin } from "@/lib/server/auth";
import { AdminHeaderNav } from "@/components/admin/AdminHeaderNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/app");
    throw error;
  }

  return (
    <div className="min-h-svh bg-background/80 flex flex-col">
      <AdminHeaderNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
