import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft size={14} /> Quay lại trang chủ
        </Link>
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          Chính sách bảo mật & Quyền riêng tư
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Chính sách bảo mật RootAccess
        </h1>
        <p className="text-xs text-muted-foreground">
          Cập nhật lần cuối: Tháng 9/2026 • Áp dụng cho Web App và Chrome Extension RootAccess
        </p>
      </div>

      {/* Core Table Section (Mục 14.1) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            1. Tiện ích mở rộng (Chrome Extension) đọc và không đọc những gì?
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chúng tôi cam kết minh bạch tuyệt đối về phạm vi dữ liệu mà tiện ích mở rộng tương tác trên trình duyệt của bạn:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-border/80 rounded-2xl overflow-hidden">
            <thead className="bg-muted/40 text-foreground font-semibold border-b border-border/80">
              <tr>
                <th className="p-4 w-1/2">Extension ĐỌC</th>
                <th className="p-4 w-1/2">Extension TUYỆT ĐỐI KHÔNG ĐỌC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[var(--ink-2)]">
              <tr>
                <td className="p-4 align-top space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[var(--ok)] shrink-0 mt-0.5" />
                    <span>
                      <strong>Nội dung câu trả lời AI cuối cùng trên trang:</strong> Chỉ đọc khi người dùng chủ động bấm nút <em>&ldquo;Chấm câu trả lời này&rdquo;</em> trên Side Panel.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[var(--ok)] shrink-0 mt-0.5" />
                    <span>
                      <strong>Trạng thái giao diện trang AI:</strong> Kiểm tra sự hiện diện của ô nhập prompt và nút Stop (để nhận biết AI có đang stream chữ hay không).
                    </span>
                  </div>
                </td>
                <td className="p-4 align-top space-y-2 bg-[var(--bad-bg)]/40">
                  <div className="flex items-start gap-2">
                    <XCircle size={16} className="text-[var(--bad)] shrink-0 mt-0.5" />
                    <span>
                      <strong>Lịch sử chat & các cuộc trò chuyện khác:</strong> Không bao giờ đọc danh sách trò chuyện ở thanh điều hướng, các tin nhắn cũ hay tên tài khoản của bạn.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle size={16} className="text-[var(--bad)] shrink-0 mt-0.5" />
                    <span>
                      <strong>Bất kỳ trang web nào khác:</strong> Extension chỉ hoạt động trên <code className="px-1 py-0.5 rounded bg-white/80 border border-red-200 font-mono text-[11px]">chatgpt.com</code> và <code className="px-1 py-0.5 rounded bg-white/80 border border-red-200 font-mono text-[11px]">gemini.google.com</code>. Không có quyền trên bất kỳ trang web nào khác.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle size={16} className="text-[var(--bad)] shrink-0 mt-0.5" />
                    <span>
                      <strong>Không tự động chạy ngầm:</strong> Không tự ý đọc văn bản khi người dùng chưa nhấn lệnh Chấm.
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Protection Checklist (Mục 14.2) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={20} className="text-[var(--ok)]" />
          2. Tiêu chuẩn bảo vệ dữ liệu & Bảo mật hệ thống
        </h2>
        <ul className="space-y-3 text-xs text-[var(--ink-2)] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[var(--ok)] font-bold">•</span>
            <span><strong>Bảo mật API Key:</strong> Mọi API Key mô hình trí tuệ nhân tạo (LLM) được lưu trữ độc quyền trên môi trường máy chủ bảo mật (Server-side environment). Không có bất kỳ API Key nào được đóng gói hay để lộ trong mã nguồn Extension.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--ok)] font-bold">•</span>
            <span><strong>Phân quyền Row-Level Security:</strong> Người dùng chỉ có quyền truy cập dữ liệu dự án và kết quả chấm của chính mình. Cơ chế phân quyền ngăn chặn hoàn toàn việc rò rỉ dữ liệu giữa các nhóm.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--ok)] font-bold">•</span>
            <span><strong>Quyền xóa dữ liệu của người dùng:</strong> Khi người dùng thực hiện xóa dự án, toàn bộ kết quả chấm (grades), prompt đã chèn (prompt_insertions) và các hành động sửa liên quan sẽ được tự động xóa hoàn toàn khỏi cơ sở dữ liệu.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--ok)] font-bold">•</span>
            <span><strong>Chống can thiệp Prompt Injection:</strong> Dữ liệu bài làm của sinh viên luôn được cô lập an toàn trong cấu trúc định danh trước khi gửi tới bộ chấm, ngăn chặn các rủi ro can thiệp mệnh lệnh hệ thống.</span>
          </li>
        </ul>
      </div>

      {/* Chrome Web Store Single Purpose Notice */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-3 shadow-xs">
        <h2 className="text-base font-bold text-foreground">
          3. Tuyên bố mục đích duy nhất (Single Purpose Declaration)
        </h2>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          RootAccess là tiện ích hỗ trợ sinh viên hoàn thiện Startup Proposal trong môn học Khởi nghiệp bằng cách chèn prompt chuẩn và đánh giá bài làm theo tiêu chí rubric chính thức. Tiện ích chỉ yêu cầu các quyền hạn tối thiểu cần thiết để phục vụ mục đích này (<code>sidePanel</code>, <code>storage</code>, và quyền truy cập <code>chatgpt.com</code>, <code>gemini.google.com</code>).
        </p>
      </div>
    </div>
  );
}
