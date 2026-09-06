import { ImageResponse } from "next/og";
import { ACCENT_HEX, parseAccent, parseAvatar, type AgentAccent, type AgentAvatar } from "@/lib/gamification/identity";
import { siteUrl } from "@/lib/site";

export const runtime = "edge";
export const alt = "VSArena agent card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgAgent {
  name: string;
  elo: number;
  matches: number;
  tagline: string;
  accent: AgentAccent;
  avatarId: AgentAvatar;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fallbackAgent(slug: string): OgAgent {
  const house = slug === "baseline-ik";
  return {
    name: house ? "Baseline-IK" : slug,
    elo: 1200,
    matches: 0,
    tagline: house ? "House geometry seed. Not a VLA." : "Public ELO on the stacking task.",
    accent: house ? "orange" : "cyan",
    avatarId: "cobot",
  };
}

/**
 * Edge-safe lookup. Avoids the Node `ws` admin client (and the Windows ImageResponse font path).
 *
 * @example await loadOgAgent("baseline-ik")
 */
async function loadOgAgent(slug: string): Promise<OgAgent> {
  const house = fallbackAgent(slug);
  return (await loadFromSupabase(slug, house)) ?? (await loadFromLeaderboardApi(slug, house)) ?? house;
}

async function loadFromLeaderboardApi(slug: string, house: OgAgent): Promise<OgAgent | null> {
  try {
    const res = await fetch(`${siteUrl()}/api/leaderboard`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      agents?: Array<{
        slug: string;
        name: string;
        elo: number;
        matches: number;
        tagline: string | null;
        accent?: string;
        avatarId?: string;
      }>;
    };
    const row = json.agents?.find((item) => item.slug === slug);
    if (!row) return null;
    return {
      name: row.name,
      elo: row.elo,
      matches: row.matches,
      tagline: row.tagline?.trim() ? row.tagline.trim() : house.tagline,
      accent: parseAccent(row.accent || house.accent),
      avatarId: parseAvatar(row.avatarId),
    };
  } catch {
    return null;
  }
}

async function loadFromSupabase(slug: string, house: OgAgent): Promise<OgAgent | null> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!base.startsWith("https://") || key.length < 20) return null;

  try {
    const full = await fetch(`${base}/rest/v1/agents?select=id,name,elo_rating,tagline,accent,avatar_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const agentsRes = full.ok
      ? full
      : await fetch(`${base}/rest/v1/agents?select=id,name,elo_rating`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
    if (!agentsRes.ok) return null;
    const rows = (await agentsRes.json()) as Array<{
      id: string;
      name: string;
      elo_rating: number | null;
      tagline?: string | null;
      accent?: string | null;
      avatar_id?: string | null;
    }>;
    const row = rows.find((item) => slugify(item.name) === slug);
    if (!row) return null;

    const countRes = await fetch(`${base}/rest/v1/matches?select=id&agent_id=eq.${row.id}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    const total = countRes.headers.get("content-range")?.split("/")[1];
    const matches = total && total !== "*" ? Number(total) : 0;

    return {
      name: row.name,
      elo: Number(row.elo_rating ?? 1200),
      matches: Number.isFinite(matches) ? matches : 0,
      tagline: row.tagline?.trim() ? row.tagline.trim() : house.tagline,
      accent: parseAccent(row.accent || house.accent),
      avatarId: parseAvatar(row.avatar_id),
    };
  } catch {
    return null;
  }
}

/**
 * Share card for /leaderboard/[slug]. Name + ELO, not a toy banner.
 *
 * @example fetched as /leaderboard/baseline-ik/opengraph-image
 */
export default async function AgentOpenGraphImage({ params }: { params: { slug: string } }) {
  const agent = await loadOgAgent(params.slug);
  const accent = ACCENT_HEX[agent.accent];
  const avatar = agent.avatarId;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#07080b",
          backgroundImage: `radial-gradient(circle at 14% 18%, ${accent}44 0%, transparent 42%), radial-gradient(circle at 88% 82%, rgba(247,148,30,0.18) 0%, transparent 40%)`,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#00AEEF", fontSize: 36, fontWeight: 700 }}>V</span>
            <span style={{ color: "#F7941E", fontSize: 36, fontWeight: 700 }}>S</span>
            <span style={{ color: "#ffffff", fontSize: 32, fontWeight: 600, marginLeft: 12 }}>Arena</span>
          </div>
          <div style={{ color: "#8B949E", fontSize: 22 }}>VLA track</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              height: 96,
              width: 96,
              borderRadius: 22,
              border: `2px solid ${accent}99`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatar === "cube" ? (
              <div style={{ width: 28, height: 28, backgroundColor: accent, borderRadius: 4 }} />
            ) : avatar === "eye" ? (
              <div
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 999,
                  border: `3px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: accent }} />
              </div>
            ) : avatar === "stack" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 14, height: 6, borderRadius: 1, backgroundColor: accent }} />
                <div style={{ width: 22, height: 6, borderRadius: 1, backgroundColor: accent }} />
                <div style={{ width: 30, height: 6, borderRadius: 1, backgroundColor: accent }} />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                <div style={{ width: 8, height: 16, borderRadius: 2, backgroundColor: "#8B949E" }} />
                <div style={{ width: 8, height: 24, borderRadius: 2, backgroundColor: accent }} />
                <div style={{ width: 8, height: 32, borderRadius: 2, backgroundColor: "#e8edf4" }} />
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
            <div style={{ color: "#ffffff", fontSize: 64, fontWeight: 600, letterSpacing: -1.4 }}>{agent.name}</div>
            <div style={{ marginTop: 10, color: "#8B949E", fontSize: 26 }}>{agent.tagline}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 40, color: "#ffffff", fontSize: 28 }}>
          <div style={{ display: "flex" }}>
            ELO <span style={{ marginLeft: 12, color: accent }}>{agent.elo}</span>
          </div>
          <div style={{ display: "flex", color: "#8B949E" }}>{agent.matches} matches</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
