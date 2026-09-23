import Image from "next/image";
import { cn } from "@/lib/utils";

interface OniscorMarkProps {
  className?: string;
  width?: number;
  height?: number;
  decorative?: boolean;
}

/**
 * ONISCOR lab mark (icon + wordmark on black). Used as Aran Kair’s avatar.
 */
export function OniscorMark({
  className,
  width = 256,
  height = 256,
  decorative = false,
}: OniscorMarkProps) {
  return (
    <Image
      src="/brand/oniscor-mark.jpg"
      alt={decorative ? "" : "ONISCOR"}
      width={width}
      height={height}
      unoptimized
      className={cn("object-contain object-center", className)}
    />
  );
}
