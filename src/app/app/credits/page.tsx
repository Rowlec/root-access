import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCreditHistory } from "@/lib/server/projects";

const reasonLabels: Record<string, string> = {
  ai_refund: "Hoàn credit do AI lỗi",
  ai_usage: "Sử dụng AI",
  credit_purchase: "Mua credit",
  manual_adjustment: "Admin điều chỉnh",
  signup_bonus: "Credit đăng ký",
};

export default async function CreditsPage() {
  const { entries, wallet } = await getCreditHistory();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="flex items-center gap-3"><Coins className="text-primary" /><h1 className="text-3xl font-semibold">Lịch sử credits</h1></div><p className="mt-2 text-muted-foreground">Mọi lần cộng, trừ và hoàn credit đều được ghi server-side.</p></div>
        <div className="rounded-2xl border border-border bg-card px-5 py-3"><span className="text-sm text-muted-foreground">Số dư </span><strong className="text-2xl text-primary">{wallet?.balance ?? 0}</strong></div>
      </div>
      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card/70">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0">
            <div><p className="font-medium">{reasonLabels[entry.reason] ?? entry.reason}</p><p className="mt-1 text-xs text-muted-foreground">{entry.createdAt.toLocaleString("vi-VN")} · số dư sau giao dịch: {entry.balanceAfter}</p></div>
            <strong className={entry.amount >= 0 ? "text-emerald-400" : "text-foreground"}>{entry.amount >= 0 ? "+" : ""}{entry.amount}</strong>
          </div>
        ))}
        {!entries.length ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có giao dịch.</p> : null}
      </div>
      <Button asChild className="mt-5"><Link href="/app/billing">Mua thêm credits <ArrowRight /></Link></Button>
    </main>
  );
}
