"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

type ChecklistItemsByStep = Record<string, number[]>;
type PromptEditsByStep = Record<string, string>;
type OutputDraftsByStep = Record<string, string>;
export type RefinementHistoryEntry = {
  id: string;
  feedback: string;
  output: string;
  createdAt: string;
};
type RefinementHistoryByStep = Record<string, RefinementHistoryEntry[]>;

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
  hasSavedProgress: boolean;
  canCompleteStep: (stepId: string) => boolean;
  getChecklistItems: (stepId: string) => number[];
  getOutputDraft: (stepId: string) => string;
  getPromptDraft: (stepId: string, fallbackPrompt: string) => string;
  getRefinementHistory: (stepId: string) => RefinementHistoryEntry[];
  hasOutputDraft: (stepId: string) => boolean;
  hasPromptEdit: (stepId: string) => boolean;
  isStepCompleted: (stepId: string) => boolean;
  addRefinementHistory: (
    stepId: string,
    refinement: Omit<RefinementHistoryEntry, "id" | "createdAt">,
  ) => void;
  resetOutputDraft: (stepId: string) => void;
  resetPromptEdit: (stepId: string) => void;
  restartWorkflow: () => void;
  setChecklistItems: (stepId: string, checkedItems: number[]) => void;
  setOutputDraft: (stepId: string, outputDraft: string) => void;
  setPromptEdit: (stepId: string, promptDraft: string) => void;
  setStepCompleted: (stepId: string, isCompleted: boolean) => void;
  toggleStep: (stepId: string) => void;
};

type WorkflowProgressStorageValue = {
  completedSteps: string[];
  currentStepId: string | null;
  availableTools: string[];
  checklistItems: ChecklistItemsByStep;
  outputDrafts: OutputDraftsByStep;
  promptEdits: PromptEditsByStep;
  refinementHistory: RefinementHistoryByStep;
};

const emptyStorageValue: WorkflowProgressStorageValue = {
  completedSteps: [],
  currentStepId: null,
  availableTools: [],
  checklistItems: {},
  outputDrafts: {},
  promptEdits: {},
  refinementHistory: {},
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

function parseChecklistItemIndexes(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const indexes = value.filter(
    (item): item is number =>
      Number.isInteger(item) && item >= 0 && item < 100,
  );

  return Array.from(new Set(indexes)).sort((first, second) => first - second);
}

function parseChecklistItems(
  value: unknown,
  validStepIds: Set<string>,
): ChecklistItemsByStep {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<ChecklistItemsByStep>(
    (checklistItems, [stepId, checkedItems]) => {
      if (!validStepIds.has(stepId)) {
        return checklistItems;
      }

      const parsedCheckedItems = parseChecklistItemIndexes(checkedItems);

      if (parsedCheckedItems.length > 0) {
        checklistItems[stepId] = parsedCheckedItems;
      }

      return checklistItems;
    },
    {},
  );
}

function parsePromptEdits(
  value: unknown,
  validStepIds: Set<string>,
): PromptEditsByStep {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<PromptEditsByStep>(
    (promptEdits, [stepId, promptDraft]) => {
      if (validStepIds.has(stepId) && typeof promptDraft === "string") {
        promptEdits[stepId] = promptDraft;
      }

      return promptEdits;
    },
    {},
  );
}

function parseOutputDrafts(
  value: unknown,
  validStepIds: Set<string>,
): OutputDraftsByStep {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<OutputDraftsByStep>(
    (outputDrafts, [stepId, outputDraft]) => {
      if (
        validStepIds.has(stepId) &&
        typeof outputDraft === "string" &&
        outputDraft.trim().length > 0
      ) {
        outputDrafts[stepId] = outputDraft;
      }

      return outputDrafts;
    },
    {},
  );
}

function parseRefinementHistoryEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is RefinementHistoryEntry =>
        Boolean(entry) &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof (entry as RefinementHistoryEntry).id === "string" &&
        typeof (entry as RefinementHistoryEntry).feedback === "string" &&
        typeof (entry as RefinementHistoryEntry).output === "string" &&
        typeof (entry as RefinementHistoryEntry).createdAt === "string",
    )
    .map((entry) => ({
      id: entry.id,
      feedback: entry.feedback,
      output: entry.output,
      createdAt: entry.createdAt,
    }))
    .filter(
      (entry) =>
        entry.id.trim().length > 0 &&
        entry.feedback.trim().length > 0 &&
        entry.output.trim().length > 0 &&
        entry.createdAt.trim().length > 0,
    )
    .slice(-20);
}

