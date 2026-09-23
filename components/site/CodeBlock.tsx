"use client";

import { useState } from "react";

export function CodeBlock({ code, label = "python" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="panel overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{label}</span>
        <button
          type="button"
          suppressHydrationWarning
          className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--mute)] hover:text-[var(--ink)]"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-[#d8d4cb]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
