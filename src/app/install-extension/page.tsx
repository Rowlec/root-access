"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  ExternalLink,
  FolderArchive,
  Layers,
  Puzzle,
  Sparkles,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallExtensionPage() {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("chrome://extensions/");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-8">
      {/* Header & Stepper */}
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/20">
          <Puzzle size={30} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cài đặt Root Access Chrome Extension
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tiện ích AI sidepanel hỗ trợ sinh viên FPT chấm bài và chuẩn hóa proposal theo rubric EXE101 ngay trên ChatGPT & Gemini.
          </p>
        </div>

        {/* Stepper tracker */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-primary">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              1
            </span>
            Cài đặt Extension (Hiện tại)
          </span>
          <span className="text-border">/</span>
          <Link
            href="/connect-extension"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground">
              2
            </span>
            Kết nối tài khoản
          </Link>
        </div>
      </div>

      {/* Main Download Hero Card */}
      <section className="glass relative overflow-hidden rounded-3xl border border-primary/30 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 size-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border/70 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Sparkles size={12} /> Phiên bản mới nhất · Miễn phí
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Gói cài đặt Root Access Extension (.zip)
            </h2>
            <p className="text-xs text-muted-foreground">
              Tương thích hoàn toàn với Chrome, Edge, Brave, Cốc Cốc và Opera.
            </p>
          </div>

          <a
            href="/downloads/root-access-extension.zip"
            download="root-access-extension.zip"
            className="inline-flex items-center justify-center gap-2 shrink-0 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <Download size={18} />
            <span>Tải Extension (.zip)</span>
          </a>
        </div>

        {/* 4 Clear Visual Steps */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Hướng dẫn cài đặt trong 4 bước đơn giản:
          </h3>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Step 1 */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 relative">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-xs">
                  1
                </span>
                <span>Tải và Giải nén file</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bấm nút <strong>&ldquo;Tải Extension (.zip)&rdquo;</strong> ở trên. Sau đó chuột phải vào file vừa tải và chọn <strong>Extract All... (Giải nén tất cả)</strong> ra một thư mục.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 relative">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-xs">
                  2
                </span>
                <span>Mở trang Quản lý Tiện ích</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mở một tab mới trên Chrome và dán đường dẫn bên dưới vào thanh địa chỉ:
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <code className="text-[11px] font-mono bg-background px-2 py-1 rounded-md border border-border text-foreground flex-1 truncate">
                  chrome://extensions/
                </code>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="shrink-0 flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {copiedUrl ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span>Đã copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 relative">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-xs">
                  3
                </span>
                <span>Bật Developer Mode</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tại trang tiện ích của Chrome, gạt công tắc <strong>Developer mode (Chế độ cho nhà phát triển)</strong> ở góc trên cùng bên phải sang <strong>BẬT</strong>.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 relative">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-xs">
                  4
                </span>
                <span>Bấm Load Unpacked</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bấm nút <strong>&ldquo;Load unpacked&rdquo; (Tải tiện ích đã giải nén)</strong> ở góc trái trên cùng ➔ Chọn thư mục bạn vừa giải nén ở Bước 1.
              </p>
            </div>
          </div>
        </div>

        {/* CTA: Next Step */}
        <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Cài xong bạn sẽ thấy biểu tượng <strong>Root Access</strong> trên thanh công cụ!</span>
          </div>

          <Button asChild className="w-full sm:w-auto h-11 px-6 font-semibold gap-2 shadow-lg">
            <Link href="/connect-extension">
              <span>Đã cài xong ➔ Đi tới Bước 2: Kết nối tài khoản</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Extra reassurance card */}
      <div className="rounded-2xl border border-border bg-card/40 p-4 text-center text-xs text-muted-foreground space-y-1">
        <p>
          Bạn đã cài đặt Extension từ trước rồi?{" "}
          <Link href="/connect-extension" className="font-semibold text-primary underline underline-offset-4">
            Bấm vào đây để kết nối tài khoản ngay ➔
          </Link>
        </p>
      </div>
    </main>
  );
}
