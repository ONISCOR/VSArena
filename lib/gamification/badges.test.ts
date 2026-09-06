import { describe, expect, it } from "vitest";
import { computeBadges, filterBoard } from "@/lib/gamification/badges";
import { decorateAgents } from "@/lib/gamification/decorate";
import { parseAccent, parseTagline } from "@/lib/gamification/identity";

describe("computeBadges", () => {
  it("stays empty until a live match exists", () => {
    expect(
      computeBadges({ slug: "ada", matches: 0, weekMatches: 0, elo: 1300, houseElo: 1200, stacked: false }),
    ).toEqual([]);
  });

  it("awards first live, streak, beat house, and stacker", () => {
    expect(
      computeBadges({ slug: "ada", matches: 4, weekMatches: 3, elo: 1210, houseElo: 1200, stacked: true }),
    ).toEqual(["first_live", "streak_3", "beat_house", "stacker"]);
  });

  it("does not give beat-house to the house seed", () => {
    expect(
      computeBadges({
        slug: "baseline-ik",
        matches: 2,
        weekMatches: 0,
        elo: 1250,
        houseElo: 1200,
        stacked: false,
      }),
    ).toEqual(["first_live"]);
  });
});

describe("filterBoard", () => {
  const rows = [
    { status: "live" as const, matches: 5, weekMatches: 2, createdAt: "2026-01-01T00:00:00.000Z" },
    { status: "seed" as const, matches: 0, weekMatches: 0, createdAt: "2026-08-20T00:00:00.000Z" },
    { status: "live" as const, matches: 1, weekMatches: 0, createdAt: "2026-01-01T00:00:00.000Z" },
  ];

  it("keeps global order for all", () => {
    expect(filterBoard(rows, "all")).toHaveLength(3);
  });

  it("filters this week and live", () => {
    expect(filterBoard(rows, "week")).toHaveLength(1);
    expect(filterBoard(rows, "live")).toHaveLength(2);
  });

  it("treats low match count as newcomer", () => {
    expect(filterBoard(rows, "new", Date.parse("2026-08-27T00:00:00.000Z")).map((r) => r.matches)).toEqual([
      0, 1,
    ]);
  });

  it("does not list the house seed as a newcomer", () => {
    expect(
      filterBoard(
        [{ slug: "baseline-ik", status: "seed" as const, matches: 0, weekMatches: 0, createdAt: "2026-08-20T00:00:00.000Z" }],
        "new",
        Date.parse("2026-08-27T00:00:00.000Z"),
      ),
    ).toEqual([]);
  });
});

describe("decorateAgents", () => {
  it("counts week matches from pulses", () => {
    const now = Date.parse("2026-08-27T12:00:00.000Z");
    const [ada] = decorateAgents(
      [{ slug: "ada", name: "Ada", elo: 1215, accent: "orange", avatarId: "eye" }],
      [
        { slug: "ada", at: "2026-08-26T12:00:00.000Z", stacked: true },
        { slug: "ada", at: "2026-08-01T12:00:00.000Z", stacked: false },
      ],
      now,
    );
    expect(ada.matches).toBe(2);
    expect(ada.weekMatches).toBe(1);
    expect(ada.badges).toContain("first_live");
    expect(ada.badges).toContain("stacker");
    expect(ada.accent).toBe("orange");
    expect(ada.samplerSeedLabel).toMatch(/^[0-9a-f]{8}$/);
    expect(ada.signed).toBe(false);
    expect(ada.controlFailRate).toBeNull();
  });

  it("aggregates control vs scored fail rates and the latest signature", () => {
    const [ada] = decorateAgents(
      [{ slug: "ada", name: "Ada", elo: 1215 }],
      [
        {
          slug: "ada",
          at: "2026-08-26T12:00:00.000Z",
          stacked: false,
          signed: true,
          scoredFailed: true,
          controlFailed: false,
        },
        {
          slug: "ada",
          at: "2026-08-20T12:00:00.000Z",
          stacked: true,
          signed: false,
          scoredFailed: false,
          controlFailed: false,
        },
      ],
      Date.parse("2026-08-27T12:00:00.000Z"),
    );
    expect(ada.signed).toBe(true);
    expect(ada.controlFailRate).toBe(0);
    expect(ada.scoredFailRate).toBe(0.5);
  });

  it("gives the house seed a default look", () => {
    const [house] = decorateAgents([{ slug: "baseline-ik", name: "Baseline-IK", elo: 1200 }], []);
    expect(house.tagline).toMatch(/House geometry/);
    expect(house.accent).toBe("orange");
    expect(house.badges).toEqual([]);
  });
});

describe("identity parsers", () => {
  it("falls back on junk", () => {
    expect(parseAccent("purple")).toBe("cyan");
    expect(parseTagline("  hi  ")).toBe("hi");
    expect(parseTagline("")).toBeNull();
  });
});
