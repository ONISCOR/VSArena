"use client";

import { Grid } from "@react-three/drei";
import { useHudStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { TABLE_HALF_EXTENTS, TABLE_TOP_Y } from "@/simulation/constants";

/** Occupancy overlay on the table top — not on the hall floor. */
export function GridFloor() {
  const visible = useHudStore((s) => s.showGrid);
  const light = useTheme().theme === "light";
  if (!visible) return null;

  return (
    <Grid
      position={[0, TABLE_TOP_Y + 0.0012, 0]}
      args={[TABLE_HALF_EXTENTS.x * 2, TABLE_HALF_EXTENTS.z * 2]}
      cellSize={0.05}
      cellThickness={0.4}
      cellColor={light ? "#8a8378" : "#2a3340"}
      sectionSize={0.25}
      sectionThickness={0.7}
      sectionColor={light ? "#5c574e" : "#3ee0ea"}
      fadeDistance={1.6}
      fadeStrength={1.4}
      infiniteGrid={false}
    />
  );
}
