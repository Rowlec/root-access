import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bot,
  CircleDollarSign,
  Clock,
  Coins,
  FolderKanban,
  History,
  Package,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isDatabaseConfigured } from "@/db";
import { getAdminDashboardData } from "@/lib/server/admin";
import { ForbiddenError, isAuthConfigured } from "@/lib/server/auth";

export default async function AdminPage() {
  if (!isAuthConfigured() || !isDatabaseConfigured()) {
    return (
      <main className="mx-auto min-h-svh max-w-4xl px-6 py-12">
        <Badge variant="secondary">Admin setup</Badge>
        <h1 className="mt-4 text-3xl font-semibold">Dashboard đã sẵn sàng để kết nối</h1>
        <p className="mt-3 text-muted-foreground">
          Cấu hình Better Auth, DATABASE_URL và ADMIN_EMAILS, sau đó chạy migration để bật số liệu thật.
        </p>
        <Link href="/app" className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
          ← Quay lại workspace
        </Link>
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

  const statCards = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: data.metrics.users.toLocaleString("vi-VN"),
      href: "/admin/users",
      badge: "Tài khoản",
      color: "from-blue-500/15 to-indigo-500/5 text-blue-400 border-blue-500/20",
    },
    {
      icon: ShieldCheck,
      label: "Quản trị viên",
      value: (data.metrics.admins ?? 1).toLocaleString("vi-VN"),
      href: "/admin/users",
      badge: "Multi-Admin",
      color: "from-emerald-500/15 to-teal-500/5 text-emerald-400 border-emerald-500/20",
    },
    {
      icon: CircleDollarSign,
      label: "Doanh thu tích lũy",
      value: `${data.metrics.revenueVnd.toLocaleString("vi-VN")}đ`,
      href: "/admin/orders",
      badge: "PayOS",
      color: "from-amber-500/15 to-orange-500/5 text-amber-400 border-amber-500/20",
    },
    {
      icon: FolderKanban,
      label: "Dự án sinh viên",
      value: data.metrics.projects.toLocaleString("vi-VN"),
      href: "/admin/projects",
      badge: "Khởi nghiệp",
      color: "from-purple-500/15 to-pink-500/5 text-purple-400 border-purple-500/20",
    },
    {
      icon: Bot,
      label: "AI Actions",
      value: data.metrics.aiRequests.toLocaleString("vi-VN"),
      badge: "Gemini AI",
      color: "from-cyan-500/15 to-sky-500/5 text-cyan-400 border-cyan-500/20",
    },
    {
      icon: Activity,
      label: "AI Success Rate",
      value: `${data.metrics.aiSuccessRate}%`,
      badge: "Độ ổn định",
      color: "from-rose-500/15 to-red-500/5 text-rose-400 border-rose-500/20",
    },
  ];

  const quickNav = [
    {
      title: "Quản lý Người dùng & Admin",
      desc: "Xem danh sách, phân quyền admin, nạp token hoặc khóa tài khoản",
      href: "/admin/users",
      icon: UserCheck,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Quản lý Đơn hàng & Nạp tiền",
      desc: "Kiểm tra giao dịch PayOS, duyệt đơn thủ công nếu cần thiết",
      href: "/admin/orders",
      icon: CircleDollarSign,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Gói Credit & Giá bán",
      desc: "Thêm, chỉnh sửa giá gói credit và số token nạp cho sinh viên",
      href: "/admin/packages",
      icon: Package,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Quản lý Dự án Sinh viên",
      desc: "Theo dõi tiến độ, lưu trữ hoặc gỡ bỏ các dự án vi phạm",
      href: "/admin/projects",
      icon: FolderKanban,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Audit Log & Nhật ký hệ thống",
      desc: "Lịch sử mọi thao tác thay đổi dữ liệu của các quản trị viên",
      href: "/admin/audit",
      icon: History,
      color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    },
  ];

  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Banner / Title */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px] font-semibold tracking-wide">
                HỆ THỐNG QUẢN TRỊ TRUNG TÂM
              </Badge>
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                Multi-Admin Support
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tổng quan Vận hành Root-Access
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Theo dõi số liệu người dùng, luồng thanh toán PayOS, mức độ sử dụng AI và kiểm soát phân quyền quản trị viên toàn diện.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button asChild size="sm" className="rounded-xl gap-2 font-medium">
              <Link href="/admin/users">
                <UserCheck size={15} />
                <span>Thêm Admin mới</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl gap-2">
              <Link href="/admin/orders">
                <CircleDollarSign size={15} />
                <span>Duyệt đơn</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics 6-Card Grid */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const Wrapper = card.href ? Link : "div";

          return (
            <Wrapper
              key={card.label}
              // @ts-expect-error href condition
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b ${card.color} p-4 sm:p-5 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50">
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/50 border border-border/40 text-muted-foreground">
                  {card.badge}
                </span>
              </div>
              <p className="mt-3.5 text-2xl font-bold tracking-tight text-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                {card.label}
              </p>
            </Wrapper>
          );
        })}
      </section>

      {/* Quick Nav Modules */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <span>Phân hệ Quản trị</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card/70 p-4 transition-all hover:border-primary/40 hover:bg-card/90 hover:shadow-sm"
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${item.color}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2-Column: Activity Funnel & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Funnel */}
        <section className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="size-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Phễu Hoạt động Sinh viên (Funnel)</h2>
            </div>
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              Sự kiện ghi nhận
            </Badge>
          </div>

          <div className="space-y-2.5">
            {data.eventFunnel.length ? (
              data.eventFunnel.map((event) => {
                const count = Number(event.value);
                const maxCount = Math.max(...data.eventFunnel.map((e) => Number(e.value)), 1);
                const percentage = Math.round((count / maxCount) * 100);

                return (
                  <div
                    key={event.eventName}
                    className="relative overflow-hidden rounded-xl border border-border/70 bg-background/50 p-3"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground capitalize">
                        {event.eventName.replaceAll("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{percentage}%</span>
                        <span className="font-bold font-mono text-primary">{count.toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center space-y-1.5 border border-dashed border-border rounded-2xl">
                <Activity size={24} className="mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Chưa có event nào ghi nhận. Khi sinh viên thao tác trong app, số liệu sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Coins className="size-5 text-amber-400" />
              <h2 className="text-base font-bold text-foreground">Giao dịch nạp tiền gần nhất</h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground border-b border-border/70">
                <tr>
                  <th className="pb-2.5">Mã đơn</th>
                  <th className="pb-2.5">Gói</th>
                  <th className="pb-2.5">Trạng thái</th>
                  <th className="pb-2.5 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.recentOrders.map((order) => {
                  let badge = (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {order.status}
                    </Badge>
                  );

                  if (order.status === "paid") {
                    badge = (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                        Đã thanh toán
                      </Badge>
                    );
                  } else if (order.status === "pending") {
                    badge = (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        Chờ xử lý
                      </Badge>
                    );
                  } else if (order.status === "cancelled") {
                    badge = (
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                        Đã hủy
                      </Badge>
                    );
                  }

                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-mono text-muted-foreground font-semibold">
                        #{order.orderCode}
                      </td>
                      <td className="py-2.5 font-medium">{order.packageId}</td>
                      <td className="py-2.5">{badge}</td>
                      <td className="py-2.5 text-right font-bold text-foreground">
                        {order.amountVnd.toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!data.recentOrders.length ? (
              <div className="py-10 text-center space-y-1.5 border border-dashed border-border rounded-2xl">
                <CircleDollarSign size={24} className="mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Chưa có giao dịch nạp tiền nào.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
