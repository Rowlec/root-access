import React from "react";
import { ArrowLeft, CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../../lib/api";

export function OutOfCreditsScreen({ onBack }: { onBack: () => void }) {
  const handleOpenPricing = () => {
    const url = `${API_BASE_URL}/pricing`;
    if (chrome?.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4 text-center justify-between">
      <div className="flex items-center justify-start border-b border-white/10 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      <div className="my-auto space-y-5 max-w-xs mx-auto">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <CreditCard size={28} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-white">Bạn đã dùng hết lượt chấm</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mỗi lượt chấm tốn 1 credit để chi trả cho mô hình AI phân tích sâu. Tuy nhiên, tính năng dựng prompt và chèn prompt vẫn hoàn toàn miễn phí.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-left text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-slate-200">
            <span>Gói Starter:</span>
            <strong className="text-emerald-400">19.000đ / 20 lượt chấm</strong>
          </div>
          <div className="flex items-center justify-between text-slate-200">
            <span>Gói Pro:</span>
            <strong className="text-blue-400">39.000đ / 50 lượt chấm</strong>
          </div>
        </div>

        <button
          onClick={handleOpenPricing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-orange-500"
        >
          <ExternalLink size={15} /> Mua thêm lượt chấm trên Web
        </button>
      </div>

      <div className="pt-2">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          Tiếp tục chèn prompt miễn phí
        </button>
      </div>
    </div>
  );
}
