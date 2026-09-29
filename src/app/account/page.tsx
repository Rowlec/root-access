import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Coins,
  CreditCard,
  FolderGit2,
  GraduationCap,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { getDb } from "@/db";
import { creditTransactions, profiles, projects } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { RealResultForm } from "./RealResultForm";

export default async function AccountPage() {
  let user: any;
  try {
    user = await ensureCurrentUser();
  } catch {
    redirect("/sign-in?next=/account");
  }

  const db = getDb();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(10);

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Header Profile & Credits */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tài khoản sinh viên
          </span>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {user.displayName || user.email}
          </h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3.5 text-center">
            <span className="block text-xs text-muted-foreground">Số dư hiện tại</span>
            <span className="text-2xl font-black text-primary">
              {profile?.credits ?? 5} <span className="text-sm font-semibold">credits</span>
            </span>
          </div>

          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/20"
          >
            <CreditCard size={15} /> Nạp thêm credit
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 2. Danh sách dự án */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FolderGit2 size={18} className="text-blue-400" />
              Dự án Startup Proposal ({userProjects.length})
            </h2>
            <Link
              href="/connect-extension"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mở Extension
            </Link>
          </div>

          <div className="space-y-3">
            {userProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                Chưa có dự án nào. Hãy mở Chrome Extension để tạo dự án đầu tiên!
              </div>
            ) : (
              userProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-2 hover:border-primary/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">
                        {p.name || p.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {p.idea || p.startupIdea}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span>Gói: {p.packId}</span>
                    <span>{new Date(p.updatedAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Lịch sử biến động credit */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Coins size={18} className="text-amber-400" />
            Lịch sử biến động Credit
          </h2>

          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                Chưa có giao dịch credit nào.
              </div>
            ) : (
              transactions.map((tx) => {
                const isPositive = tx.delta > 0;
                const reasonLabels: Record<string, string> = {
                  signup_bonus: "Tặng khi đăng ký tài khoản",
                  grade: "Chấm câu trả lời theo rubric",
                  refund: "Hoàn credit do lỗi hệ thống",
                  purchase: "Nạp thêm lượt chấm",
                  admin: "Điều chỉnh bởi Quản trị viên",
                };

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3 text-xs"
                  >
                    <div>
                      <span className="font-medium text-foreground block">
                        {reasonLabels[tx.reason] || tx.reason}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <span
                      className={`font-bold text-sm ${
                        isPositive ? "text-emerald-400" : "text-slate-300"
                      }`}
                    >
                      {isPositive ? `+${tx.delta}` : tx.delta}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Form Báo kết quả checkpoint thật (Mục 16.2) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <GraduationCap size={20} className="text-primary" />
            Báo kết quả Checkpoint thật (Đối chiếu với giảng viên)
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Giúp team kiểm chứng độ chính xác của bộ chấm (Mục 16.2). Sau khi có nhận xét hoặc điểm thật từ giảng viên môn EXE, bạn có thể gửi lại vào đây để hệ thống tiếp tục học hỏi và tối ưu hóa rubric.
          </p>
        </div>

        <RealResultForm
          projects={userProjects.map((p) => ({
            id: p.id,
            name: p.name || p.title,
          }))}
        />
      </div>
    </div>
  );
}
