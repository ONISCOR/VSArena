"use client";

import { create } from "zustand";
import { DemoRecorder, serializeDemo } from "@/lib/dataset/recorder";

function stampName(): string {
  const day = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `vsarena-demo-${day}.json`;
}

function downloadJson(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface DemoState {
  recording: boolean;
  frameCount: number;
  lastFile: string | null;
  error: string | null;
  recorder: DemoRecorder | null;
  startRecording: () => void;
  bumpFrame: (count: number) => void;
  stopAndDownload: () => void;
}

/**
 * Teleop / agent VLA demo session. ArenaScene is the only writer of `bumpFrame`.
 */
export const useDemoStore = create<DemoState>((set, get) => ({
  recording: false,
  frameCount: 0,
  lastFile: null,
  error: null,
  recorder: null,
  startRecording: () => {
    const recorder = new DemoRecorder();
    recorder.start();
    set({ recording: true, recorder, frameCount: 0, error: null, lastFile: null });
  },
  bumpFrame: (frameCount) => set({ frameCount }),
  stopAndDownload: () => {
    const { recorder, recording } = get();
    if (!recording || !recorder) return;
    const episode = recorder.stop();
    if (episode.frames.length === 0) {
      set({ recording: false, recorder: null, frameCount: 0, error: "No frames — wait ~200ms at 5 Hz." });
      return;
    }
    const fileName = stampName();
    try {
      downloadJson(fileName, serializeDemo(episode));
      set({ recording: false, recorder: null, lastFile: fileName, error: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Download failed";
      set({ recording: false, recorder: null, error: message });
    }
  },
}));
