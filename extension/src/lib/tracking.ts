import { api } from "./api";

interface TrackEvent {
  name: string;
  props?: Record<string, unknown>;
  timestamp: number;
}

let eventQueue: TrackEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

export function track(name: string, props: Record<string, unknown> = {}) {
  eventQueue.push({
    name,
    props,
    timestamp: Date.now(),
  });

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushEvents();
    }, 10000); // 10 seconds batching as specified in Mục 12
  }
}

export async function flushEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (eventQueue.length === 0) return;

  const toSend = [...eventQueue];
  eventQueue = [];

  try {
    await api.sendEvents(toSend);
  } catch (err) {
    // If failed, re-queue up to 50 events
    eventQueue = [...toSend.slice(-50), ...eventQueue];
  }
}

// Automatically flush when window is closed
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    flushEvents();
  });
}
