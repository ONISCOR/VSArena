"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { displayNameFromMeta, handleFromMeta } from "@/lib/auth/identity";
import { startGithubSignIn } from "@/lib/auth/startGithub";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * GitHub control. Sign-in stays on this origin (not vsarena.vercel.app).
 */
export function AuthButton({ className }: { className?: string }) {
  const { m } = useI18n();
  const [label, setLabel] = useState<string | null>(null);
  const pathname = usePathname();
  const enabled = isSupabaseConfigured();
  const fallback =
    className ??
    "rounded-full px-3 py-1.5 text-sm text-[var(--mute)] hover:bg-[var(--lift)] hover:text-[var(--ink)]";

  useEffect(() => {
    if (!enabled) return;
    const supabase = createBrowserSupabase();
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        setLabel(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const handle = handleFromMeta(meta, user.email);
      setLabel(displayNameFromMeta(meta, handle));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        setLabel(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const handle = handleFromMeta(meta, user.email);
      setLabel(displayNameFromMeta(meta, handle));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <Link href="/account" className={fallback}>
        {m.nav.account}
      </Link>
    );
  }

  if (label) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Link href="/account?tab=profile" className={fallback}>
          {label}
        </Link>
        <form action="/auth/logout" method="post">
          <button type="submit" className="w-full text-center text-[11px] text-[var(--faint)] hover:text-[var(--ink)]">
            {m.nav.signOut}
          </button>
        </form>
      </div>
    );
  }

  const next = pathname.startsWith("/auth") ? "/account" : pathname || "/account";

  return (
    <button type="button" onClick={() => void startGithubSignIn(next)} className={fallback}>
      {m.nav.signIn}
    </button>
  );
}
