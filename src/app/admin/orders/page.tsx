import { ReceiptText, XCircle } from "lucide-react";

import { cancelOrderAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { getAdminOrders } from "@/lib/server/admin";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><ReceiptText className="text-primary" /><h1 className="text-3xl font-semibold">Đơn hàng</h1></div>
      <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card/70"><table className="w-full min-w-[780px] text-left text-sm"><thead className="text-muted-foreground"><tr><th className="p-4">Mã đơn</th><th>User</th><th>Gói</th><th>Credits</th><th>Giá</th><th>Trạng thái</th><th className="pr-4 text-right">Thao tác</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-border"><td className="p-4">{order.orderCode}</td><td>{order.email ?? "—"}</td><td>{order.packageId}</td><td>{order.credits}</td><td>{order.amountVnd.toLocaleString("vi-VN")}đ</td><td>{order.status}</td><td className="pr-4 text-right">{order.status === "pending" ? <form action={cancelOrderAction}><input type="hidden" name="id" value={order.id} /><Button size="sm" variant="outline"><XCircle />Hủy</Button></form> : "—"}</td></tr>)}</tbody></table>{!orders.length ? <p className="p-8 text-center text-muted-foreground">Chưa có đơn hàng.</p> : null}</div>
    </main>
  );
}
