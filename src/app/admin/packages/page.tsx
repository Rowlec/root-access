import { Boxes, Power } from "lucide-react";

import { deletePackageAction, togglePackageAction, upsertPackageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminPackages } from "@/lib/server/admin";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export default async function AdminPackagesPage() {
  const packages = await getAdminPackages();
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><Boxes className="text-primary" /><h1 className="text-3xl font-semibold">Gói credits</h1></div>
      <form action={upsertPackageAction} className="mt-7 grid gap-3 rounded-2xl border border-border bg-card/70 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <label className="grid gap-1 text-sm">ID<Input name="id" placeholder="starter" required /></label><label className="grid gap-1 text-sm">Tên<Input name="name" placeholder="Starter" required /></label><label className="grid gap-1 text-sm">Credits<Input name="credits" type="number" min="1" required /></label><label className="grid gap-1 text-sm">Giá VND<Input name="priceVnd" type="number" min="1000" required /></label><Button type="submit">Tạo / cập nhật</Button>
      </form>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {packages.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-card/70 p-5"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{item.name}</h2><p className="text-xs text-muted-foreground">{item.id}</p></div><span className={item.isActive ? "text-xs text-emerald-400" : "text-xs text-muted-foreground"}>{item.isActive ? "Đang bán" : "Đã ẩn"}</span></div><p className="mt-4 text-3xl font-semibold text-primary">{item.credits} credits</p><p className="mt-1 text-muted-foreground">{item.priceVnd.toLocaleString("vi-VN")}đ</p><div className="mt-5 flex gap-2"><form action={togglePackageAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(!item.isActive)} /><Button size="sm" variant="outline"><Power />{item.isActive ? "Ẩn" : "Bật"}</Button></form>{item.id !== "starter" && item.id !== "pro" ? <form action={deletePackageAction}><input type="hidden" name="id" value={item.id} /><ConfirmSubmitButton message={`Xóa gói “${item.name}”?`} /></form> : null}</div></article>)}
      </div>
    </main>
  );
}
