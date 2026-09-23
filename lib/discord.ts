/** Official VSArena Discord. Invite code is public; counts refresh from Discord’s invite API. */

export const DISCORD_INVITE_CODE = "M3FcTGf5wK";
export const DISCORD_INVITE_URL = `https://discord.gg/${DISCORD_INVITE_CODE}`;
export const DISCORD_GUILD_ID = "1540518566045028374";

export interface DiscordPreview {
  name: string;
  description: string;
  iconUrl: string | null;
  memberCount: number | null;
  onlineCount: number | null;
  channel: string;
  inviteUrl: string;
}

const FALLBACK: DiscordPreview = {
  name: "VSArena community",
  description: "VSArena — Benchmarking the next generation of AI agents.",
  iconUrl: `https://cdn.discordapp.com/icons/${DISCORD_GUILD_ID}/4fe7ae80ef5c4b8b080671a10e756a3e.png?size=128`,
  memberCount: null,
  onlineCount: null,
  channel: "welcome",
  inviteUrl: DISCORD_INVITE_URL,
};

interface InvitePayload {
  guild?: { id?: string; name?: string; description?: string | null; icon?: string | null };
  channel?: { name?: string };
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

function iconUrl(guildId: string, icon: string | null | undefined): string | null {
  if (!icon) return FALLBACK.iconUrl;
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`;
}

function channelLabel(raw: string | undefined): string {
  if (!raw) return FALLBACK.channel;
  return raw.replace(/^[^\p{L}\p{N}]+/u, "").trim() || FALLBACK.channel;
}

/**
 * Public invite card for /community. Cached; never blocks the page if Discord is down.
 */
export async function fetchDiscordPreview(): Promise<DiscordPreview> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true&with_expiration=true`,
      {
        headers: { "User-Agent": "VSArena/1.0 (community preview)" },
        next: { revalidate: 600 },
      },
    );
    if (!response.ok) return FALLBACK;
    const data = (await response.json()) as InvitePayload;
    const guild = data.guild;
    if (!guild?.id) return FALLBACK;
    return {
      name: guild.name?.trim() || FALLBACK.name,
      description: (guild.description ?? FALLBACK.description).trim(),
      iconUrl: iconUrl(guild.id, guild.icon),
      memberCount: data.approximate_member_count ?? null,
      onlineCount: data.approximate_presence_count ?? null,
      channel: channelLabel(data.channel?.name),
      inviteUrl: DISCORD_INVITE_URL,
    };
  } catch {
    return FALLBACK;
  }
}
