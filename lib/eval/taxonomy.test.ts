import { describe, expect, it } from "vitest";
import {
  FAILURE_CODES,
  harnessError,
  matchFailure,
  officialMatchStatus,
  shouldIngestOfficialResult,
  timeoutStrikeBudget,
} from "@/lib/eval/taxonomy";

describe("failure taxonomy", () => {
  it("keeps dotted codes in policy | protocol | harness", () => {
    for (const code of FAILURE_CODES) {
      expect(["policy", "protocol", "harness"]).toContain(code.split(".")[0]);
    }
  });

  it("prefixes wire errors with the code", () => {
    const err = harnessError("harness.busy", "one match at a time", true);
    expect(err.type).toBe("error");
    expect(err.code).toBe("harness.busy");
    expect(err.domain).toBe("harness");
    expect(err.recoverable).toBe(true);
    expect(err.message.startsWith("harness.busy:")).toBe(true);
  });

  it("ranks disconnect, timeout, invalid, then completion", () => {
    const base = {
      completion: 1,
      consecutiveTimeouts: 8,
      timeoutBudget: 8,
      invalidActions: 5,
      invalidBudget: 5,
      disconnected: true,
    };
    expect(matchFailure(base).code).toBe("harness.disconnect");
    expect(matchFailure({ ...base, disconnected: false }).code).toBe("policy.timeout");
    expect(
      matchFailure({ ...base, disconnected: false, consecutiveTimeouts: 0 }).code,
    ).toBe("protocol.invalid_action");
    expect(
      matchFailure({
        ...base,
        disconnected: false,
        consecutiveTimeouts: 0,
        invalidActions: 0,
      }).code,
    ).toBe("policy.task_complete");
    expect(
      matchFailure({
        ...base,
        disconnected: false,
        consecutiveTimeouts: 0,
        invalidActions: 0,
        completion: 0.3,
      }).code,
    ).toBe("policy.task_incomplete");
  });

  it("preserves ELO status for horizon-end incomplete matches", () => {
    expect(officialMatchStatus("policy.task_complete")).toBe("completed");
    expect(officialMatchStatus("policy.task_incomplete")).toBe("completed");
    expect(officialMatchStatus("policy.timeout")).toBe("failed");
    expect(officialMatchStatus("protocol.invalid_action")).toBe("failed");
    expect(shouldIngestOfficialResult({ code: "policy.timeout", domain: "policy", message: "", recoverable: false })).toBe(
      true,
    );
    expect(
      shouldIngestOfficialResult({
        code: "harness.disconnect",
        domain: "harness",
        message: "",
        recoverable: true,
      }),
    ).toBe(false);
    expect(
      shouldIngestOfficialResult({
        code: "protocol.invalid_action",
        domain: "protocol",
        message: "",
        recoverable: false,
      }),
    ).toBe(false);
  });

  it("gives VLA a tighter timeout budget than state", () => {
    expect(timeoutStrikeBudget("vla")).toBeLessThan(timeoutStrikeBudget("state"));
  });
});
