"use client";

import { Button } from "@/components/ui/button";
import { SimSubNav } from "@/components/dashboard/SimSubNav";
import { CLIP_FORMAT_LIST } from "@/lib/clip/formats";
import { useClipStore } from "@/lib/clip/store";
import { useDemoStore } from "@/lib/dataset/store";
import { useHudStore } from "@/lib/store";
import type { ClipFormatId } from "@/lib/clip/formats";
import type { SimTabId } from "@/lib/site";

const CAMERAS = [
  { id: "orbit" as const, label: "Studio" },
  { id: "table" as const, label: "Table" },
  { id: "top" as const, label: "Top" },
  { id: "side" as const, label: "Side" },
];

interface ArenaDockProps {
  tab: SimTabId;
  onTab: (id: SimTabId) => void;
}

/**
 * Evaluation + camera bar. Keeps the studio canvas full-bleed.
 *
 * @example <ArenaDock tab="vision" onTab={setTab} />
 */
export function ArenaDock({ tab, onTab }: ArenaDockProps) {
  const status = useHudStore((s) => s.matchStatus);
  const start = useHudStore((s) => s.requestBaselineMatch);
  const startVla = useHudStore((s) => s.requestColorSeekMatch);
  const abort = useHudStore((s) => s.abortMatch);
  const resetTable = useHudStore((s) => s.requestTableReset);
  const cameraView = useHudStore((s) => s.cameraView);
  const setCameraView = useHudStore((s) => s.setCameraView);
  const showColliders = useHudStore((s) => s.showColliders);
  const showTrails = useHudStore((s) => s.showTrails);
  const showGrid = useHudStore((s) => s.showGrid);
  const toggleColliders = useHudStore((s) => s.toggleColliders);
  const toggleTrails = useHudStore((s) => s.toggleTrails);
  const toggleGrid = useHudStore((s) => s.toggleGrid);
  const clipPhase = useClipStore((s) => s.phase);
  const clipFormat = useClipStore((s) => s.format);
  const setFormat = useClipStore((s) => s.setFormat);
  const startRecording = useClipStore((s) => s.startRecording);
  const requestStop = useClipStore((s) => s.requestStop);
  const demoRecording = useDemoStore((s) => s.recording);
  const demoFrames = useDemoStore((s) => s.frameCount);
  const startDemo = useDemoStore((s) => s.startRecording);
  const stopDemo = useDemoStore((s) => s.stopAndDownload);
  const running = status === "running";
  const recording = clipPhase === "recording" || clipPhase === "endcard";

  function clipMatch() {
    setCameraView("table");
    startRecording(clipFormat);
    if (!running) start();
  }

  return (
    <div className="panel space-y-2 overflow-x-auto p-2.5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-1.5">
        <SimSubNav value={tab} onChange={onTab} />
        <span className="hidden h-5 w-px bg-white/10 sm:block" />
        {CAMERAS.map((cam) => (
          <Button
            key={cam.id}
            size="sm"
            variant={cameraView === cam.id ? "default" : "ghost"}
            onClick={() => setCameraView(cam.id)}
          >
            {cam.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" disabled={running} onClick={start}>
          Run Baseline-IK
        </Button>
        <Button size="sm" variant="outline" disabled={running} onClick={startVla}>
          Run ColorSeek
        </Button>
        <Button size="sm" variant="ghost" disabled={!running} onClick={abort}>
          Abort
        </Button>
        <Button size="sm" variant="ghost" onClick={resetTable}>
          Reset
        </Button>
        <span className="hidden h-5 w-px bg-white/10 md:block" />
        <Button size="sm" variant={showGrid ? "default" : "ghost"} onClick={toggleGrid}>
          Grid
        </Button>
        <Button size="sm" variant={showTrails ? "default" : "ghost"} onClick={toggleTrails}>
          Trail
        </Button>
        <Button size="sm" variant={showColliders ? "default" : "ghost"} onClick={toggleColliders}>
          Colliders
        </Button>
        <span className="hidden h-5 w-px bg-white/10 md:block" />
        <Button
          size="sm"
          variant="outline"
          disabled={demoRecording}
          onClick={() => {
            startDemo();
            useHudStore.getState().pushLog("VLA demo recording");
          }}
        >
          Record demo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!demoRecording}
          onClick={() => {
            stopDemo();
            useHudStore.getState().pushLog("VLA demo saved");
          }}
        >
          Stop + download
        </Button>
        {demoRecording ? (
          <span className="font-mono text-[10px] text-arena-muted">{demoFrames} frames</span>
        ) : null}
        <select
          className="h-8 rounded-full border border-white/15 bg-transparent px-3 text-xs text-arena-muted outline-none"
          value={clipFormat}
          disabled={recording}
          aria-label="Clip format"
          onChange={(event) => setFormat(event.target.value as ClipFormatId)}
        >
          {CLIP_FORMAT_LIST.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" disabled={recording} onClick={clipMatch}>
          Clip match
        </Button>
        {recording ? (
          <Button size="sm" variant="ghost" onClick={requestStop}>
            Stop clip
          </Button>
        ) : null}
        <p className="w-full text-[10px] leading-4 text-arena-muted md:ml-auto md:w-auto">
          Q/A yaw · W/S shoulder · E/D elbow · R/F wrist · Space grip · Esc reset · Studio ≠ public ELO
        </p>
      </div>
    </div>
  );
}
