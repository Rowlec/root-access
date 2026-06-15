"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type UseWorkflowProgressOptions = {
  workflowId: string;
  stepIds: string[];
};

type UseWorkflowProgressResult = {
  completedSteps: string[];
  completedCount: number;
  totalSteps: number;
  completionPercentage: number;
  currentStepId: string | null;
  abandonStepId: string | null;
  canCompleteStep: (stepId: string) => boolean;
  isStepCompleted: (stepId: string) => boolean;
  restartWorkflow: () => void;
  toggleStep: (stepId: string) => void;
  setStepCompleted: (stepId: string, isCompleted: boolean) => void;
};

function getStorageKey(workflowId: string) {
  return `root-access:workflow-progress:${workflowId}`;
}

const storageListeners = new Set<() => void>();

function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);

  function handleStorage() {
    listener();
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    storageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyStorageListeners() {
  storageListeners.forEach((listener) => listener());
}

function getServerSnapshot() {
  return "[]";
}

function readStorageValue(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

function writeStorageValue(storageKey: string, value: string) {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    return;
  }
}

function parseCompletedSteps(value: string, validStepIds: Set<string>) {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (stepId): stepId is string =>
        typeof stepId === "string" && validStepIds.has(stepId),
    );
  } catch {
    return [];
  }
}

function uniqueStepIds(stepIds: string[]) {
  return Array.from(new Set(stepIds));
}

function getSequentialCompletedSteps(
  completedSteps: string[],
  orderedStepIds: string[],
) {
  const completedSet = new Set(completedSteps);
  const sequentialSteps: string[] = [];

  for (const stepId of orderedStepIds) {
    if (!completedSet.has(stepId)) {
      break;
    }

    sequentialSteps.push(stepId);
  }

  return sequentialSteps;
}

export function useWorkflowProgress({
  workflowId,
  stepIds,
}: UseWorkflowProgressOptions): UseWorkflowProgressResult {
  const orderedStepIds = useMemo(() => uniqueStepIds(stepIds), [stepIds]);
  const validStepIds = useMemo(() => new Set(orderedStepIds), [orderedStepIds]);
  const storageKey = useMemo(() => getStorageKey(workflowId), [workflowId]);
  const getSnapshot = useCallback(
    () => readStorageValue(storageKey),
    [storageKey],
  );
  const storedCompletedSteps = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );
  const completedSteps = useMemo(
    () =>
      getSequentialCompletedSteps(
        parseCompletedSteps(storedCompletedSteps, validStepIds),
        orderedStepIds,
      ),
    [orderedStepIds, storedCompletedSteps, validStepIds],
  );

  const saveCompletedSteps = useCallback(
    (nextCompletedSteps: string[]) => {
      writeStorageValue(storageKey, JSON.stringify(nextCompletedSteps));
      notifyStorageListeners();
    },
    [storageKey],
  );

  const setStepCompleted = useCallback(
    (stepId: string, isCompleted: boolean) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      const stepIndex = orderedStepIds.indexOf(stepId);

      if (stepIndex === -1) {
        return;
      }

      const currentStepIndex = completedSteps.length;

      if (isCompleted) {
        if (stepIndex !== currentStepIndex) {
          return;
        }

        saveCompletedSteps(orderedStepIds.slice(0, stepIndex + 1));
        return;
      }

      saveCompletedSteps(orderedStepIds.slice(0, stepIndex));
    },
    [completedSteps, orderedStepIds, saveCompletedSteps, validStepIds],
  );

  const toggleStep = useCallback(
    (stepId: string) => {
      setStepCompleted(stepId, !completedSteps.includes(stepId));
    },
    [completedSteps, setStepCompleted],
  );
  const restartWorkflow = useCallback(() => {
    saveCompletedSteps([]);
  }, [saveCompletedSteps]);

  const isStepCompleted = useCallback(
    (stepId: string) => completedSteps.includes(stepId),
    [completedSteps],
  );
  const canCompleteStep = useCallback(
    (stepId: string) =>
      completedSteps.includes(stepId) ||
      orderedStepIds[completedSteps.length] === stepId,
    [completedSteps, orderedStepIds],
  );

  const completedCount = completedSteps.length;
  const totalSteps = orderedStepIds.length;
  const completionPercentage =
    totalSteps === 0 ? 0 : Math.floor((completedCount / totalSteps) * 100);
  const currentStepId =
    orderedStepIds.find((stepId) => !completedSteps.includes(stepId)) ?? null;

  return {
    completedSteps,
    completedCount,
    totalSteps,
    completionPercentage,
    currentStepId,
    abandonStepId: currentStepId,
    canCompleteStep,
    isStepCompleted,
    restartWorkflow,
    toggleStep,
    setStepCompleted,
  };
}
