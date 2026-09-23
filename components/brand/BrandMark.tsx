import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** Intrinsic pixel size hint for next/image. */
  width?: number;
  height?: number;
  priority?: boolean;
  decorative?: boolean;
}

/**
 * Official VSArena lockup — three glowing cubes on black (cyan → orange → magenta).
 */
export function BrandMark({
  className,
  width = 256,
  height = 256,
  priority = false,
  decorative = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/brand/vs-arena-icon.png"
      alt={decorative ? "" : "VSArena"}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={cn("bg-transparent object-contain object-center", className)}
    />
  );
}
