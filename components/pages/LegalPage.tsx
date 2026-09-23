"use client";

import { LegalView } from "@/components/legal/LegalView";

export function LegalPage({ kind }: { kind: "terms" | "privacy" | "cookies" }) {
  return <LegalView kind={kind} />;
}
