import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Start GitHub OAuth (Supabase Auth). Redirects to GitHub.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const nextRaw = url.searchParams.get("next") ?? "/account";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account";
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/auth/error?reason=config`);
  }
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/auth/error?reason=oauth`);
  }
  return NextResponse.redirect(data.url);
}
