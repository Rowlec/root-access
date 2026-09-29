import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Compass,
  Database,
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

        <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
          Viết từng phần Startup Proposal ngay trong{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
            ChatGPT hoặc Gemini
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
          Biết luôn phần nào đạt, phần nào sẽ bị trừ điểm theo tiêu chí rubric chính thức của môn Khởi nghiệp, không cần chuyển tab thủ công.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/connect-extension"
            className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition"
          >
            <Compass className="size-5" />
            Cài Extension cho Chrome
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-card transition"
          >
            Xem bảng giá credit
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="pt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-400" /> Tặng 5 lượt chấm miễn phí
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-400" /> Chèn prompt không giới hạn
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-400" /> Chuẩn rubric FPT
          </span>
        </div>
      </section>

      {/* 2. Vòng lặp 4 bước (Visual Interactive Loop Demo) */}
      <section className="space-y-8 rounded-3xl border border-border/80 bg-card/40 p-6 sm:p-10 backdrop-blur-xl">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground">
            Vòng lặp tối ưu bài viết trong 15 giây
          </h2>
          <p className="text-sm text-muted-foreground">
            Không cần copy paste qua lại giữa 4 cửa sổ tab. Mọi thao tác diễn ra ngay cạnh câu trả lời của AI.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-bold">
              1
            </div>
            <h3 className="font-semibold text-foreground">Chèn prompt mẫu</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Extension tự động tổng hợp thông tin dự án và tiêu chí rubric để điền prompt sắc bén vào ô chat. Bạn chỉ cần bấm Gửi.
            </p>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold">
              2
            </div>
            <h3 className="font-semibold text-foreground">AI sinh nội dung</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ChatGPT hoặc Gemini trả lời. Extension theo dõi trạng thái stream và mở khóa nút Chấm ngay khi AI hoàn tất.
            </p>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold">
              3
            </div>
            <h3 className="font-semibold text-foreground">Chấm theo Rubric</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chỉ 1 click: Kiểm tra phát hiện số liệu bịa, phân loại từng tiêu chí (Chưa đạt / Đạt / Tốt), trích dẫn bằng chứng cụ thể.
            </p>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 font-bold">
              4
            </div>
            <h3 className="font-semibold text-foreground">Sửa và Chấm lại</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bấm nút sửa thông minh, nhập dữ liệu thật của nhóm nếu cần, chèn prompt sửa và so sánh trực quan các tiêu chí đã tiến bộ.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Screenshots & Tính năng cốt lõi */}
      <section className="space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground">
            Thiết kế dành riêng cho môi trường làm việc thật
          </h2>
          <p className="text-sm text-muted-foreground">
            Bảo vệ điểm số của bạn trước các bẫy phổ biến: số liệu ảo, giải pháp thay thế mờ nhạt, phân khúc quá rộng.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-foreground">Chống AI bịa số liệu</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tự động quét và cảnh báo các con số phần trăm, doanh thu, số lượng người dùng mà nhóm chưa từng khảo sát. Tránh bị giảng viên trừ điểm nặng.
            </p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/90 italic">
              &ldquo;Số liệu 45% sinh viên không có trong dữ liệu khảo sát của nhóm. Kiểm tra lại hoặc thay bằng dữ liệu thật.&rdquo;
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-foreground">Không hứa hẹn điểm số ảo</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Không đưa ra điểm số vô căn cứ kiểu 8/10 hay 9/10. Chỉ hiển thị 3 mức rõ ràng: Chưa đạt, Đạt, Tốt kèm trích dẫn nguyên văn lý do từ bài làm.
            </p>
            <div className="flex gap-2">
              <span className="badge-chua-dat px-2.5 py-1 rounded-full text-xs font-semibold">Chưa đạt</span>
              <span className="badge-dat px-2.5 py-1 rounded-full text-xs font-semibold">Đạt</span>
              <span className="badge-tot px-2.5 py-1 rounded-full text-xs font-semibold">Tốt</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <RotateCcw size={20} />
            </div>
            <h3 className="font-bold text-foreground">Dự đoán câu hỏi hội đồng</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chỉ ra ngay tối đa 3 câu hỏi hóc búa nhất mà hội đồng phản biện sẽ chất vấn đối với phần viết của bạn, giúp nhóm chủ động chuẩn bị câu trả lời.
            </p>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-[11px] text-purple-200">
              &ldquo;Nhóm đã phỏng vấn bao nhiêu người để khẳng định thị trường đang thiếu giải pháp này?&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* 4. Mục "Chúng tôi đọc gì từ trang chat của bạn" (Mục 14.1) */}
      <section className="rounded-3xl border border-border bg-card/60 p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Minh bạch dữ liệu: Chúng tôi đọc gì từ trang chat của bạn?
            </h2>
            <p className="text-xs text-muted-foreground">
              Cam kết bảo mật tuyệt đối cho sinh viên theo tiêu chuẩn kiểm duyệt của Chrome Web Store.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Extension CÓ đọc
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Nội dung câu trả lời AI cuối cùng</strong>, và <em>chỉ đọc duy nhất khi bạn chủ động bấm nút &ldquo;Chấm&rdquo;</em>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Trạng thái trang:</strong> Kiểm tra xem trang đã sẵn sàng có ô nhập prompt chưa, và AI có đang trong quá trình stream chữ hay không để mở khóa nút Chấm.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 space-y-3">
            <h3 className="font-bold text-red-400 text-sm flex items-center gap-2">
              <ShieldCheck size={16} /> Extension TUYỆT ĐỐI KHÔNG đọc
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Không đọc lịch sử chat</strong>, các cuộc trò chuyện trước đây, danh sách chat ở thanh bên trái hay tên tài khoản ChatGPT/Gemini của bạn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong>Không đọc bất kỳ trang web nào khác</strong> ngoài <code>chatgpt.com</code> và <code>gemini.google.com</code>. Không chạy ngầm khi không sử dụng.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (Bảng giá Mục 13) */}
      <section className="space-y-8 text-center">
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground">
            Bảng giá minh bạch – Không phí ẩn
          </h2>
          <p className="text-sm text-muted-foreground">
            Chèn prompt hoàn toàn miễn phí. Chỉ tiêu tốn 1 credit khi bạn thực hiện chấm bài chuyên sâu.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {/* Starter Pack */}
          <div className="rounded-3xl border border-border bg-card p-8 text-left space-y-6 flex flex-col justify-between hover:border-primary/50 transition">
            <div className="space-y-4">
              <Badge variant="secondary">Gói Starter</Badge>
              <div>
                <span className="text-3xl font-extrabold text-foreground">19.000đ</span>
                <span className="text-xs text-muted-foreground ml-2">/ 20 lượt chấm</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Phù hợp cho 1 nhóm hoàn thiện trọn vẹn 1 checkpoint proposal (Problem, Customer, Solution, Revenue).
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> 20 lượt chấm theo rubric EXE
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> Không giới hạn lượt chèn prompt
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> Phát hiện số liệu bịa & câu hỏi phản biện
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="block w-full text-center rounded-xl bg-secondary py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition"
            >
              Chọn gói Starter
            </Link>
          </div>

          {/* Pro Pack */}
          <div className="relative rounded-3xl border-2 border-primary bg-card/90 p-8 text-left space-y-6 flex flex-col justify-between shadow-xl shadow-primary/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary text-primary-foreground">Được chọn nhiều nhất</Badge>
                <span className="text-[11px] font-semibold text-emerald-400">Tiết kiệm 25%</span>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-foreground">39.000đ</span>
                <span className="text-xs text-muted-foreground ml-2">/ 50 lượt chấm</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Đủ cho cả nhóm tinh chỉnh qua nhiều lần sửa và chấm lại xuyên suốt cả kỳ học đến ngày thuyết trình.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> 50 lượt chấm theo rubric EXE
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> Không giới hạn lượt chèn prompt
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" /> Hỗ trợ sửa không giới hạn
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="block w-full text-center rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/20"
            >
              Chọn gói Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 pt-8 pb-12 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          © 2026 RootAccess • Hướng dẫn kỹ thuật EXE101
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">Chính sách bảo mật</Link>
          <Link href="/pricing" className="hover:text-foreground">Bảng giá</Link>
          <Link href="/connect-extension" className="hover:text-foreground">Kết nối Extension</Link>
        </div>
      </footer>
    </div>
  );
}
