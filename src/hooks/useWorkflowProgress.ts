"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

type UseWorkflowProgressOptions = {
  workflowId: string;
  workflowRunId: string;
  stepIds: string[];
  availableTools: string[];
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

type WorkflowProgressStorageValue = {
  completedSteps: string[];
  availableTools: string[];
};

const emptyStorageValue: WorkflowProgressStorageValue = {
  completedSteps: [],
  availableTools: [],
};
const emptyStorageSnapshot = JSON.stringify(emptyStorageValue);

function getStorageKey(workflowId: string, workflowRunId: string) {
  return `root-access:workflow-progress:${workflowId}:${workflowRunId}`;
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
  return emptyStorageSnapshot;
}

function readStorageValue(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? emptyStorageSnapshot;
  } catch {
    return emptyStorageSnapshot;
  }
}

function writeStorageValue(storageKey: string, value: string) {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    return;
  }
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function parseCompletedStepIds(value: unknown, validStepIds: Set<string>) {
  return parseStringArray(value).filter((stepId) => validStepIds.has(stepId));
}

function parseStoredProgress(
  value: string,
  validStepIds: Set<string>,
): WorkflowProgressStorageValue {
  if (!value) {
    return emptyStorageValue;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return {
        completedSteps: parseCompletedStepIds(parsed, validStepIds),
        availableTools: [],
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return emptyStorageValue;
    }

    const storedProgress = parsed as {
      completedSteps?: unknown;
      availableTools?: unknown;
    };

    return {
      completedSteps: parseCompletedStepIds(
        storedProgress.completedSteps,
        validStepIds,
      ),
      availableTools: parseStringArray(storedProgress.availableTools),
    };
  } catch {
    return emptyStorageValue;
  }
}

function uniqueStepIds(stepIds: string[]) {
  return Array.from(new Set(stepIds));
}

function uniqueStringValues(values: string[]) {
  return Array.from(
    new Set(values.filter((value) => value.trim().length > 0)),
  );
}

function serializeStoredProgress(
  completedSteps: string[],
  availableTools: string[],
) {
  return JSON.stringify({
    completedSteps,
    availableTools,
  } satisfies WorkflowProgressStorageValue);
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
  workflowRunId,
  stepIds,
  availableTools,
}: UseWorkflowProgressOptions): UseWorkflowProgressResult {
  const orderedStepIds = useMemo(() => uniqueStepIds(stepIds), [stepIds]);
  const validStepIds = useMemo(() => new Set(orderedStepIds), [orderedStepIds]);
  const storageKey = useMemo(
    () => getStorageKey(workflowId, workflowRunId),
    [workflowId, workflowRunId],
  );
  const availableToolsForStorage = useMemo(
    () => uniqueStringValues(availableTools),
    [availableTools],
  );
  const getSnapshot = useCallback(
    () => readStorageValue(storageKey),
    [storageKey],
  );
  const storedProgressSnapshot = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );
  const storedProgress = useMemo(
    () => parseStoredProgress(storedProgressSnapshot, validStepIds),
    [storedProgressSnapshot, validStepIds],
  );
  const completedSteps = useMemo(
    () =>
      getSequentialCompletedSteps(
        storedProgress.completedSteps,
        orderedStepIds,
      ),
    [orderedStepIds, storedProgress.completedSteps],
  );
  const normalizedStorageSnapshot = useMemo(
    () =>
      serializeStoredProgress(completedSteps, availableToolsForStorage),
    [availableToolsForStorage, completedSteps],
  );

  useEffect(() => {
    if (storedProgressSnapshot === normalizedStorageSnapshot) {
      return;
    }

    writeStorageValue(storageKey, normalizedStorageSnapshot);
    notifyStorageListeners();
  }, [normalizedStorageSnapshot, storageKey, storedProgressSnapshot]);

  const saveCompletedSteps = useCallback(
    (nextCompletedSteps: string[]) => {
      writeStorageValue(
        storageKey,
        serializeStoredProgress(nextCompletedSteps, availableToolsForStorage),
      );
      notifyStorageListeners();
    },
    [availableToolsForStorage, storageKey],
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
