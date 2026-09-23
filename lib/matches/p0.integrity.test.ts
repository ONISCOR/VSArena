import { describe, expect, it } from "vitest";
import { PRODUCT_VERSION } from "@/lib/eval/product";
import { FAILURE_CODES } from "@/lib/eval/taxonomy";
import { eloDelta } from "@/lib/scoring/elo";

describe("P0 product version", () => {
  it("stamps provenance product 1.0.0", () => {
    expect(PRODUCT_VERSION).toBe("1.0.0");
  });
});

describe("P0 ownership failure codes", () => {
  it("publishes agent ownership codes", () => {
    expect(FAILURE_CODES).toContain("protocol.agent_unregistered");
    expect(FAILURE_CODES).toContain("protocol.agent_forbidden");
  });
});

describe("P0 ELO formula lockstep with SQL RPC", () => {
  it("matches the plpgsql K-factor and expected-score math", () => {
    // Mirror supabase/record-match.sql for rating=1200, outcome=1, played=0
    const rating = 1200;
    const outcome = 1;
    const played = 0;
    const k = played < 8 ? 40 : played < 24 ? 24 : 16;
    const expected = 1 / (1 + 10 ** ((1200 - rating) / 400));
    const sqlDelta = Math.round(k * (outcome - expected));
    expect(eloDelta(rating, outcome, played)).toBe(sqlDelta);
    expect(eloDelta(1200, 0, 0)).toBe(Math.round(40 * (0 - 0.5)));
    expect(eloDelta(1400, 1, 10)).toBe(
      Math.round(24 * (1 - 1 / (1 + 10 ** ((1200 - 1400) / 400)))),
    );
    // Binary gate: fractional outcome collapses to 0 before the Elo step.
    expect(eloDelta(1200, 0.75, 0)).toBe(eloDelta(1200, 0, 0));
  });
});
