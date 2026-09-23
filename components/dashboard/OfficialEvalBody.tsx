"use client";

/**
 * Fill the Official eval rail: readiness checklist + read-only harness health.
 * Never opens an agent socket or writes ELO.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Messages } from "@/lib/copy/dictionary";
import {
  wakeOfficialHarness,
  type HarnessHealthSnapshot,
} from "@/lib/live/wakeHarness";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
        on ? "bg-[var(--cyan)] shadow-[0_0_6px_var(--cyan)]" : "bg-[var(--line)]"
      }`}
      aria-hidden
    />
  );
}

function Row({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-[12px] leading-4 text-[var(--ink)]">
      <Dot on={done} />
      <span className={done ? "text-[var(--ink)]" : "text-[var(--ink)]/70"}>{children}</span>
    </li>
  );
}

/**
 */
export function OfficialEvalBody({
  t,
  copied,
  health,
  onHealth,
}: {
  t: Messages;
  copied: boolean;
  health: HarnessHealthSnapshot | null;
  onHealth: (snap: HarnessHealthSnapshot) => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [hasAgent, setHasAgent] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void wakeOfficialHarness({ timeoutMs: 12_000, intervalMs: 2_500 }).then((snap) => {
      if (!cancelled) onHealth(snap);
    });
    return () => {
      cancelled = true;
    };
  }, [onHealth]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    const supabase = createBrowserSupabase();

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        setSignedIn(false);
        setHasAgent(false);
        setHasKey(false);
        return;
      }
      setSignedIn(true);
      try {
        const res = await fetch("/api/account", { credentials: "same-origin" });
        if (cancelled) return;
        if (!res.ok) {
          setHasAgent(false);
          setHasKey(false);
          return;
        }
        const json = (await res.json()) as {
          profile?: { api_key?: string | null };
          agents?: unknown[];
        };
        setHasKey(Boolean(json.profile?.api_key));
        setHasAgent(Array.isArray(json.agents) && json.agents.length > 0);
      } catch {
        if (!cancelled) {
          setHasAgent(false);
          setHasKey(false);
        }
      }
    };

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const harnessOk = health?.ok === true;
  const windowLabel = health?.evalWindow ?? "—";
  const productLabel = health?.product ?? "—";
  const queueLabel = health ? String(health.queue) : "—";
  const busyLabel = !health
    ? "—"
    : health.status === "busy"
      ? t.lab.evalBusy
      : health.status === "ready"
        ? t.lab.evalIdle
        : t.lab.evalDown;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3.5">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--cyan)]">
          {t.lab.evalChecklist}
        </p>
        <ol className="mt-2.5 space-y-2">
          <Row done={signedIn}>
            <Link href="/account" className="underline-offset-2 hover:underline">
              {t.lab.evalStepAccount}
            </Link>
          </Row>
          <Row done={hasKey && hasAgent}>
            <Link href="/account" className="underline-offset-2 hover:underline">
              {t.lab.evalStepAgent}
            </Link>
          </Row>
          <Row done={copied}>
            {t.lab.evalStepSdk}
          </Row>
          <Row done={harnessOk}>
            {t.lab.evalStepHarness}
          </Row>
        </ol>
      </div>

      <div>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--cyan)]">
          {t.lab.evalHealth}
        </p>
        <dl className="mt-2.5 space-y-1.5 font-mono text-[11px] leading-4">
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--ink)]/60">{t.lab.evalStatus}</dt>
            <dd className="text-[var(--ink)]">{busyLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--ink)]/60">{t.lab.evalQueue}</dt>
            <dd className="text-[var(--ink)]">{queueLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--ink)]/60">{t.lab.evalWindow}</dt>
            <dd className="text-[var(--ink)]">{windowLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--ink)]/60">{t.lab.evalProduct}</dt>
            <dd className="text-[var(--ink)]">{productLabel}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-4 text-[var(--ink)]/65">{t.lab.evalSteps}</p>
      </div>

      <p className="mt-auto pt-2 text-[11px] leading-4 text-[var(--ink)]/55">{t.lab.provenance}</p>
    </div>
  );
}
