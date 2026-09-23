import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official VSArena mark — three stacked cubes (cyan → orange → magenta).
 */
export function CubeMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <Image
      src="/brand/vs-arena-icon.png"
      alt=""
      width={64}
      height={64}
      unoptimized
      aria-hidden
      className={cn("object-contain object-center", className)}
    />
  );
}
