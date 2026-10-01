"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  ReceiptText,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  approveOrderAction,
  cancelOrderAction,
  deleteOrderAction,
} from "@/app/admin/actions";
import { startGlobalLoading, stopGlobalLoading } from "@/components/loading/GlobalLoading";

type AdminOrder = {
  amountVnd: number;
  checkoutUrl: string | null;
  createdAt: Date;
  credits: number;
  email: string | null;
  id: string;
  orderCode: number;
  packageId: string;
  paidAt: Date | null;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
};

export function AdminOrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending" | "cancelled">("all");
  const [isPending, startTransition] = useTransition();

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        String(o.orderCode).includes(query) ||
        o.email?.toLowerCase().includes(query) ||
        o.packageId.toLowerCase().includes(query);

      if (!matchSearch) return false;

      if (filterStatus === "paid") return o.status === "paid";
      if (filterStatus === "pending") return o.status === "pending";
      if (filterStatus === "cancelled")
        return o.status === "cancelled" || o.status === "failed";
      return true;
    });
  }, [orders, search, filterStatus]);

  const paidCount = orders.filter((o) => o.status === "paid").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amountVnd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ReceiptText className="text-primary size-7" />
            <span>Quản lý Đơn hàng & Nạp tiền</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi giao dịch PayOS, duyệt thanh toán thủ công và tra cứu lịch sử nạp credits.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-right">
          <p className="text-[11px] text-emerald-400 font-medium">Doanh thu thực thu</p>
          <p className="text-xl font-bold text-emerald-300">
            {totalRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Stats Quick Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "all"
              ? "border-primary/50 bg-primary/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Tất cả đơn hàng</p>
          <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
        </button>

        <button
          onClick={() => setFilterStatus("paid")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "paid"
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-400 font-medium">Đã thanh toán</p>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{paidCount}</p>
        </button>

        <button
          onClick={() => setFilterStatus("pending")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "pending"
              ? "border-amber-500/50 bg-amber-500/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-400 font-medium">Chờ thanh toán / duyệt</p>
            <Clock size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-1">{pendingCount}</p>
        </button>

        <button
          onClick={() => setFilterStatus("cancelled")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "cancelled"
              ? "border-rose-500/50 bg-rose-500/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <p className="text-xs text-rose-400 font-medium">Đã hủy / thất bại</p>
          <p className="text-2xl font-bold text-rose-300 mt-1">
            {orders.length - paidCount - pendingCount}
          </p>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn hàng, email khách hàng, gói credit..."
          className="pl-10 h-10 text-xs bg-card/60 rounded-xl"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Gói & Credits</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const isPaid = order.status === "paid";
                const isPendingOrder = order.status === "pending";

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-foreground">
                      #{order.orderCode}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {order.email || "Khách vãng lai"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                        {order.id}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-primary">
                        +{order.credits} credits
                      </span>
                      <p className="text-[11px] text-muted-foreground uppercase">
                        Gói: {order.packageId}
                      </p>
                    </td>

                    <td className="p-4 font-bold text-foreground text-sm">
                      {order.amountVnd.toLocaleString("vi-VN")}đ
                    </td>

                    <td className="p-4">
                      {isPaid ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] gap-1 font-bold">
                          <CheckCircle2 size={11} /> Đã thanh toán
                        </Badge>
                      ) : isPendingOrder ? (
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] gap-1 font-bold">
                          <Clock size={11} /> Chờ thanh toán
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
                          <XCircle size={11} /> Đã hủy
                        </Badge>
                      )}
                    </td>

                    <td className="p-4 text-muted-foreground">
                      <p>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
                      <p className="text-[10px]">
                        {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve Order (Manual Credit) */}
                        {isPendingOrder ? (
                          <>
                            <form
                              action={(formData) => {
                                startGlobalLoading("Đang duyệt đơn và cộng credits...");
                                startTransition(async () => {
                                  await approveOrderAction(formData);
                                  stopGlobalLoading();
                                });
                              }}
                            >
                              <input type="hidden" name="id" value={order.id} />
                              <Button
                                type="submit"
                                size="sm"
                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1 shadow"
                              >
                                <Check size={12} />
                                <span>Duyệt đơn</span>
                              </Button>
                            </form>

                            <form
                              action={(formData) => {
                                startGlobalLoading("Đang hủy đơn...");
                                startTransition(async () => {
                                  await cancelOrderAction(formData);
                                  stopGlobalLoading();
                                });
                              }}
                            >
                              <input type="hidden" name="id" value={order.id} />
                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                              >
                                <X size={12} />
                                <span>Hủy</span>
                              </Button>
                            </form>
                          </>
                        ) : null}

                        {/* Delete Order if cancelled/failed */}
                        {!isPaid && !isPendingOrder ? (
                          <form
                            action={(formData) => {
                              startGlobalLoading("Đang xóa đơn...");
                              startTransition(async () => {
                                await deleteOrderAction(formData);
                                stopGlobalLoading();
                              });
                            }}
                          >
                            <input type="hidden" name="id" value={order.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-400"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filteredOrders.length ? (
          <div className="p-10 text-center space-y-2">
            <ReceiptText size={32} className="mx-auto text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs text-muted-foreground">Thử tìm bằng mã đơn khác hoặc xóa bộ lọc.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
