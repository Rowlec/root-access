"use client";

import { useEffect, useState } from "react";

export function CreditBalance({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/credits", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { balance?: unknown };
        if (active && typeof data.balance === "number") setBalance(data.balance);
      } catch {
        return;
      }
    };
    const interval = window.setInterval(refresh, 5_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return <>{balance}</>;
}
