import { getAdminOrders } from "@/lib/server/admin";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
      <AdminOrdersClient orders={orders} />
    </main>
  );
}
