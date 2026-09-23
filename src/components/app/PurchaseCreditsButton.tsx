"use client";

import { useState } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
export function PurchaseCreditsButton({
  disabled,
  packageId,
}: {
  disabled: boolean;
  packageId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function purchase() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create", {
        body: JSON.stringify({ packageId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as { checkoutUrl?: string; message?: string };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.message ?? "Không thể tạo phiên thanh toán.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "Không thể tạo phiên thanh toán.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button onClick={purchase} disabled={disabled || pending} className="h-10 w-full">
        {pending ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
        Thanh toán với payOS
      </Button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
