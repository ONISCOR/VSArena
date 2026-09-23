"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { VlaFeed } from "@/components/dashboard/VlaFeed";
import { OfficialEvalBody } from "@/components/dashboard/OfficialEvalBody";
import { useCopy } from "@/lib/copy/useCopy";
import { wakeOfficialHarness } from "@/lib/live/wakeHarness";
import type { HarnessHealthSnapshot, HarnessProbeStatus } from "@/lib/live/wakeHarness";
import { useDemoStore } from "@/lib/dataset/store";
import { evalWindowId } from "@/lib/eval/sampler";
import { useHudStore } from "@/lib/store";
import { TABLE_HALF_EXTENTS, TARGET_ZONE } from "@/simulation/constants";
import type { Messages } from "@/lib/copy/dictionary";
import type { CameraView, TelemetryBlock } from "@/lib/store";
import type { SimTabId } from "@/lib/site";
import type { JointState, Vec3 } from "@/simulation/types";

const ArenaApp = dynamic(() => import("@/components/simulation/ArenaApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--bg)]">
      <p className="text-sm text-[var(--ink)]">Loading physics…</p>
    </div>
  ),
});

const LiveViewer = dynamic(
  () => import("@/components/live/LiveViewer").then((m) => m.LiveViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-[var(--ink)]">Opening live…</p>
      </div>
    ),
  },
);

const LivePip = dynamic(() => import("@/components/live/LivePip").then((m) => m.LivePip), {
  ssr: false,
});

type Overlay = Extract<SimTabId, "vision" | "physics" | "trajectories">;

const MAP_W = 200;
const MAP_H = 112;
const glass =
  "studio-glass rounded-2xl border border-[var(--line)] bg-[var(--chrome)]/90 shadow-[0_0_0_1px_var(--panel-inset)_inset] backdrop-blur-xl";

function worldToMap(x: number, z: number) {
  const nx = (x + TABLE_HALF_EXTENTS.x) / (TABLE_HALF_EXTENTS.x * 2);
  const nz = (z + TABLE_HALF_EXTENTS.z) / (TABLE_HALF_EXTENTS.z * 2);
  return { x: nx * MAP_W, y: (1 - nz) * MAP_H };
}

function Seg({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-8 items-center rounded-full border border-[var(--line)] bg-[var(--lift)]/40 p-0.5"
    >
      {children}
    </div>
  );
}

