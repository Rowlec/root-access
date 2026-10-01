"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  History,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AuditLog = {
  action: string;
  adminEmail: string | null;
  createdAt: Date;
  id: string;
  metadata: unknown;
  targetId: string;
  targetType: string;
};

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; category: "users" | "orders" | "packages" | "projects" }
> = {
  admin_added: {
    label: "Thêm Quản trị viên mới",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    category: "users",
  },
  user_credits_adjusted: {
    label: "Điều chỉnh Credit / Token",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    category: "users",
  },
  user_access_updated: {
    label: "Thay đổi Quyền / Khóa tài khoản",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    category: "users",
  },
  order_manually_approved: {
    label: "Duyệt Đơn Hàng thủ công",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    category: "orders",
  },
  order_deleted: {
    label: "Xóa Đơn Hàng",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    category: "orders",
  },
  package_upserted: {
    label: "Cập nhật Gói Credit",
    color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    category: "packages",
  },
  package_toggled: {
    label: "Bật / Tắt Gói Credit",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    category: "packages",
  },
  package_deleted: {
    label: "Xóa Gói Credit",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    category: "packages",
  },
  project_status_updated: {
    label: "Đổi trạng thái Dự án (Lưu trữ / Mở lại)",
    color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    category: "projects",
  },
  project_deleted: {
    label: "Xóa Vĩnh viễn Dự án",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    category: "projects",
  },
};

export function AdminAuditClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "users" | "orders" | "packages" | "projects">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase().trim();
      const cfg = ACTION_CONFIG[log.action];

      if (category !== "all" && cfg?.category !== category) {
        return false;
      }

      if (!q) return true;

      const actionText = (cfg?.label || log.action).toLowerCase();
      const email = (log.adminEmail || "").toLowerCase();
      const target = `${log.targetType}:${log.targetId}`.toLowerCase();
      const meta = JSON.stringify(log.metadata || "").toLowerCase();

      return actionText.includes(q) || email.includes(q) || target.includes(q) || meta.includes(q);
    });
  }, [logs, search, category]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <History className="text-primary size-7" />
            <span>Audit Log & Nhật ký Hệ thống</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi chi tiết các thao tác phân quyền, duyệt đơn, nạp token và quản trị hệ thống theo thời gian thực.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto font-mono text-xs">
          Tổng ghi nhận: {logs.length} sự kiện
        </Badge>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "Tất cả" },
            { id: "users", label: "Người dùng & Admin" },
            { id: "orders", label: "Đơn hàng" },
            { id: "packages", label: "Gói Credit" },
            { id: "projects", label: "Dự án" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id as typeof category)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                category === tab.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-card/70 text-muted-foreground hover:bg-card border border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email admin, hành động, ID đối tượng..."
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
      </div>

      {/* Audit List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const cfg = ACTION_CONFIG[log.action] || {
            label: log.action.replaceAll("_", " "),
            color: "bg-muted text-muted-foreground border-border",
            category: "users",
          };

          const isExpanded = expandedId === log.id;
          const formattedDate = new Date(log.createdAt).toLocaleString("vi-VN", {
            dateStyle: "medium",
            timeStyle: "medium",
          });

          return (
            <article
              key={log.id}
              className="rounded-2xl border border-border bg-card/70 p-4 transition-all hover:border-border/90"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-xl bg-background/80 border border-border/60 shrink-0 mt-0.5 sm:mt-0">
                    <Activity size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`border text-[11px] font-medium ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {log.targetType}:{log.targetId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                        <User size={12} />
                        {log.adminEmail || "Hệ thống / Admin"}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {log.metadata ? (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline self-end sm:self-auto shrink-0 font-medium"
                  >
                    <span>{isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : null}
              </div>

              {/* Collapsible Metadata */}
              {isExpanded && log.metadata ? (
                <div className="mt-3.5 pt-3.5 border-t border-border/60">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Dữ liệu thay đổi (Payload Metadata):
                  </p>
                  <pre className="p-3 rounded-xl bg-background/80 border border-border text-[11px] font-mono text-foreground/90 overflow-x-auto leading-relaxed">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              ) : null}
            </article>
          );
        })}

        {!filteredLogs.length ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-2">
            <History size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Không có nhật ký phù hợp</p>
            <p className="text-xs text-muted-foreground">
              Thử tìm kiếm với từ khóa khác hoặc chuyển bộ lọc về &quot;Tất cả&quot;.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
