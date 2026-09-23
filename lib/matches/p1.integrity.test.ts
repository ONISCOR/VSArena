import { describe, expect, it } from "vitest";
import {
  OFFICIAL_MATCHES_PER_AGENT_WINDOW,
  checkAndBumpRateLimit,
  evalWindowStartUtc,
  rateLimitKey,
} from "@/lib/eval/rateLimit";
import { shouldIngestObservationMode } from "@/lib/eval/taxonomy";
import { spectateKindForArm } from "@/lib/harness/spectate";
import { eloDelta, eloOutcome } from "@/lib/scoring/elo";

describe("P1 binary ELO", () => {
  it("maps only a full stack to outcome 1", () => {
    expect(eloOutcome("completed", 1)).toBe(1);
    expect(eloOutcome("completed", 0.99)).toBe(0);
    expect(eloOutcome("completed", 0.5)).toBe(0);
    expect(eloOutcome("failed", 1)).toBe(0);
  });

  it("does not award ELO for partial completion", () => {
    expect(eloDelta(1200, eloOutcome("completed", 0.5), 0)).toBe(-20);
    expect(eloDelta(1200, eloOutcome("completed", 1), 0)).toBe(20);
    expect(eloDelta(1200, 0.5, 0)).toBe(-20);
  });
});

describe("P1 VLA-only ingest gate", () => {
  it("allows only vla", () => {
    expect(shouldIngestObservationMode("vla")).toBe(true);
    expect(shouldIngestObservationMode("state")).toBe(false);
  });
});

describe("P1 spectate kind", () => {
  it("labels scored public arms as scored, not control", () => {
    expect(spectateKindForArm("control")).toBe("control");
    expect(spectateKindForArm("scored")).toBe("scored");
  });
});

describe("P1 rate limit helpers", () => {
  it("bumps until the weekly cap", () => {
    const store = new Map<string, number>();
    const key = rateLimitKey("profile", "Ada", "2026-W38");
    for (let i = 0; i < OFFICIAL_MATCHES_PER_AGENT_WINDOW; i += 1) {
      expect(checkAndBumpRateLimit(store, key).ok).toBe(true);
    }
    expect(checkAndBumpRateLimit(store, key).ok).toBe(false);
  });

  it("parses ISO week Monday bounds", () => {
    const start = evalWindowStartUtc("2026-W38");
    expect(start).not.toBeNull();
    expect(start?.toISOString().startsWith("2026-09-14")).toBe(true);
  });
});
