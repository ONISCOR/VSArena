"use client";

import type { ReactNode } from "react";
import { Link } from "@/components/site/Link";

export function StudioLink({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Link href="/simulation" className={className}>
      {children}
    </Link>
  );
}

export function AccountLink({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Link href="/account" className={className}>
      {children}
    </Link>
  );
}