function SegItem({
  active,
  onClick,
  children,
  disabled,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11px] leading-none transition-colors disabled:opacity-35 ${
        active
          ? "bg-[var(--ink)] text-[var(--on-ink)] shadow-[0_0_16px_color-mix(in_srgb,var(--cyan)_18%,transparent)]"
          : "text-[var(--ink)] hover:bg-[var(--lift-2)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function LayerBtn({
  on,
  onClick,
  label,
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        on
          ? "border-[var(--cyan)]/45 bg-[var(--cyan)]/14 text-[var(--cyan)] shadow-[0_0_12px_color-mix(in_srgb,var(--cyan)_28%,transparent)]"
          : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]/25 hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function ActionBtn({
  onClick,
  disabled,
  title,
  tone = "ghost",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: "primary" | "accent" | "ghost" | "stop" | "rec";
  children: ReactNode;
}) {
  const toneClass = {
    primary:
      "bg-[var(--ink)] text-[var(--on-ink)] shadow-[0_0_20px_color-mix(in_srgb,var(--cyan)_16%,transparent)] hover:opacity-90",
    accent: "border border-[var(--cyan)]/40 text-[var(--cyan)] hover:bg-[var(--cyan)]/12",
    ghost: "border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]/25",
    stop: "border border-[var(--danger)]/45 bg-[var(--danger)]/14 text-[var(--danger-text)] hover:bg-[var(--danger)]/22",
    rec: "border border-[var(--danger)]/50 bg-[var(--danger)]/16 text-[var(--danger-text)]",
  }[tone];
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium leading-none transition-colors disabled:opacity-35 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function KeyHints({ text }: { text: string }) {
  return (
    <div className="hidden items-center gap-1 2xl:flex" title={text}>
      {text.split(" · ").map((part) => {
        const combo = part.split(" ")[0];
        return (
          <kbd
            key={part}
            className="rounded-md border border-[var(--line)] bg-[var(--lift)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--ink)]"
          >
            {combo}
          </kbd>
        );
      })}
    </div>
  );
}

function IcoGrid() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <rect x="0.6" y="0.6" width="3.6" height="3.6" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="5.8" y="0.6" width="3.6" height="3.6" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="0.6" y="5.8" width="3.6" height="3.6" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="5.8" y="5.8" width="3.6" height="3.6" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function IcoTrail() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden>
      <path d="M1 8 C3 8 3 2 6 2 C9 2 9 8 11 8" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IcoCollider() {
  return (
    <svg width="11" height="10" viewBox="0 0 11 10" aria-hidden>
      <rect x="0.6" y="2.2" width="6.2" height="6.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="4.2" y="0.6" width="6.2" height="6.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function IcoPlay() {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden>
      <path d="M1 0.8 L7.2 4.5 L1 8.2 Z" fill="currentColor" />
    </svg>
  );
}

function RecDot({ live }: { live?: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--danger)] ${live ? "animate-pulse shadow-[0_0_8px_var(--danger)]" : ""}`}
    />
  );
}

/**
 * Full-bleed Rapier cell with V1 glass HUD. Official spectator is `?view=live`.
 */
export function SimulationDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--bg)]">
          <p className="text-sm text-[var(--ink)]">Loading studio…</p>
        </div>
      }
    >
      <SimulationDashboardInner />
    </Suspense>
  );
}

function SimulationDashboardInner() {
  const { t } = useCopy();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const live = searchParams.get("view") === "live";

  const [overlay, setOverlay] = useState<Overlay>("vision");
  const [wakeStatus, setWakeStatus] = useState<HarnessProbeStatus | "waking" | null>(null);
  const [wakeBusy, setWakeBusy] = useState(false);
  const [health, setHealth] = useState<HarnessHealthSnapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);

  const tick = useHudStore((s) => s.tick);
  const ready = useHudStore((s) => s.ready);
  const matchStatus = useHudStore((s) => s.matchStatus);
  const matchResult = useHudStore((s) => s.matchResult);
  const blocks = useHudStore((s) => s.blocks);
  const grasped = useHudStore((s) => s.graspedBlockId);
  const joints = useHudStore((s) => s.joints);
  const tcp = useHudStore((s) => s.tcp);
  const trail = useHudStore((s) => s.tcpTrail);
  const cameraView = useHudStore((s) => s.cameraView);
  const setCameraView = useHudStore((s) => s.setCameraView);
  const showGrid = useHudStore((s) => s.showGrid);
  const showTrails = useHudStore((s) => s.showTrails);
  const showColliders = useHudStore((s) => s.showColliders);
  const startIk = useHudStore((s) => s.requestBaselineMatch);
  const startSeek = useHudStore((s) => s.requestColorSeekMatch);
  const abort = useHudStore((s) => s.abortMatch);
  const resetTable = useHudStore((s) => s.requestTableReset);
  const toggleGrid = useHudStore((s) => s.toggleGrid);
  const toggleTrails = useHudStore((s) => s.toggleTrails);
  const toggleColliders = useHudStore((s) => s.toggleColliders);
  const demoRecording = useDemoStore((s) => s.recording);
  const demoFrames = useDemoStore((s) => s.frameCount);
  const startDemo = useDemoStore((s) => s.startRecording);
  const stopDemo = useDemoStore((s) => s.stopAndDownload);

  const running = matchStatus === "running";
  const recording = demoRecording;
  const seed = evalWindowId();
  const sdkLine = t.lab.sdkCmd;

  const liveHref = `${pathname}?view=live`;

  const openLive = useCallback(() => {
    setHudOpen(false);
    router.replace(liveHref, { scroll: false });
  }, [liveHref, router]);

  const closeLive = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const openOfficial = useCallback(async () => {
    setWakeBusy(true);
    setWakeStatus("waking");
    try {
      const snap = await wakeOfficialHarness({ timeoutMs: 90_000 });
      setHealth(snap);
      setWakeStatus(snap.status);
      // Always open spectator after a probe: busy/ready are both valid read-only views.
      // Unreachable: still allow expand so LiveViewer can keep retrying /spectate.
      openLive();
    } finally {
      setWakeBusy(false);
    }
  }, [openLive]);

  const onHealth = useCallback((snap: HarnessHealthSnapshot) => {
    setHealth(snap);
    setWakeStatus(snap.status);
  }, []);

  if (live) {
    return <LiveViewer onCollapse={closeLive} />;
  }

  const status = recording ? t.lab.recording : running ? t.lab.running : ready ? t.lab.idle : "boot";
  const camKey = (id: CameraView) => (id === "orbit" ? "studio" : id);
  const mode = running ? t.lab.modeDemo : t.lab.hsIdle;

  const copySdk = async () => {
    await navigator.clipboard.writeText(sdkLine);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const left = (
    <LeftRail
      t={t}
      overlay={overlay}
      blocks={blocks}
      grasped={grasped}
      joints={joints}
      tcp={tcp}
      trailLen={trail.length}
      showTrails={showTrails}
    />
  );

  const right = (
    <RightRail
      t={t}
      sdkLine={sdkLine}
      copied={copied}
      onCopy={() => void copySdk()}
      wakeStatus={wakeStatus}
      wakeBusy={wakeBusy}
      health={health}
      onHealth={onHealth}
      onOpenOfficial={() => void openOfficial()}
      onExpandLive={openLive}
    />
  );

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-[var(--bg)]">
      <div className="absolute inset-0">
        <ArenaApp />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[var(--line)] bg-[var(--chrome)]/80 px-3 py-2 backdrop-blur-xl sm:px-4">
          <span className="live-dot shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-none">{t.lab.task}</p>
            <p className="mono mt-1 text-[11px] leading-none text-[var(--ink)]">{t.lab.cubeOrder}</p>
          </div>
          <span className="hidden h-5 w-px bg-[var(--line)] sm:block" />
          <p className="mono text-[11px] text-[var(--ink)]">
            {t.lab.tick} {tick}
            <span className="text-[var(--ink)]"> · </span>
            {t.lab.seed} {seed}
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              running ? "bg-[var(--cyan)]/15 text-[var(--cyan)]" : "border border-[var(--line)] text-[var(--ink)]"
            }`}
          >
            {running ? t.lab.modeDemo : mode}
          </span>
          {matchResult && !running ? (
            <span className="mono hidden text-[11px] text-[var(--ink)] md:inline">
              {matchResult.scores.spatial_accuracy.toFixed(2)}
              <span className="text-[var(--ink)]"> · </span>
              {matchResult.scores.task_completion_score.toFixed(2)}
            </span>
          ) : null}
          <span className="ml-auto rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--ink)]">
            {t.lab.eloNote}
          </span>
          <button
            type="button"
            className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--ink)] lg:hidden"
            onClick={() => setHudOpen((v) => !v)}
          >
            {hudOpen ? t.lab.closeHud : t.lab.hud}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-3 py-3">
          <aside className="pointer-events-auto hidden min-h-0 w-[17.5rem] shrink-0 flex-col lg:flex">
            {left}
          </aside>
          <div className="min-h-0 min-w-0 flex-1" />
          <aside className="pointer-events-auto hidden min-h-0 w-[18rem] shrink-0 flex-col md:flex">
            {right}
          </aside>
        </div>

        {hudOpen ? (
          <div className="pointer-events-auto mb-3 grid max-h-[46%] min-h-0 gap-2 overflow-y-auto md:hidden">
            {left}
            {right}
          </div>
        ) : null}

        <StudioDock
          t={t}
          overlay={overlay}
          setOverlay={setOverlay}
          cameraView={cameraView}
          camKey={camKey}
          setCameraView={setCameraView}
          running={running}
          status={status}
          lastScore={matchResult && !running ? matchResult.scores : null}
          showGrid={showGrid}
          showTrails={showTrails}
          showColliders={showColliders}
          demoRecording={demoRecording}
          demoFrames={demoFrames}
          onIk={startIk}
          onSeek={startSeek}
          onAbort={abort}
          onReset={resetTable}
          onGrid={toggleGrid}
          onTrail={toggleTrails}
          onColliders={toggleColliders}
          onRecord={startDemo}
          onStopDemo={stopDemo}
        />
      </div>
    </div>
  );
}

