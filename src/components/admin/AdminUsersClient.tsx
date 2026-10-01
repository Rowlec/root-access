"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Lock,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  addAdminByEmailAction,
  adjustUserCreditsAction,
  updateUserAccessAction,
} from "@/app/admin/actions";
import { startGlobalLoading, stopGlobalLoading } from "@/components/loading/GlobalLoading";

type AdminUser = {
  authUserId: string | null;
  createdAt: Date;
  displayName: string | null;
  email: string | null;
  id: string;
  isDisabled: boolean;
  role: "user" | "admin";
  balance: number;
};

export function AdminUsersClient({
  users,
  currentAdminEmail,
}: {
  users: AdminUser[];
  currentAdminEmail?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user" | "disabled">("all");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search match
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        u.email?.toLowerCase().includes(query) ||
        u.displayName?.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query);

      if (!matchSearch) return false;

      // Filter match
      if (filterRole === "admin") return u.role === "admin";
      if (filterRole === "user") return u.role === "user" && !u.isDisabled;
      if (filterRole === "disabled") return u.isDisabled;
      return true;
    });
  }, [users, search, filterRole]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;
  const disabledCount = users.filter((u) => u.isDisabled).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Add Admin Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="text-primary size-7" />
            <span>Quản lý Người dùng & Admin</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Hệ thống hỗ trợ nhiều Quản trị viên cùng lúc. Cấp quyền, nạp/trừ credits và khóa tài khoản vi phạm.
          </p>
        </div>

        <Button
          onClick={() => setShowAddAdminModal(true)}
          className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 h-10 px-4 font-semibold text-xs"
        >
          <UserPlus size={16} />
          <span>Thêm Quản trị viên mới</span>
        </Button>
      </div>

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterRole("all")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterRole === "all"
              ? "border-primary/50 bg-primary/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Tất cả tài khoản</p>
          <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
        </button>

        <button
          onClick={() => setFilterRole("admin")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterRole === "admin"
              ? "border-purple-500/50 bg-purple-500/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-purple-300 font-medium">Quản trị viên</p>
            <Crown size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-200 mt-1">{adminCount}</p>
        </button>

        <button
          onClick={() => setFilterRole("user")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterRole === "user"
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <p className="text-xs text-emerald-400 font-medium">Sinh viên / Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{userCount}</p>
        </button>

        <button
          onClick={() => setFilterRole("disabled")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterRole === "disabled"
              ? "border-rose-500/50 bg-rose-500/10 shadow-sm"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <p className="text-xs text-rose-400 font-medium">Đã bị khóa</p>
          <p className="text-2xl font-bold text-rose-300 mt-1">{disabledCount}</p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email, tên hiển thị hoặc mã user..."
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

      {/* Users List */}
      <div className="grid gap-3.5">
        {filteredUsers.map((user) => {
          const isSelf = Boolean(currentAdminEmail && user.email?.toLowerCase() === currentAdminEmail.toLowerCase());
          const isAdmin = user.role === "admin";

          return (
            <article
              key={user.id}
              className={`rounded-2xl border p-5 transition-all ${
                isAdmin
                  ? "border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-card/70 to-card/70 shadow-sm"
                  : user.isDisabled
                  ? "border-rose-500/20 bg-rose-950/10 opacity-75"
                  : "border-border bg-card/70 hover:border-border/90"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* User Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-bold text-sm shadow-sm ${
                      isAdmin
                        ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {user.displayName?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {user.displayName || "Chưa đặt tên"}
                      </h3>
                      {isAdmin ? (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] gap-1 px-2 py-0.5 font-bold">
                          <Crown size={11} className="text-yellow-400" />
                          <span>ADMIN</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
                          Sinh viên
                        </Badge>
                      )}

                      {user.isDisabled ? (
                        <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] gap-1 px-1.5 py-0">
                          <Lock size={10} /> Đã khóa
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          <span>Hoạt động</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {user.email || "Chưa có email"}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span>Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">
                        Số dư: <strong>{user.balance}</strong> credits
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60">
                  {/* Quick Credit Add Form */}
                  <form
                    action={(formData) => {
                      startGlobalLoading("Đang cập nhật credits người dùng...");
                      startTransition(async () => {
                        await adjustUserCreditsAction(formData);
                        stopGlobalLoading();
                      });
                    }}
                    className="flex items-center gap-1.5 bg-background/60 border border-border p-1 rounded-xl"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <Coins size={14} className="text-primary ml-2 shrink-0" />
                    <input
                      name="delta"
                      type="number"
                      defaultValue="10"
                      className="w-14 bg-transparent text-xs text-foreground font-bold text-center focus:outline-none"
                    />
                    <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/20">
                      Nạp/Trừ
                    </Button>
                  </form>

                  {/* Role & Status Controls */}
                  {!isSelf ? (
                    <form
                      action={(formData) => {
                        startGlobalLoading("Đang cập nhật quyền truy cập...");
                        startTransition(async () => {
                          await updateUserAccessAction(formData);
                          stopGlobalLoading();
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={user.id} />

                      {/* Role Dropdown */}
                      <select
                        name="role"
                        defaultValue={user.role}
                        onChange={(e) => e.target.form?.requestSubmit()}
                        className="h-9 rounded-xl border border-border bg-card px-2.5 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="user">Role: Sinh viên</option>
                        <option value="admin">Role: 👑 Quản trị viên</option>
                      </select>

                      {/* Lock / Unlock Toggle Button */}
                      <input
                        type="hidden"
                        name="disabled"
                        value={user.isDisabled ? "false" : "true"}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant={user.isDisabled ? "default" : "outline"}
                        className={`h-9 px-3 text-xs gap-1.5 ${
                          user.isDisabled
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                        }`}
                      >
                        {user.isDisabled ? (
                          <>
                            <Unlock size={13} />
                            <span>Mở khóa</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} />
                            <span>Khóa</span>
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic px-2">
                      (Tài khoản của bạn)
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {!filteredUsers.length ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center space-y-2">
            <Users size={32} className="mx-auto text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">Không tìm thấy người dùng nào</p>
            <p className="text-xs text-muted-foreground">Thử tìm bằng từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        ) : null}
      </div>

      {/* Modal: Thêm Quản trị viên mới */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-purple-500/40 bg-card p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Crown size={20} />
                <h3 className="font-bold text-base text-foreground">
                  Thêm Quản trị viên mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhập email Google hoặc Email của cộng sự bạn muốn phân quyền Admin. 
              Tài khoản này sẽ có <strong>toàn quyền quản trị</strong> (quản lý user, đơn hàng, gói cước và audit log).
            </p>

            <form
              action={async (formData) => {
                setShowAddAdminModal(false);
                startGlobalLoading("Đang cấp quyền Quản trị viên...");
                startTransition(async () => {
                  await addAdminByEmailAction(formData);
                  stopGlobalLoading();
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email Quản trị viên:
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="ví dụ: colleague@gmail.com"
                    className="pl-10 h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-[11px] text-purple-200 leading-relaxed">
                💡 <em>Mẹo:</em> Người được cấp quyền sẽ tự động thành Admin ngay cả khi họ chưa từng đăng ký tài khoản trước đó.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAdminModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold gap-1.5"
                >
                  <Check size={14} />
                  <span>Xác nhận cấp quyền Admin</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