function parseRefinementHistory(
  value: unknown,
  validStepIds: Set<string>,
): RefinementHistoryByStep {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<RefinementHistoryByStep>(
    (refinementHistory, [stepId, entries]) => {
      if (!validStepIds.has(stepId)) {
        return refinementHistory;
      }

      const parsedEntries = parseRefinementHistoryEntries(entries);

      if (parsedEntries.length > 0) {
        refinementHistory[stepId] = parsedEntries;
      }

      return refinementHistory;
    },
    {},
  );
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
        ...emptyStorageValue,
        completedSteps: parseCompletedStepIds(parsed, validStepIds),
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return emptyStorageValue;
    }

    const storedProgress = parsed as {
      completedSteps?: unknown;
      currentStepId?: unknown;
      availableTools?: unknown;
      checklistItems?: unknown;
      outputDrafts?: unknown;
      promptEdits?: unknown;
      refinementHistory?: unknown;
    };
    const currentStepId =
      typeof storedProgress.currentStepId === "string" &&
      validStepIds.has(storedProgress.currentStepId)
        ? storedProgress.currentStepId
        : null;

    return {
      completedSteps: parseCompletedStepIds(
        storedProgress.completedSteps,
        validStepIds,
      ),
      currentStepId,
      availableTools: parseStringArray(storedProgress.availableTools),
      checklistItems: parseChecklistItems(
        storedProgress.checklistItems,
        validStepIds,
      ),
      outputDrafts: parseOutputDrafts(
        storedProgress.outputDrafts,
        validStepIds,
      ),
      promptEdits: parsePromptEdits(storedProgress.promptEdits, validStepIds),
      refinementHistory: parseRefinementHistory(
        storedProgress.refinementHistory,
        validStepIds,
      ),
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

function getCurrentStepId(
  completedSteps: string[],
  orderedStepIds: string[],
) {
  return orderedStepIds.find((stepId) => !completedSteps.includes(stepId)) ?? null;
}

function hasChecklistProgress(checklistItems: ChecklistItemsByStep) {
  return Object.values(checklistItems).some(
    (checkedItems) => checkedItems.length > 0,
  );
}

function serializeStoredProgress({
  availableTools,
  checklistItems,
  completedSteps,
  currentStepId,
  outputDrafts,
  promptEdits,
  refinementHistory,
}: WorkflowProgressStorageValue) {
  return JSON.stringify({
    completedSteps,
    currentStepId,
    availableTools,
    checklistItems,
    outputDrafts,
    promptEdits,
    refinementHistory,
  } satisfies WorkflowProgressStorageValue);
}

function hasOwnKey<T extends object>(
  value: T,
  key: string,
): key is keyof T & string {
  return Object.prototype.hasOwnProperty.call(value, key);
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
  const currentStepId = useMemo(
    () => getCurrentStepId(completedSteps, orderedStepIds),
    [completedSteps, orderedStepIds],
  );
  const normalizedStorageSnapshot = useMemo(
    () =>
      serializeStoredProgress({
        completedSteps,
        currentStepId,
        availableTools: availableToolsForStorage,
        checklistItems: storedProgress.checklistItems,
        outputDrafts: storedProgress.outputDrafts,
        promptEdits: storedProgress.promptEdits,
        refinementHistory: storedProgress.refinementHistory,
      }),
    [
      availableToolsForStorage,
      completedSteps,
      currentStepId,
      storedProgress.checklistItems,
      storedProgress.outputDrafts,
      storedProgress.promptEdits,
      storedProgress.refinementHistory,
    ],
  );

  useEffect(() => {
    if (storedProgressSnapshot === normalizedStorageSnapshot) {
      return;
    }

    writeStorageValue(storageKey, normalizedStorageSnapshot);
    notifyStorageListeners();
  }, [normalizedStorageSnapshot, storageKey, storedProgressSnapshot]);

  const updateStoredProgress = useCallback(
    (
      createNextProgress: (
        currentProgress: WorkflowProgressStorageValue,
      ) => WorkflowProgressStorageValue,
    ) => {
      const currentProgress = parseStoredProgress(
        readStorageValue(storageKey),
        validStepIds,
      );
      const nextProgress = createNextProgress(currentProgress);
      const nextCompletedSteps = getSequentialCompletedSteps(
        nextProgress.completedSteps,
        orderedStepIds,
      );
      const nextValue = serializeStoredProgress({
        completedSteps: nextCompletedSteps,
        currentStepId: getCurrentStepId(nextCompletedSteps, orderedStepIds),
        availableTools: availableToolsForStorage,
        checklistItems: parseChecklistItems(
          nextProgress.checklistItems,
          validStepIds,
        ),
        outputDrafts: parseOutputDrafts(nextProgress.outputDrafts, validStepIds),
        promptEdits: parsePromptEdits(nextProgress.promptEdits, validStepIds),
        refinementHistory: parseRefinementHistory(
          nextProgress.refinementHistory,
          validStepIds,
        ),
      });

      writeStorageValue(storageKey, nextValue);
      notifyStorageListeners();
    },
    [availableToolsForStorage, orderedStepIds, storageKey, validStepIds],
  );

  const saveCompletedSteps = useCallback(
    (nextCompletedSteps: string[]) => {
      updateStoredProgress((currentProgress) => ({
        ...currentProgress,
        completedSteps: nextCompletedSteps,
      }));
    },
    [updateStoredProgress],
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

  const setChecklistItems = useCallback(
    (stepId: string, checkedItems: number[]) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      updateStoredProgress((currentProgress) => {
        const checklistItems = { ...currentProgress.checklistItems };
        const parsedCheckedItems = parseChecklistItemIndexes(checkedItems);

        if (parsedCheckedItems.length > 0) {
          checklistItems[stepId] = parsedCheckedItems;
        } else {
          delete checklistItems[stepId];
        }

        return {
          ...currentProgress,
          checklistItems,
        };
      });
    },
    [updateStoredProgress, validStepIds],
  );

  const setPromptEdit = useCallback(
    (stepId: string, promptDraft: string) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      updateStoredProgress((currentProgress) => ({
        ...currentProgress,
        promptEdits: {
          ...currentProgress.promptEdits,
          [stepId]: promptDraft,
        },
      }));
    },
    [updateStoredProgress, validStepIds],
  );

  const setOutputDraft = useCallback(
    (stepId: string, outputDraft: string) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      updateStoredProgress((currentProgress) => ({
        ...currentProgress,
        outputDrafts:
          outputDraft.trim().length > 0
            ? {
                ...currentProgress.outputDrafts,
                [stepId]: outputDraft,
              }
            : Object.fromEntries(
                Object.entries(currentProgress.outputDrafts).filter(
                  ([storedStepId]) => storedStepId !== stepId,
                ),
              ),
      }));
    },
    [updateStoredProgress, validStepIds],
  );

  const resetPromptEdit = useCallback(
    (stepId: string) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      updateStoredProgress((currentProgress) => {
        const promptEdits = { ...currentProgress.promptEdits };
        delete promptEdits[stepId];

        return {
          ...currentProgress,
          promptEdits,
        };
      });
    },
    [updateStoredProgress, validStepIds],
  );

  const addRefinementHistory = useCallback(
    (
      stepId: string,
      refinement: Omit<RefinementHistoryEntry, "id" | "createdAt">,
    ) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      const feedback = refinement.feedback.trim();
      const output = refinement.output.trim();

      if (!feedback || !output) {
        return;
      }

      updateStoredProgress((currentProgress) => {
        const currentHistory = currentProgress.refinementHistory[stepId] ?? [];
        const nextHistory = [
          ...currentHistory,
          {
            id: `${Date.now()}-${currentHistory.length + 1}`,
            feedback,
            output,
            createdAt: new Date().toISOString(),
          },
        ].slice(-20);

        return {
          ...currentProgress,
          refinementHistory: {
            ...currentProgress.refinementHistory,
            [stepId]: nextHistory,
          },
        };
      });
    },
    [updateStoredProgress, validStepIds],
  );

  const resetOutputDraft = useCallback(
    (stepId: string) => {
      if (!validStepIds.has(stepId)) {
        return;
      }

      updateStoredProgress((currentProgress) => {
        const outputDrafts = { ...currentProgress.outputDrafts };
        delete outputDrafts[stepId];

        return {
          ...currentProgress,
          outputDrafts,
        };
      });
    },
    [updateStoredProgress, validStepIds],
  );

  const toggleStep = useCallback(
    (stepId: string) => {
      setStepCompleted(stepId, !completedSteps.includes(stepId));
    },
    [completedSteps, setStepCompleted],
  );
  const restartWorkflow = useCallback(() => {
    updateStoredProgress((currentProgress) => ({
      ...currentProgress,
      completedSteps: [],
      checklistItems: {},
      outputDrafts: {},
      promptEdits: {},
      refinementHistory: {},
    }));
  }, [updateStoredProgress]);

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
  const getChecklistItems = useCallback(
    (stepId: string) => storedProgress.checklistItems[stepId] ?? [],
    [storedProgress.checklistItems],
  );
  const getPromptDraft = useCallback(
    (stepId: string, fallbackPrompt: string) =>
      hasOwnKey(storedProgress.promptEdits, stepId)
        ? storedProgress.promptEdits[stepId]
        : fallbackPrompt,
    [storedProgress.promptEdits],
  );
  const getOutputDraft = useCallback(
    (stepId: string) => storedProgress.outputDrafts[stepId] ?? "",
    [storedProgress.outputDrafts],
  );
  const getRefinementHistory = useCallback(
    (stepId: string) => storedProgress.refinementHistory[stepId] ?? [],
    [storedProgress.refinementHistory],
  );
  const hasPromptEdit = useCallback(
    (stepId: string) => hasOwnKey(storedProgress.promptEdits, stepId),
    [storedProgress.promptEdits],
  );
  const hasOutputDraft = useCallback(
    (stepId: string) =>
      hasOwnKey(storedProgress.outputDrafts, stepId) &&
      storedProgress.outputDrafts[stepId].trim().length > 0,
    [storedProgress.outputDrafts],
  );

  const completedCount = completedSteps.length;
  const totalSteps = orderedStepIds.length;
  const completionPercentage =
    totalSteps === 0 ? 0 : Math.floor((completedCount / totalSteps) * 100);
  const hasSavedProgress =
    completedSteps.length > 0 ||
    hasChecklistProgress(storedProgress.checklistItems) ||
    Object.keys(storedProgress.outputDrafts).length > 0 ||
    Object.keys(storedProgress.promptEdits).length > 0 ||
    Object.keys(storedProgress.refinementHistory).length > 0;

  return {
    completedSteps,
    completedCount,
    totalSteps,
    completionPercentage,
    currentStepId,
    abandonStepId: currentStepId,
    hasSavedProgress,
    addRefinementHistory,
    canCompleteStep,
    getChecklistItems,
    getOutputDraft,
    getPromptDraft,
    getRefinementHistory,
    hasOutputDraft,
    hasPromptEdit,
    isStepCompleted,
    resetOutputDraft,
    resetPromptEdit,
    restartWorkflow,
    setChecklistItems,
    setOutputDraft,
    setPromptEdit,
    setStepCompleted,
    toggleStep,
  };
}
