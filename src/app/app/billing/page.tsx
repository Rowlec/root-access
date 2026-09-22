import { CheckCircle2, Coins, ShieldCheck } from "lucide-react";

import { PurchaseCreditsButton } from "@/components/app/PurchaseCreditsButton";
import { Badge } from "@/components/ui/badge";
import { creditPackages } from "@/lib/billing/packages";
import { isDatabaseConfigured } from "@/db";
import { isPayOSConfigured } from "@/lib/server/payos";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment } = await searchParams;
  const ready = isDatabaseConfigured() && isPayOSConfigured();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <Badge variant="secondary"><Coins className="mr-1 size-3.5" /> Credit wallet</Badge>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Mua thêm credits</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Credits được trừ tại backend khi gọi AI và chỉ được cộng sau webhook thanh toán đã xác minh.</p>

      {payment === "returned" ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
          <CheckCircle2 className="size-4 text-emerald-400" /> Thanh toán đang được xác nhận. Số dư sẽ cập nhật sau khi webhook hợp lệ được xử lý.
        </div>
      ) : null}

      {!ready ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
          <ShieldCheck className="size-4 text-amber-300" /> Thêm DATABASE_URL và ba biến PAYOS_* để bật thanh toán thật.
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {Object.values(creditPackages).map((item) => (
          <section key={item.id} className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="mt-3 text-4xl font-semibold text-primary">{item.credits}</p>
            <p className="text-sm text-muted-foreground">credits dùng cho generate, review và improve</p>
            <p className="my-6 text-2xl font-semibold">{item.priceVnd.toLocaleString("vi-VN")}đ</p>
            <PurchaseCreditsButton disabled={!ready} packageId={item.id} />
          </section>
        ))}
      </div>
    </main>
  );
}
