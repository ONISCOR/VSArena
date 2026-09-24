"use client";

import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * GitHub OAuth must return to *this* origin. Supabase Site URL is production;
 * if localhost is missing from Redirect URLs, GitHub dumps you on www.vsarena.app.
 */
export async function startGithubSignIn(next = "/account"): Promise<void> {
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}`;
  const supabase = createBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) {
    window.location.href = "/auth/error?reason=oauth";
    return;
  }
  const oauth = new URL(data.url);
  oauth.searchParams.set("redirect_to", redirectTo);
  window.location.assign(oauth.toString());
}
