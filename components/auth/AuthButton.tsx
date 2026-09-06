"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { displayNameFromMeta, handleFromMeta } from "@/lib/auth/identity";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * GitHub OAuth control for the site header.
 *
 * @example <AuthButton />
 */
export function AuthButton() {
  const { m } = useI18n();
  const [label, setLabel] = useState<string | null>(null);
  const pathname = usePathname();
  const enabled = isSupabaseConfigured();

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

  if (!enabled) return null;

  if (label) {
    return (
      <form action="/auth/logout" method="post" className="flex items-center gap-3">
        <Link href="/account" className="max-w-[12rem] truncate text-sm text-white hover:text-arena-cyan">
          {label}
        </Link>
        <button type="submit" className="text-sm text-arena-muted hover:text-white">
          {m.nav.signOut}
        </button>
      </form>
    );
  }

  async function signIn() {
    const next = pathname.startsWith("/auth") ? "/" : pathname || "/";
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) window.location.href = "/auth/error?reason=oauth";
    } catch {
      window.location.href = "/auth/error?reason=oauth";
    }
  }

  return (
    <button
      type="button"
      onClick={() => void signIn()}
      className="rounded-full px-3 py-1.5 text-sm text-arena-muted hover:bg-white/5 hover:text-white"
    >
      {m.nav.signIn}
    </button>
  );
}
