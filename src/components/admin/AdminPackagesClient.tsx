"use client";

import { useState, useTransition } from "react";
import {
  Boxes,
  Check,
  Edit3,
  Eye,
  EyeOff,
  PackagePlus,
  Plus,
  Power,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  deletePackageAction,
  togglePackageAction,
  upsertPackageAction,
} from "@/app/admin/actions";
import { startGlobalLoading, stopGlobalLoading } from "@/components/loading/GlobalLoading";

type TokenPackage = {
  credits: number;
  id: string;
  isActive: boolean;
  name: string;
  priceVnd: number;
  updatedAt: Date;
};

export function AdminPackagesClient({ packages }: { packages: TokenPackage[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TokenPackage | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingPackage(null);
    setShowModal(true);
  };

  const handleOpenEdit = (pkg: TokenPackage) => {
    setEditingPackage(pkg);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Boxes className="text-primary size-7" />
            <span>Quản lý Gói Credits & Bảng giá</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Điều chỉnh giá bán, số credits và trạng thái hiển thị của các gói trên trang thanh toán PayOS.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-10 px-4 font-semibold text-xs"
        >
          <PackagePlus size={16} />
          <span>Tạo gói credit mới</span>
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((item) => (
          <article
            key={item.id}
            className={`glass relative rounded-3xl border p-6 flex flex-col justify-between transition-all ${
              item.isActive
                ? "border-primary/40 shadow-[0_0_30px_rgba(168,85,247,0.12)]"
                : "border-border/70 opacity-60 bg-card/40"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    ID: {item.id}
                  </p>
                </div>
                {item.isActive ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] gap-1">
                    <Eye size={10} /> Đang bán
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
                    <EyeOff size={10} /> Đã ẩn
                  </Badge>
                )}
              </div>

              <div className="pt-2">
                <p className="text-4xl font-extrabold text-primary tracking-tight">
                  {item.credits}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">
                    credits
                  </span>
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {item.priceVnd.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Math.round(item.priceVnd / item.credits).toLocaleString("vi-VN")}đ / lượt chấm
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Edit Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(item)}
                  className="h-8 px-2.5 text-xs gap-1 hover:border-primary/50"
                >
                  <Edit3 size={13} />
                  <span>Sửa</span>
                </Button>

                {/* Toggle Active Button */}
                <form
                  action={(formData) => {
                    startGlobalLoading("Đang cập nhật trạng thái gói...");
                    startTransition(async () => {
                      await togglePackageAction(formData);
                      stopGlobalLoading();
                    });
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={item.isActive ? "false" : "true"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant={item.isActive ? "outline" : "default"}
                    className={`h-8 px-2.5 text-xs gap-1 ${
                      item.isActive
                        ? "text-muted-foreground hover:text-foreground"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    <Power size={13} />
                    <span>{item.isActive ? "Ẩn" : "Bật bán"}</span>
                  </Button>
                </form>
              </div>

              {/* Delete Custom Package */}
              {item.id !== "starter" && item.id !== "pro" ? (
                <form
                  action={(formData) => {
                    if (!confirm(`Bạn chắc chắn muốn xóa gói "${item.name}"?`)) return;
                    startGlobalLoading("Đang xóa gói...");
                    startTransition(async () => {
                      await deletePackageAction(formData);
                      stopGlobalLoading();
                    });
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-400"
                  >
                    <Trash2 size={13} />
                  </Button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {/* Modal: Create or Edit Package */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-primary/40 bg-card p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Boxes size={20} />
                <span>
                  {editingPackage ? `Chỉnh sửa gói: ${editingPackage.name}` : "Tạo gói credits mới"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={(formData) => {
                setShowModal(false);
                startGlobalLoading(
                  editingPackage
                    ? "Đang cập nhật gói credits..."
                    : "Đang tạo gói credits mới..."
                );
                startTransition(async () => {
                  await upsertPackageAction(formData);
                  stopGlobalLoading();
                });
              }}
              className="space-y-4"
            >
              {/* ID Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Mã định danh ID (duy nhất, viết thường, không dấu):
                </label>
                <Input
                  name="id"
                  required
                  readOnly={Boolean(editingPackage)}
                  defaultValue={editingPackage?.id || ""}
                  placeholder="ví dụ: vip, premium, mega"
                  className={`h-10 text-xs rounded-xl font-mono ${
                    editingPackage ? "opacity-60 cursor-not-allowed bg-muted" : ""
                  }`}
                />
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Tên gói hiển thị:
                </label>
                <Input
                  name="name"
                  required
                  defaultValue={editingPackage?.name || ""}
                  placeholder="ví dụ: VIP Pass, Gói Học Kỳ"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Credits & Price Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Số credits:
                  </label>
                  <Input
                    name="credits"
                    type="number"
                    min="1"
                    required
                    defaultValue={editingPackage?.credits || 50}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Giá bán VND:
                  </label>
                  <Input
                    name="priceVnd"
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    defaultValue={editingPackage?.priceVnd || 29000}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
                >
                  <Check size={14} />
                  <span>{editingPackage ? "Lưu thay đổi" : "Tạo gói mới"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
