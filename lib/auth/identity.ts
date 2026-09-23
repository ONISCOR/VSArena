import type { User } from "@supabase/supabase-js";
import { FOUNDER_NAME } from "@/lib/content";

const FOUNDER_HANDLE = "arankair";
const FOUNDER_ALIASES = new Set([FOUNDER_HANDLE, "novacoding-g"]);

/**
 * GitHub handle from Auth metadata, with a stable fallback.
 */
export function githubUsername(user: User): string {
  return handleFromMeta(user.user_metadata ?? {}, user.email);
}

/**
 * Public name for the header and the account desk.
 */
export function githubDisplayName(user: User): string {
  return displayNameFromMeta(user.user_metadata ?? {}, githubUsername(user));
}

/**
 * Handle from raw Auth metadata (safe in the browser).
 */
export function handleFromMeta(meta: Record<string, unknown>, email?: string | null): string {
  const raw = meta.user_name ?? meta.preferred_username ?? meta.login ?? email?.split("@")[0];
  const handle = String(raw ?? "user")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
  return handle || "user";
}

/**
 * Spoken name. Founder handle maps to Aran Kair when GitHub has no full name.
 */
export function displayNameFromMeta(meta: Record<string, unknown>, handle: string): string {
  const full = String(meta.full_name ?? meta.name ?? "").trim();
  if (full) {
    const compact = full.toLowerCase().replace(/[\s._-]/g, "");
    if (FOUNDER_ALIASES.has(compact)) return FOUNDER_NAME;
    return full.slice(0, 64);
  }
  if (FOUNDER_ALIASES.has(handle)) return FOUNDER_NAME;
  return handle;
}
