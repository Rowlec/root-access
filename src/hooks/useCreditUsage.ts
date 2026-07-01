"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  canUseCredit,
  creditUsageStorageKey,
  defaultCreditPlan,
  emptyCreditUsage,
  getRemainingCredits,
  parseCreditUsage,
  recordCreditUse,
  type CreditAction,
  type CreditPlan,
} from "@/lib/credit-policy";

const emptyCreditSnapshot = JSON.stringify(emptyCreditUsage);
const creditListeners = new Set<() => void>();

function subscribeToCreditUsage(listener: () => void) {
  creditListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === creditUsageStorageKey) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    creditListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyCreditListeners() {
  creditListeners.forEach((listener) => listener());
}

function getServerSnapshot() {
  return emptyCreditSnapshot;
}

function readCreditSnapshot() {
  try {
    return window.localStorage.getItem(creditUsageStorageKey) ?? emptyCreditSnapshot;
  } catch {
    return emptyCreditSnapshot;
  }
}

function writeCreditSnapshot(value: string) {
  try {
    window.localStorage.setItem(creditUsageStorageKey, value);
  } catch {
    return;
  }
}

export function useCreditUsage(plan: CreditPlan = defaultCreditPlan) {
  const creditSnapshot = useSyncExternalStore(
    subscribeToCreditUsage,
    readCreditSnapshot,
    getServerSnapshot,
  );
  const usage = useMemo(
    () => parseCreditUsage(creditSnapshot),
    [creditSnapshot],
  );
  const canUse = useCallback(
    (action: CreditAction) => canUseCredit({ action, plan, usage }),
    [plan, usage],
  );
  const getRemaining = useCallback(
    (action: CreditAction) =>
      getRemainingCredits({
        action,
        plan,
        usage,
      }),
    [plan, usage],
  );
  const recordUse = useCallback((action: CreditAction) => {
    const currentUsage = parseCreditUsage(readCreditSnapshot());
    const nextUsage = recordCreditUse(currentUsage, action);

    writeCreditSnapshot(JSON.stringify(nextUsage));
    notifyCreditListeners();
  }, []);

  return {
    canUse,
    getRemaining,
    plan,
    recordUse,
    usage,
  };
}
