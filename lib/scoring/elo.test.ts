import { describe, expect, it } from "vitest";
import { eloDelta, eloOutcome, expectedScore, kFactor } from "@/lib/scoring/elo";

describe("kFactor", () => {
  it("starts high and decays with sample size", () => {
    expect(kFactor(0)).toBe(40);
    expect(kFactor(8)).toBe(24);
    expect(kFactor(24)).toBe(16);
  });
});

describe("expectedScore", () => {
  it("is 0.5 at equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 8);
  });

  it("favors the higher rating", () => {
    expect(expectedScore(1400, 1200)).toBeGreaterThan(0.7);
    expect(expectedScore(1000, 1200)).toBeLessThan(0.3);
  });
});

describe("eloDelta", () => {
  it("awards +K/2 on a win vs equal", () => {
    expect(eloDelta(1200, 1, 0)).toBe(20);
  });

  it("penalizes a loss vs equal", () => {
    expect(eloDelta(1200, 0, 0)).toBe(-20);
  });

  it("treats fractional outcomes as a loss (binary stack gate)", () => {
    expect(eloDelta(1200, 0.5, 0)).toBe(-20);
    expect(eloDelta(1200, 0.99, 0)).toBe(-20);
  });
});

describe("eloOutcome", () => {
  it("requires a full tower", () => {
    expect(eloOutcome("completed", 1)).toBe(1);
    expect(eloOutcome("completed", 0.8)).toBe(0);
  });
});
