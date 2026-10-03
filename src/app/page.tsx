import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Compass,
  Database,
  Download,
  ExternalLink,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8 space-y-20">
      {/* 1. Hero Section */}
      <section className="relative pt-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Phiên bản Chrome Extension dành riêng cho sinh viên EXE101
        </div>

        <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[var(--ink)]">
          Viết từng phần Startup Proposal ngay trong{" "}
          <span className="text-[var(--accent)] underline decoration-[var(--mark)] decoration-4 underline-offset-4">
            ChatGPT hoặc Gemini
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base text-[var(--ink-2)] sm:text-lg leading-relaxed font-normal">
          Biết luôn phần nào đạt, phần nào sẽ bị trừ điểm theo tiêu chí rubric chính thức của môn Khởi nghiệp, không cần chuyển tab thủ công.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/connect-extension"
            className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition active:scale-[0.98]"
          >
            <Compass className="size-5" />
            Cài Extension cho Chrome
          </Link>
          <a
            href="/downloads/root-access-extension.zip"
            download="root-access-extension.zip"
            className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] transition shadow-xs"
          >
            <Download className="size-4 text-primary" />
            Tải nhanh (.zip)
          </a>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 text-sm font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition shadow-xs"
          >
            Bảng giá
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="pt-2 flex items-center justify-center gap-6 text-xs text-[var(--ink-2)] font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-[var(--ok)]" /> Tặng 5 lượt chấm miễn phí
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-[var(--ok)]" /> Chèn prompt không giới hạn
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-[var(--ok)]" /> Chuẩn rubric FPT
          </span>
        </div>
      </section>

      {/* 2. Vòng lặp 4 bước (Visual Interactive Loop Demo) */}
      <section className="space-y-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-10 shadow-xs">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
            Vòng lặp tối ưu bài viết trong 15 giây
          </h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed font-normal">
            Không cần copy paste qua lại giữa 4 cửa sổ tab. Mọi thao tác diễn ra ngay cạnh câu trả lời của AI.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-3 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 border border-blue-200 font-bold">
              1
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">Chèn prompt mẫu</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Extension tự động tổng hợp thông tin dự án và tiêu chí rubric để điền prompt sắc bén vào ô chat. Bạn chỉ cần bấm Gửi.
            </p>
          </div>

          <div className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-3 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 border border-purple-200 font-bold">
              2
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">AI sinh nội dung</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              ChatGPT hoặc Gemini trả lời. Extension theo dõi trạng thái stream và mở khóa nút Chấm ngay khi AI hoàn tất.
            </p>
          </div>

          <div className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-3 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
              3
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">Chấm theo Rubric</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Chỉ 1 click: Kiểm tra phát hiện số liệu bịa, phân loại từng tiêu chí (Chưa đạt / Đạt / Tốt), trích dẫn bằng chứng cụ thể.
            </p>
          </div>

          <div className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-3 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-200 font-bold">
              4
            </div>
            <h3 className="font-bold text-[var(--ink)] text-sm">Sửa và Chấm lại</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Bấm nút sửa thông minh, nhập dữ liệu thật của nhóm nếu cần, chèn prompt sửa và so sánh trực quan các tiêu chí đã tiến bộ.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Screenshots & Tính năng cốt lõi */}
      <section className="space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
            Thiết kế dành riêng cho môi trường làm việc thật
          </h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed font-normal">
            Bảo vệ điểm số của bạn trước các bẫy phổ biến: số liệu ảo, giải pháp thay thế mờ nhạt, phân khúc quá rộng.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
            <div className="size-10 rounded-xl bg-[var(--mid-bg)] text-[var(--mid)] border border-amber-200 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-base">Chống AI bịa số liệu</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Tự động quét và cảnh báo các con số phần trăm, doanh thu, số lượng người dùng mà nhóm chưa từng khảo sát. Tránh bị giảng viên trừ điểm nặng.
            </p>
            <div className="rounded-xl border border-amber-300 bg-[var(--mid-bg)] p-3 text-xs text-[var(--mid)] font-medium leading-relaxed italic">
              &ldquo;Số liệu 45% sinh viên không có trong dữ liệu khảo sát của nhóm. Kiểm tra lại hoặc thay bằng dữ liệu thật.&rdquo;
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
            <div className="size-10 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-base">Không hứa hẹn điểm số ảo</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Không đưa ra điểm số vô căn cứ kiểu 8/10 hay 9/10. Chỉ hiển thị 3 mức rõ ràng: Chưa đạt, Đạt, Tốt kèm trích dẫn nguyên văn lý do từ bài làm.
            </p>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200 bg-[var(--bad-bg)] text-[var(--bad)]">
                Chưa đạt
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 bg-[var(--mid-bg)] text-[var(--mid)]">
                Đạt
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200 bg-[var(--ok-bg)] text-[var(--ok)]">
                Tốt
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
            <div className="size-10 rounded-xl bg-[var(--ok-bg)] text-[var(--ok)] border border-emerald-200 flex items-center justify-center font-bold">
              <RotateCcw size={20} />
            </div>
            <h3 className="font-bold text-[var(--ink)] text-base">Dự đoán câu hỏi hội đồng</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Chỉ ra ngay tối đa 3 câu hỏi hóc búa nhất mà hội đồng phản biện sẽ chất vấn đối với phần viết của bạn, giúp nhóm chủ động chuẩn bị câu trả lời.
            </p>
            <div className="rounded-xl border border-purple-200 bg-[var(--accent-weak)] p-3 text-xs text-[var(--accent)] font-medium leading-relaxed italic">
              &ldquo;Nhóm đã phỏng vấn bao nhiêu người để khẳng định thị trường đang thiếu giải pháp này?&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* 4. Mục "Chúng tôi đọc gì từ trang chat của bạn" (Mục 14.1) */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[var(--ink)]">
              Minh bạch dữ liệu: Chúng tôi đọc gì từ trang chat của bạn?
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Cam kết bảo mật tuyệt đối cho sinh viên theo tiêu chuẩn kiểm duyệt của Chrome Web Store.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-2">
          <div className="rounded-2xl border border-emerald-300 bg-[var(--ok-bg)]/50 p-5 space-y-3">
            <h3 className="font-bold text-[var(--ok)] text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Extension CÓ đọc
            </h3>
            <ul className="space-y-2 text-xs text-[var(--ink-2)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--ok)] font-bold">•</span>
                <span><strong>Nội dung câu trả lời AI cuối cùng</strong>, và <em>chỉ đọc duy nhất khi bạn chủ động bấm nút &ldquo;Chấm&rdquo;</em>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ok)] font-bold">•</span>
                <span><strong>Trạng thái trang:</strong> Kiểm tra xem trang đã sẵn sàng có ô nhập prompt chưa, và AI có đang trong quá trình stream chữ hay không để mở khóa nút Chấm.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-red-300 bg-[var(--bad-bg)]/50 p-5 space-y-3">
            <h3 className="font-bold text-[var(--bad)] text-sm flex items-center gap-2">
              <ShieldCheck size={16} /> Extension TUYỆT ĐỐI KHÔNG đọc
            </h3>
            <ul className="space-y-2 text-xs text-[var(--ink-2)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--bad)] font-bold">✕</span>
                <span><strong>Không đọc lịch sử chat</strong>, các cuộc trò chuyện trước đây, danh sách chat ở thanh bên trái hay tên tài khoản ChatGPT/Gemini của bạn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--bad)] font-bold">✕</span>
                <span><strong>Không đọc bất kỳ trang web nào khác</strong> ngoài <code className="px-1.5 py-0.5 rounded bg-white/80 border border-red-200 text-[var(--ink)] font-mono text-[11px]">chatgpt.com</code> và <code className="px-1.5 py-0.5 rounded bg-white/80 border border-red-200 text-[var(--ink)] font-mono text-[11px]">gemini.google.com</code>. Không chạy ngầm khi không sử dụng.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (Bảng giá Mục 13) */}
      <section className="space-y-8 text-center">
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">
            Bảng giá minh bạch – Không phí ẩn
          </h2>
          <p className="text-sm text-[var(--muted)] font-normal leading-relaxed">
            Chèn prompt hoàn toàn miễn phí. Chỉ tiêu tốn 1 credit khi bạn thực hiện chấm bài chuyên sâu.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {/* Starter Pack */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-left space-y-6 flex flex-col justify-between hover:border-[var(--line-2)] shadow-xs transition">
            <div className="space-y-4">
              <Badge variant="secondary" className="border border-[var(--line)] bg-[var(--sunken)] text-[var(--ink-2)]">Gói Starter</Badge>
              <div>
                <span className="text-3xl font-extrabold text-[var(--ink)]">19.000đ</span>
                <span className="text-xs text-[var(--muted)] ml-2">/ 20 lượt chấm</span>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Phù hợp cho 1 nhóm hoàn thiện trọn vẹn 1 checkpoint proposal (Problem, Customer, Solution, Revenue).
              </p>
              <ul className="space-y-2.5 text-xs text-[var(--ink-2)] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" /> 20 lượt chấm theo rubric EXE
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" /> Không giới hạn lượt chèn prompt
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" /> Phát hiện số liệu bịa & câu hỏi phản biện
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="block w-full text-center rounded-xl bg-[var(--sunken)] border border-[var(--line)] py-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--line)] transition"
            >
              Chọn gói Starter
            </Link>
          </div>

          {/* Pro Pack */}
          <div className="relative rounded-3xl border-2 border-[var(--accent)] bg-[var(--surface)] p-8 text-left space-y-6 flex flex-col justify-between shadow-xl shadow-[var(--accent)]/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-[var(--accent)] text-white">Được chọn nhiều nhất</Badge>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">Tiết kiệm 25%</span>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-[var(--ink)]">39.000đ</span>
                <span className="text-xs text-[var(--muted)] ml-2">/ 50 lượt chấm</span>
              </div>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Đủ cho cả nhóm tinh chỉnh qua nhiều lần sửa và chấm lại xuyên suốt cả kỳ học đến ngày thuyết trình.
              </p>
              <ul className="space-y-2.5 text-xs text-[var(--ink-2)] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" /> 50 lượt chấm theo rubric EXE
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" /> Không giới hạn lượt chèn prompt
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" /> Hỗ trợ sửa không giới hạn
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="block w-full text-center rounded-xl bg-[var(--accent)] py-2.5 text-xs font-bold text-white hover:bg-[var(--accent)]/90 transition shadow-md shadow-[var(--accent)]/20"
            >
              Chọn gói Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] pt-8 pb-12 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--muted)]">
        <div>
          © 2026 RootAccess • Hướng dẫn kỹ thuật EXE101
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-[var(--ink)]">Chính sách bảo mật</Link>
          <Link href="/pricing" className="hover:text-[var(--ink)]">Bảng giá</Link>
          <Link href="/connect-extension" className="hover:text-[var(--ink)]">Kết nối Extension</Link>
        </div>
      </footer>
    </div>
  );
}
