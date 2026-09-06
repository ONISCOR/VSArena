import { ACCENT_HEX, type AgentAccent, type AgentAvatar } from "@/lib/gamification/identity";
import { cn } from "@/lib/utils";

interface AgentMarkProps {
  avatar: AgentAvatar;
  accent: AgentAccent;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "h-8 w-8", md: "h-11 w-11", lg: "h-16 w-16" };

/**
 * Geometric agent avatar. No raster, no emoji.
 *
 * @example <AgentMark avatar="eye" accent="cyan" />
 */
export function AgentMark({ avatar, accent, size = "md", className }: AgentMarkProps) {
  const color = ACCENT_HEX[accent];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-black/40",
        SIZES[size],
        className,
      )}
      style={{ borderColor: `${color}55` }}
      aria-hidden
    >
      <span className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 30% 20%, ${color}, transparent 70%)` }} />
      <Mark avatar={avatar} color={color} />
    </span>
  );
}

function Mark({ avatar, color }: { avatar: AgentAvatar; color: string }) {
  if (avatar === "cube") {
    return <span className="relative h-3.5 w-3.5 rotate-12 rounded-[3px]" style={{ background: color }} />;
  }
  if (avatar === "eye") {
    return (
      <span className="relative flex h-4 w-6 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      </span>
    );
  }
  if (avatar === "stack") {
    return (
      <span className="relative flex flex-col items-center gap-0.5">
        <span className="h-1 w-2 rounded-[1px]" style={{ background: color }} />
        <span className="h-1 w-3 rounded-[1px]" style={{ background: color }} />
        <span className="h-1 w-4 rounded-[1px]" style={{ background: color }} />
      </span>
    );
  }
  return (
    <span className="relative flex items-end gap-0.5">
      <span className="h-2 w-1 rounded-sm bg-white/40" />
      <span className="h-3 w-1 rounded-sm" style={{ background: color }} />
      <span className="h-4 w-1 rounded-sm bg-white/70" />
    </span>
  );
}
