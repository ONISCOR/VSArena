"use client";

import { TABLE_HALF_EXTENTS, TARGET_ZONE } from "@/simulation/constants";
import { useHudStore } from "@/lib/store";
import type { SimTabId } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VlaFeed } from "@/components/dashboard/VlaFeed";

const MAP_W = 200;
const MAP_H = 128;

function worldToMap(x: number, z: number): { x: number; y: number } {
  const nx = (x + TABLE_HALF_EXTENTS.x) / (TABLE_HALF_EXTENTS.x * 2);
  const nz = (z + TABLE_HALF_EXTENTS.z) / (TABLE_HALF_EXTENTS.z * 2);
  return { x: nx * MAP_W, y: (1 - nz) * MAP_H };
}

interface LeftRailProps {
  tab: SimTabId;
}

/** Left diagnostic stack — vision / physics / trails / camera, driven by telemetry refs via Zustand. */
export function LeftRail({ tab }: LeftRailProps) {
  const blocks = useHudStore((s) => s.blocks);
  const tcp = useHudStore((s) => s.tcp);
  const trail = useHudStore((s) => s.tcpTrail);
  const grasped = useHudStore((s) => s.graspedBlockId);
  const heatmap = useHudStore((s) => s.showHeatmap);
  const showTrails = useHudStore((s) => s.showTrails);
  const joints = useHudStore((s) => s.joints);
  const cameraView = useHudStore((s) => s.cameraView);
  const setCameraView = useHudStore((s) => s.setCameraView);

  const target = worldToMap(TARGET_ZONE.position[0], TARGET_ZONE.position[2]);
  const tcpPt = worldToMap(tcp[0], tcp[2]);

  return (
    <aside className="flex min-h-0 flex-col gap-2 [&_.panel]:backdrop-blur-xl">
      <section className="panel overflow-hidden">
        <header className="flex items-center justify-between border-b border-white/5 px-3 py-2">
          <p className="text-xs font-medium text-white">Top-down</p>
          <Badge variant="cyan">Live</Badge>
        </header>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-[128px] w-full bg-[#07090c]">
          {heatmap
            ? blocks.map((block) => {
                const p = worldToMap(block.position[0], block.position[2]);
                return <circle key={`h-${block.id}`} cx={p.x} cy={p.y} r={18} fill={block.color} opacity={0.18} />;
              })
            : null}
          <rect x="8" y="10" width={MAP_W - 16} height={MAP_H - 20} fill="none" stroke="#00AEEF" strokeOpacity={0.25} />
          <circle cx={target.x} cy={target.y} r={10} fill="none" stroke="#F7941E" strokeOpacity={0.8} />
          {showTrails && trail.length > 1 ? (
            <polyline
              fill="none"
              stroke="#00AEEF"
              strokeWidth="1.2"
              opacity={0.7}
              points={trail.map((p) => {
                const m = worldToMap(p[0], p[2]);
                return `${m.x},${m.y}`;
              }).join(" ")}
            />
          ) : null}
          {blocks.map((block) => {
            const p = worldToMap(block.position[0], block.position[2]);
            return <rect key={block.id} x={p.x - 5} y={p.y - 5} width={10} height={10} fill={block.color} />;
          })}
          <circle cx={tcpPt.x} cy={tcpPt.y} r={4} fill="#F7941E" />
        </svg>
      </section>

      {tab === "vision" ? <VlaFeed /> : null}

      {tab === "vision" || tab === "physics" ? (
        <section className="panel px-3 py-2">
          <p className="text-xs font-medium text-white">Objects</p>
          <ul className="mt-2 space-y-1.5 font-mono text-[11px]">
            {blocks.length === 0 ? (
              <li className="text-arena-muted">Waiting for physics…</li>
            ) : (
              blocks.map((block) => (
                <li key={block.id} className="flex items-center justify-between">
                  <span className="capitalize" style={{ color: block.color }}>
                    {block.id.replace("block_", "")}
                  </span>
                  <span className="text-arena-muted">
                    {grasped === block.id ? "grasped" : `${block.position[0].toFixed(2)}, ${block.position[2].toFixed(2)}`}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {tab === "vision" ? (
        <section className="panel px-3 py-2">
          <p className="text-xs font-medium text-white">Occupancy</p>
          <div className="mt-2 flex items-center gap-3">
            <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-hidden>
              <circle cx="36" cy="36" r="30" fill="none" stroke="#1a2430" strokeWidth="8" />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="#00AEEF"
                strokeWidth="8"
                strokeDasharray="88 188"
                strokeLinecap="butt"
                transform="rotate(-90 36 36)"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="#F7941E"
                strokeWidth="8"
                strokeDasharray="40 188"
                strokeDashoffset="-88"
                transform="rotate(-90 36 36)"
              />
              <text x="36" y="40" textAnchor="middle" fill="#E8EEF5" fontSize="11" fontFamily="ui-monospace, monospace">
                {blocks.length}
              </text>
            </svg>
            <p className="font-mono text-[10px] leading-4 text-arena-muted">
              Table {TABLE_HALF_EXTENTS.x * 2}m × {TABLE_HALF_EXTENTS.z * 2}m
              <br />
              {blocks.length} dynamic bodies
            </p>
          </div>
        </section>
      ) : null}

      {tab === "physics" ? (
        <section className="panel px-3 py-2">
          <p className="text-xs font-medium text-white">Joints</p>
          <dl className="mt-2 space-y-1 font-mono text-[11px] text-arena-muted">
            <Row label="yaw" value={joints.baseYaw} />
            <Row label="shoulder" value={joints.shoulderPitch} />
            <Row label="elbow" value={joints.elbowPitch} />
            <Row label="wrist" value={joints.wristPitch} />
            <Row label="gripper" value={joints.gripper} />
          </dl>
        </section>
      ) : null}

      {tab === "trajectories" ? (
        <section className="panel px-3 py-2">
          <p className="text-xs font-medium text-white">TCP trail</p>
          <p className="mt-2 font-mono text-[11px] text-arena-muted">{trail.length} samples · enable Trail in the dock</p>
        </section>
      ) : null}

      {tab === "environment" ? (
        <section className="panel flex flex-col gap-2 px-3 py-2">
          <p className="text-xs font-medium text-white">Camera</p>
          {(["orbit", "table", "top", "side"] as const).map((view) => (
            <Button key={view} size="sm" variant={cameraView === view ? "default" : "outline"} onClick={() => setCameraView(view)}>
              {view === "table" ? "Table 360" : view === "orbit" ? "Studio" : view}
            </Button>
          ))}
        </section>
      ) : null}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="text-arena-cyan">{value.toFixed(2)}</dd>
    </div>
  );
}