function LeftRail({
  t,
  overlay,
  blocks,
  grasped,
  joints,
  tcp,
  trailLen,
  showTrails,
}: {
  t: Messages;
  overlay: Overlay;
  blocks: TelemetryBlock[];
  grasped: string | null;
  joints: JointState;
  tcp: Vec3;
  trailLen: number;
  showTrails: boolean;
}) {
  return (
    <section className={`${glass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{t.lab.task}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink)]">{t.lab.hiddenPolicy}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--cyan)]/14 px-2 py-0.5 text-[10px] font-medium text-[var(--cyan)]">
          {t.lab.live}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5">
        {overlay === "vision" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-medium">{t.lab.vla}</p>
              <span className="live-dot" />
            </div>
            <VlaFeed bare />
            <p className="mt-2 text-[12px] leading-5 text-[var(--ink)]">{t.lab.instruction}</p>
          </div>
        ) : null}

        {overlay === "physics" ? (
          <div>
            <p className="text-[12px] font-medium">{t.lab.overlayPhysics}</p>
            <p className="mt-0.5 text-[11px] text-[var(--ink)]">{t.lab.overlayPhysicsNote}</p>
            <dl className="mt-3 space-y-1.5 font-mono text-[12px] text-[var(--ink)]">
              <JointRow label="yaw" value={joints.baseYaw} />
              <JointRow label="shoulder" value={joints.shoulderPitch} />
              <JointRow label="elbow" value={joints.elbowPitch} />
              <JointRow label="wrist" value={joints.wristPitch} />
              <JointRow label="gripper" value={joints.gripper} />
            </dl>
          </div>
        ) : null}

        {overlay === "trajectories" ? (
          <div>
            <p className="text-[12px] font-medium">{t.lab.overlayTraj}</p>
            <p className="mt-0.5 text-[11px] text-[var(--ink)]">{t.lab.overlayTrajNote}</p>
            <p className="mt-2 text-[12px] text-[var(--ink)]">
              {trailLen} TCP
              {showTrails ? "" : ` · ${t.lab.trail}`}
            </p>
            <p className="mono mt-1 text-[11px] text-[var(--ink)]">
              {tcp[0].toFixed(2)}, {tcp[1].toFixed(2)}, {tcp[2].toFixed(2)}
            </p>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-medium">{t.lab.objects}</p>
            <span className="text-[11px] text-[var(--ink)]">{t.lab.bodies}</span>
          </div>
          <TopDown />
          <ul className="mt-2 space-y-1.5">
            {blocks.length === 0 ? (
              <li className="text-[12px] text-[var(--ink)]">{t.lab.waitingPhysics}</li>
            ) : (
              blocks.map((block) => (
                <li key={block.id} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: block.color }} />
                    {block.id.replace("block_", "")}
                  </span>
                  <span className="mono text-[11px] text-[var(--ink)]">
                    {grasped === block.id
                      ? t.lab.grasped
                      : `${block.position[0].toFixed(2)}, ${block.position[2].toFixed(2)}`}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function RightRail({
  t,
  sdkLine,
  copied,
  onCopy,
  wakeStatus,
  wakeBusy,
  health,
  onHealth,
  onOpenOfficial,
  onExpandLive,
}: {
  t: Messages;
  sdkLine: string;
  copied: boolean;
  onCopy: () => void;
  wakeStatus: HarnessProbeStatus | "waking" | null;
  wakeBusy: boolean;
  health: HarnessHealthSnapshot | null;
  onHealth: (snap: HarnessHealthSnapshot) => void;
  onOpenOfficial: () => void;
  onExpandLive: () => void;
}) {
  const statusLine =
    wakeStatus === "waking"
      ? t.lab.wakeWaking
      : wakeStatus === "ready"
        ? t.lab.wakeReady
        : wakeStatus === "busy"
          ? t.lab.wakeBusy
          : wakeStatus === "unreachable"
            ? t.lab.wakeError
            : t.lab.officialNote;

  return (
    <section className={`${glass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
        <p className="text-[13px] font-medium">{t.lab.source}</p>
      </header>

      <div className="space-y-3 border-b border-[var(--line)] p-3.5">
        <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--lift)]/45 px-2.5 py-2 font-mono text-[11px] leading-4 text-[var(--ink)]">
          {sdkLine}
        </pre>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] leading-4 text-[var(--ink)]">{t.lab.sdkHint}</p>
          <button type="button" className="shrink-0 text-[12px] text-[var(--ink)]" onClick={onCopy}>
            {copied ? t.lab.copied : t.lab.copyCmd}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary w-full !py-2 text-[13px] disabled:opacity-50"
          disabled={wakeBusy}
          title={t.lab.officialNote}
          onClick={onOpenOfficial}
        >
          {wakeBusy ? t.lab.wakeWaking : t.lab.launch}
        </button>
        <p className="text-[11px] leading-4 text-[var(--ink)]">{statusLine}</p>
        {wakeStatus === "busy" ? (
          <p className="text-[11px] leading-4 text-[var(--ink)]/70">{t.lab.wakeBusyDetail}</p>
        ) : null}
      </div>

      <OfficialEvalBody t={t} copied={copied} health={health} onHealth={onHealth} />

      <div className="border-t border-[var(--line)] p-3">
        <LivePip label={t.lab.official} onExpand={onExpandLive} />
      </div>
    </section>
  );
}

