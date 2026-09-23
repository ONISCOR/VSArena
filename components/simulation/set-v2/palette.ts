"use client";

import { useMemo } from "react";
import { useTheme } from "@/lib/theme";

export function useHallPalette() {
  const light = useTheme().theme === "light";
  return useMemo(
    () => ({
      light,
      floor: light ? "#8d877c" : "#3a4048",
      epoxy: light ? "#6f6a62" : "#2a3038",
      wall: light ? "#c9c0b3" : "#5a616a",
      dado: light ? "#9a9286" : "#3d434c",
      steel: light ? "#7a7670" : "#5a616a",
      beam: light ? "#5c5852" : "#3a3f46",
      housing: light ? "#4a4742" : "#1c2026",
      yellow: "#d9a21b",
      lamp: "#f4f1e6",
      window: light ? "#c5d8ea" : "#6a8eaa",
      crate: light ? "#6b5340" : "#3d3229",
    }),
    [light],
  );
}
