import { CheckCircle2, Copy, CreditCard, QrCode, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ensureCurrentUser } from "@/lib/server/auth";
import { isPayOSConfigured } from "@/lib/server/payos";
import { PurchaseCreditsButton } from "@/components/app/PurchaseCreditsButton";

export default async function PricingPage() {
  let userCode = "DEMO99";
  let isLoggedIn = false;
  const payOsActive = isPayOSConfigured();

  try {
    const user = await ensureCurrentUser();
    userCode = user.id.slice(0, 6).toUpperCase();
    isLoggedIn = true;
  } catch {
    // Guest
  }

  const bankInfo = {
    bankName: "MB Bank (Ngân hàng Quân Đội)",
    accountNumber: "0987654321",
    accountHolder: "ROOT ACCESS TEAM",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          Bảng giá & Nạp Credit
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Nạp Credit cho nhóm môn EXE
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Tặng 5 lượt chấm miễn phí khi đăng ký. Chèn prompt không giới hạn. Chỉ tốn credit khi bạn chấm bài chi tiết theo rubric.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {/* Starter Pack */}
        <div className="rounded-3xl border border-border bg-card p-8 text-left space-y-6 flex flex-col justify-between hover:border-primary/50 transition">
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
              Gói Starter
            </span>
            <div>
              <span className="text-3xl font-black text-foreground">19.000đ</span>
              <span className="text-xs text-muted-foreground ml-2">/ 20 lượt chấm</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Phù hợp cho 1 nhóm hoàn thiện trọn vẹn 1 checkpoint proposal.
            </p>
            <ul className="space-y-2.5 text-xs text-[var(--ink-2)] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--ok)]" /> 20 lượt chấm theo rubric EXE
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--ok)]" /> Chèn prompt & prompt sửa miễn phí
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--ok)]" /> Kiểm tra số liệu bịa & câu hỏi hội đồng
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            {payOsActive ? (
              isLoggedIn ? (
                <PurchaseCreditsButton packageId="starter" label="Nạp 30 Credit qua PayOS" className="h-11 w-full" />
              ) : (
                <Link href="/sign-in?next=/pricing">
                  <Button variant="secondary" className="h-11 w-full font-medium">
                    Đăng nhập để nạp PayOS
                  </Button>
                </Link>
              )
            ) : null}

            <div className="rounded-2xl border border-border/80 bg-background/50 p-4 text-xs space-y-1">
              <span className="text-muted-foreground block text-[11px]">Hoặc chuyển khoản thủ công cú pháp:</span>
              <code className="text-primary font-mono font-bold text-sm block">
                RA {userCode} STARTER
              </code>
            </div>
          </div>
        </div>

        {/* Pro Pack */}
        <div className="relative rounded-3xl border-2 border-primary bg-card/90 p-8 text-left space-y-6 flex flex-col justify-between shadow-xl shadow-primary/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Gói Pro (Khuyên dùng)
              </span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">Tiết kiệm 25%</span>
            </div>
            <div>
              <span className="text-3xl font-black text-foreground">39.000đ</span>
              <span className="text-xs text-muted-foreground ml-2">/ 80 lượt chấm</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Đủ cho cả nhóm sửa và chấm lại xuyên suốt toàn bộ học kỳ đến ngày báo cáo cuối kỳ.
            </p>
            <ul className="space-y-2.5 text-xs text-[var(--ink-2)] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--ok)]" /> 80 lượt chấm theo rubric EXE
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--ok)]" /> Không giới hạn lượt chèn prompt
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--ok)]" /> Hỗ trợ sửa không giới hạn
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            {payOsActive ? (
              isLoggedIn ? (
                <PurchaseCreditsButton
                  packageId="pro"
                  label="Nạp 80 Credit qua PayOS"
                  className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/25"
                />
              ) : (
                <Link href="/sign-in?next=/pricing">
                  <Button className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    Đăng nhập để nạp Gói Pro
                  </Button>
                </Link>
              )
            ) : null}

            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs space-y-1">
              <span className="text-muted-foreground block text-[11px]">Hoặc chuyển khoản thủ công cú pháp:</span>
              <code className="text-primary font-mono font-bold text-sm block">
                RA {userCode} PRO
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Transfer Information (Mục 13.1) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 max-w-3xl mx-auto shadow-md">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Hướng dẫn thanh toán chuyển khoản (Bản Pilot)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hệ thống hỗ trợ nạp credit tức thì qua quét mã VietQR hoặc chuyển khoản ngân hàng thủ công.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-2 items-center">
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">Ngân hàng:</span>
              <p className="font-semibold text-foreground">{bankInfo.bankName}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">Số tài khoản:</span>
              <p className="font-mono text-base font-bold text-foreground">{bankInfo.accountNumber}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">Chủ tài khoản:</span>
              <p className="font-semibold text-foreground">{bankInfo.accountHolder}</p>
            </div>
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 space-y-1">
              <span className="text-primary font-medium text-[11px]">Cú pháp nội dung chuyển khoản:</span>
              <code className="text-sm font-mono font-black text-primary block">
                RA {userCode}
              </code>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/80 p-5 text-center space-y-2 flex flex-col items-center justify-center">
            {/* VietQR Quick Image */}
            <img
              src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=39000&addInfo=RA%20${userCode}&accountName=ROOT%20ACCESS%20TEAM`}
              alt="Mã QR Chuyển khoản"
              className="size-48 rounded-xl object-contain bg-white p-2 shadow-sm"
            />
            <span className="text-[11px] text-muted-foreground block">
              Quét mã bằng app ngân hàng để điền sẵn cú pháp
            </span>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="rounded-xl border border-amber-300 bg-[var(--mid-bg)] p-3 text-xs text-[var(--mid)] text-center font-medium">
            Bạn chưa đăng nhập. Vui lòng{" "}
            <Link href="/sign-in?next=/pricing" className="underline font-bold text-[var(--ink)]">
              Đăng nhập trước
            </Link>{" "}
            để mã chuyển khoản gắn đúng vào tài khoản của bạn.
          </div>
        )}
      </div>
    </div>
  );
}
