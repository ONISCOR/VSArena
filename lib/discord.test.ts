import { describe, expect, it } from "vitest";
import { DISCORD_INVITE_URL } from "@/lib/discord";

describe("discord invite", () => {
  it("points at the official VSArena server", () => {
    expect(DISCORD_INVITE_URL).toBe("https://discord.gg/M3FcTGf5wK");
  });
});
