import type { User } from "@supabase/supabase-js";
import { githubUsername } from "@/lib/auth/identity";
import { createAdminSupabase } from "@/lib/supabase/admin";

export { githubUsername } from "@/lib/auth/identity";

/**
 * Insert a profiles row for a newly signed-in user (idempotent).
 */
export async function ensureProfile(user: User): Promise<void> {
  const admin = createAdminSupabase();
  const username = githubUsername(user);
  const githubUrl = `https://github.com/${username}`;
  const { data: existing, error: readError } = await admin
    .from("profiles")
    .select("id, username, github_url")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) {
    if (existing.username !== username || existing.github_url !== githubUrl) {
      const { error: syncError } = await admin
        .from("profiles")
        .update({ username, github_url: githubUrl })
        .eq("id", user.id);
      if (syncError && syncError.code !== "23505") throw syncError;
    }
    return;
  }

  const { error } = await admin.from("profiles").insert({
    id: user.id,
    username,
    github_url: githubUrl,
  });
  if (error?.code === "23505") {
    return;
  }
  if (error) throw error;
}
