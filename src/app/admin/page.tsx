import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  CircleDollarSign,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { isDatabaseConfigured } from "@/db";
import { getAdminDashboardData } from "@/lib/server/admin";
import { ForbiddenError, isClerkConfigured } from "@/lib/server/auth";

export default async function AdminPage() {
  if (!isClerkConfigured() || !isDatabaseConfigured()) {
    return (
      <main className="mx-auto min-h-svh max-w-4xl px-6 py-12">
        <Badge variant="secondary">Admin setup</Badge>
        <h1 className="mt-4 text-3xl font-semibold">Dashboard đã sẵn sàng để kết nối</h1>
        <p className="mt-3 text-muted-foreground">Cấu hình Clerk, DATABASE_URL và ADMIN_USER_IDS, sau đó chạy migration để bật số liệu thật.</p>
        <Link href="/app" className="mt-6 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="size-4" /> Quay lại workspace</Link>
      </main>
    );
  }

  let data: Awaited<ReturnType<typeof getAdminDashboardData>>;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      redirect("/app");
    }
    throw error;
  }

  const cards = [
    { icon: Users, label: "Người dùng", value: data.metrics.users.toLocaleString("vi-VN") },
    { icon: FolderKanban, label: "Dự án", value: data.metrics.projects.toLocaleString("vi-VN") },
    { icon: Bot, label: "AI requests", value: data.metrics.aiRequests.toLocaleString("vi-VN") },
    { icon: Activity, label: "AI success", value: `${data.metrics.aiSuccessRate}%` },
    { icon: CircleDollarSign, label: "Doanh thu", value: `${data.metrics.revenueVnd.toLocaleString("vi-VN")}đ` },
  ];

  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Workspace</Link>
          <div className="mt-4 flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><Badge variant="secondary">ADMIN ONLY</Badge></div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Product intelligence</h1>
          <p className="mt-2 text-muted-foreground">Dashboard server-side phục vụ CP1 và quyết định sản phẩm.</p>
        </div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card/70 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4 text-primary" /> {label}</div>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Activity funnel</h2>
          <div className="mt-4 grid gap-3">
            {data.eventFunnel.length ? data.eventFunnel.map((event) => (
              <div key={event.eventName} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
                <span>{event.eventName.replaceAll("_", " ")}</span><strong>{Number(event.value)}</strong>
              </div>
            )) : <p className="text-sm text-muted-foreground">Chưa có event. Hãy tạo project và chạy một AI action.</p>}
          </div>
        </section>

        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Đơn hàng gần nhất</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground"><tr><th className="pb-3">Mã</th><th className="pb-3">Gói</th><th className="pb-3">Trạng thái</th><th className="pb-3 text-right">Giá</th></tr></thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border"><td className="py-3">{order.orderCode}</td><td>{order.packageId}</td><td>{order.status}</td><td className="text-right">{order.amountVnd.toLocaleString("vi-VN")}đ</td></tr>
                ))}
              </tbody>
            </table>
            {!data.recentOrders.length ? <p className="py-6 text-sm text-muted-foreground">Chưa có đơn hàng.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
