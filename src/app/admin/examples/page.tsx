import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { examples } from "@/db/schema";
import { createExampleAction, deleteExampleAction } from "../actions";
import { BookOpen, CheckCircle, Plus, Sparkles, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminExamplesPage() {
  const db = getDb();
  const list = await db
    .select()
    .from(examples)
    .orderBy(desc(examples.createdAt));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="size-4" />
            Quản trị nội dung & dữ liệu
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Thư viện bài mẫu điểm cao
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Các đoạn trích ngắn (1–3 câu) từ proposal đạt điểm 9–10 làm mốc đối sánh cho bộ chấm AI và hướng dẫn sinh viên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-center">
            <span className="block text-2xl font-extrabold text-foreground">{list.length}</span>
            <span className="text-[11px] text-muted-foreground font-medium">Đoạn mẫu Tốt</span>
          </div>
        </div>
      </div>

      {/* Add New Example Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Plus className="size-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">
            Thêm đoạn mẫu điểm cao mới
          </h2>
        </div>

        <form action={createExampleAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Môn học
              </label>
              <input
                type="text"
                name="course"
                defaultValue="EXE101"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Checkpoint
              </label>
              <input
                type="text"
                name="checkpoint"
                defaultValue="Checkpoint 2"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Phần (Section)
              </label>
              <select
                name="section_key"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="problem">problem (Vấn đề)</option>
                <option value="customer">customer (Khách hàng)</option>
                <option value="solution">solution (Giải pháp)</option>
                <option value="revenue">revenue (Doanh thu)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Mã tiêu chí (Criterion Key)
              </label>
              <select
                name="criterion_key"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="specificity">specificity (Tính cụ thể ngách/vấn đề)</option>
                <option value="urgency">urgency (Tính cấp thiết)</option>
                <option value="current_alternatives">current_alternatives (Giải pháp thay thế hiện tại)</option>
                <option value="target_segment">target_segment (Phân khúc mục tiêu)</option>
                <option value="early_adopters">early_adopters (Nhóm khách hàng tiên phong)</option>
                <option value="problem_solution_fit">problem_solution_fit (Khớp vấn đề - giải pháp)</option>
                <option value="value_proposition">value_proposition (Đề xuất giá trị độc đáo)</option>
                <option value="pricing_logic">pricing_logic (Logic định giá)</option>
                <option value="viability">viability (Tính khả thi tài chính)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Mức điểm bài thật
              </label>
              <input
                type="text"
                name="reported_score"
                defaultValue="9.5/10"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Nguồn mẫu
              </label>
              <select
                name="source_type"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="senior">Anh/chị khóa trước (senior)</option>
                <option value="lecturer">Giảng viên / mentor chia sẻ (lecturer)</option>
                <option value="public">Bài đăng công khai có điểm (public)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Đánh giá mức
              </label>
              <select
                name="level"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="TOT">TOT (Tốt - Đạt mốc cao nhất)</option>
                <option value="DAT">DAT (Đạt)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Đoạn văn trích dẫn (1–3 câu từ bài làm mẫu)
            </label>
            <textarea
              name="excerpt"
              rows={3}
              required
              placeholder="Ví dụ: 'Nhân viên văn phòng nữ 25–30 tuổi tại Q.1, TP.HCM, thường xuyên đặt ăn trưa qua app nhưng 80% phàn nàn thời gian giao trễ...'"
              className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Vì sao tốt (Công thức hành văn đúc kết để AI & sinh viên học tập)
            </label>
            <input
              type="text"
              name="why_good"
              required
              placeholder="Ví dụ: '1 nhóm · 1 nơi · 1 hành vi đếm được · có số liệu phỏng vấn thực địa'"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="size-3.5" />
              Lưu bài mẫu vào thư viện
            </button>
          </div>
        </form>
      </div>

      {/* Examples Table / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-foreground font-serif">
            Danh sách đoạn mẫu hiện có ({list.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Hiển thị tự động theo môn, checkpoint và phần chấm
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((ex) => (
            <div
              key={ex.id}
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-bold">
                      {ex.sectionKey}
                    </span>
                    <span className="rounded-lg bg-muted text-foreground px-2 py-0.5 text-[11px] font-mono">
                      {ex.criterionKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                      ✓ {ex.level} {ex.reportedScore ? `(${ex.reportedScore})` : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {ex.sourceType}
                    </span>
                  </div>
                </div>

                <blockquote className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-foreground font-mono leading-relaxed italic">
                  "{ex.excerpt}"
                </blockquote>

                <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 text-xs text-primary flex items-start gap-1.5">
                  <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Vì sao tốt: </span>
                    <span>{ex.whyGood}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{ex.course} · {ex.checkpoint}</span>
                <form action={deleteExampleAction}>
                  <input type="hidden" name="id" value={ex.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="size-3" />
                    Xóa
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