function StudioDock({
  t,
  overlay,
  setOverlay,
  cameraView,
  camKey,
  setCameraView,
  running,
  status,
  lastScore,
  showGrid,
  showTrails,
  showColliders,
  demoRecording,
  demoFrames,
  onIk,
  onSeek,
  onAbort,
  onReset,
  onGrid,
  onTrail,
  onColliders,
  onRecord,
  onStopDemo,
}: {
  t: Messages;
  overlay: Overlay;
  setOverlay: (id: Overlay) => void;
  cameraView: CameraView;
  camKey: (id: CameraView) => string;
  setCameraView: (id: CameraView) => void;
  running: boolean;
  status: string;
  lastScore: { spatial_accuracy: number; task_completion_score: number } | null;
  showGrid: boolean;
  showTrails: boolean;
  showColliders: boolean;
  demoRecording: boolean;
  demoFrames: number;
  onIk: () => void;
  onSeek: () => void;
  onAbort: () => void;
  onReset: () => void;
  onGrid: () => void;
  onTrail: () => void;
  onColliders: () => void;
  onRecord: () => void;
  onStopDemo: () => void;
}) {
  const capturing = demoRecording;

  return (
    <footer
      aria-label={t.lab.dockBar}
      className="studio-glass pointer-events-auto relative mt-3 shrink-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--chrome)]/90 shadow-[0_0_0_1px_var(--panel-inset)_inset] backdrop-blur-xl"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cyan)]/40 to-transparent" />
      <div className="flex flex-col gap-1.5 px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Seg label={t.lab.viewport}>
            {(
              [
                ["vision", t.lab.overlayVision],
                ["physics", t.lab.overlayPhysics],
                ["trajectories", t.lab.overlayTraj],
              ] as const
            ).map(([id, label]) => (
              <SegItem key={id} active={overlay === id} title={label} onClick={() => setOverlay(id)}>
                {label}
              </SegItem>
            ))}
          </Seg>

          <Seg label={t.lab.overlayCams}>
            {(
              [
                ["orbit", t.lab.camStudio],
                ["table", t.lab.camTable],
                ["top", t.lab.camTop],
                ["side", t.lab.camSide],
              ] as const
            ).map(([id, label]) => (
              <SegItem
                key={id}
                active={camKey(cameraView) === camKey(id)}
                title={label}
                onClick={() => setCameraView(id)}
              >
                {label}
              </SegItem>
            ))}
          </Seg>

          <div role="group" aria-label={t.lab.dockLayers} className="flex items-center gap-1">
            <LayerBtn on={showGrid} onClick={onGrid} label={t.lab.grid}>
              <IcoGrid />
            </LayerBtn>
            <LayerBtn on={showTrails} onClick={onTrail} label={t.lab.trail}>
              <IcoTrail />
            </LayerBtn>
            <LayerBtn on={showColliders} onClick={onColliders} label={t.lab.colliders}>
              <IcoCollider />
            </LayerBtn>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {lastScore ? (
              <span
                className="mono hidden rounded-full border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--ink)] sm:inline"
                title={`${t.lab.lastScore} · spatial ${lastScore.spatial_accuracy.toFixed(2)} · task ${lastScore.task_completion_score.toFixed(2)}`}
              >
                {t.lab.lastScore}
                <span className="text-[var(--ink)]"> </span>
                {lastScore.spatial_accuracy.toFixed(2)}
                <span className="text-[var(--ink)]"> · </span>
                {lastScore.task_completion_score.toFixed(2)}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] ${
                running
                  ? "border-[var(--cyan)]/35 bg-[var(--cyan)]/10 text-[var(--cyan)]"
                  : capturing
                    ? "border-[var(--danger)]/35 bg-[var(--danger)]/10 text-[var(--danger-text)]"
                    : "border-[var(--line)] text-[var(--ink)]"
              }`}
            >
              {running || capturing ? <span className="live-dot !h-1.5 !w-1.5" /> : null}
              {capturing ? t.lab.recording : running ? status : t.lab.dockLocal}
            </span>
            <KeyHints text={t.lab.keys} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-1.5">
          <div role="group" aria-label={t.lab.dockRun} className="flex items-center gap-1">
            <ActionBtn tone="primary" disabled={running} title={t.lab.runIk} onClick={onIk}>
              <IcoPlay />
              {t.lab.runIkShort}
            </ActionBtn>
            <ActionBtn tone="accent" disabled={running} title={t.lab.runSeek} onClick={onSeek}>
              {t.lab.runSeekShort}
            </ActionBtn>
            <ActionBtn tone={running ? "stop" : "ghost"} disabled={!running} title={t.lab.abort} onClick={onAbort}>
              {t.lab.abort}
            </ActionBtn>
            <ActionBtn tone="ghost" title={t.lab.reset} onClick={onReset}>
              {t.lab.reset}
            </ActionBtn>
          </div>

          <span className="hidden h-5 w-px bg-[var(--line)] sm:block" />

          <div role="group" aria-label={t.lab.dockCapture} className="flex items-center gap-1">
            <ActionBtn
              tone={demoRecording ? "rec" : "ghost"}
              title={demoRecording ? t.lab.stop : t.lab.dockRecordHint}
              onClick={demoRecording ? onStopDemo : onRecord}
            >
              <RecDot live={demoRecording} />
              {demoRecording ? (
                <>
                  {t.lab.stopShort}
                  <span className="mono text-[10px] opacity-80">
                    {demoFrames} {t.lab.frames}
                  </span>
                </>
              ) : (
                t.lab.recordShort
              )}
            </ActionBtn>
          </div>
        </div>
      </div>
    </footer>
  );
}

function JointRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="text-[var(--cyan)]">{value.toFixed(2)}</dd>
    </div>
  );
}

function TopDown() {
  const blocks = useHudStore((s) => s.blocks);
  const tcp = useHudStore((s) => s.tcp);
  const trail = useHudStore((s) => s.tcpTrail);
  const showTrails = useHudStore((s) => s.showTrails);
  const target = worldToMap(TARGET_ZONE.position[0], TARGET_ZONE.position[2]);
  const tcpPt = worldToMap(tcp[0], tcp[2]);

  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="mt-2 h-[88px] w-full rounded-xl bg-[var(--bg)]">
      <rect
        x="8"
        y="8"
        width={MAP_W - 16}
        height={MAP_H - 16}
        fill="none"
        stroke="var(--cyan)"
        strokeOpacity={0.28}
      />
      <circle cx={target.x} cy={target.y} r={9} fill="none" stroke="#FF7A3C" strokeOpacity={0.85} />
      {showTrails && trail.length > 1 ? (
        <polyline
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="1.2"
          opacity={0.7}
          points={trail
            .map((p) => {
              const m = worldToMap(p[0], p[2]);
              return `${m.x},${m.y}`;
            })
            .join(" ")}
        />
      ) : null}
      {blocks.map((block) => {
        const p = worldToMap(block.position[0], block.position[2]);
        return <rect key={block.id} x={p.x - 4} y={p.y - 4} width={8} height={8} rx={1} fill={block.color} />;
      })}
      <circle cx={tcpPt.x} cy={tcpPt.y} r={3.5} fill="#FF7A3C" />
    </svg>
  );
}
