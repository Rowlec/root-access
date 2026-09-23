import { Coins, ShieldCheck, Users } from "lucide-react";

import { adjustUserCreditsAction, updateUserAccessAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminUsers } from "@/lib/server/admin";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><Users className="text-primary" /><h1 className="text-3xl font-semibold">Quản lý users</h1></div>
      <p className="mt-2 text-muted-foreground">Phân quyền, khóa tài khoản và điều chỉnh credit có audit log.</p>
      <div className="mt-7 grid gap-4">
        {users.map((user) => (
          <article key={user.id} className="grid gap-4 rounded-2xl border border-border bg-card/70 p-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-semibold">{user.displayName || user.email || "Unnamed user"}</h2>{user.role === "admin" ? <ShieldCheck className="size-4 text-primary" /> : null}</div><p className="mt-1 truncate text-sm text-muted-foreground">{user.email ?? user.clerkUserId}</p><p className="mt-2 text-xs text-muted-foreground">Tham gia {user.createdAt.toLocaleDateString("vi-VN")} · {user.balance ?? 0} credits</p></div>
            <form action={updateUserAccessAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <label className="grid gap-1 text-xs text-muted-foreground">Role<select name="role" defaultValue={user.role} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value="user">User</option><option value="admin">Admin</option></select></label>
              <label className="grid gap-1 text-xs text-muted-foreground">Trạng thái<select name="disabled" defaultValue={String(user.isDisabled)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value="false">Hoạt động</option><option value="true">Đã khóa</option></select></label>
              <Button type="submit" size="sm">Cập nhật</Button>
            </form>
            <form action={adjustUserCreditsAction} className="flex items-end gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <label className="grid gap-1 text-xs text-muted-foreground">Cộng/trừ credit<Input name="delta" type="number" defaultValue="10" className="w-24" /></label>
              <Button type="submit" size="sm" variant="outline"><Coins />Áp dụng</Button>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
