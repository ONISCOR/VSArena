import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * End the Supabase session and return home.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (isSupabaseConfigured()) {
    const supabase = createServerSupabase();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}

export async function GET(request: Request) {
  return POST(request);
}
