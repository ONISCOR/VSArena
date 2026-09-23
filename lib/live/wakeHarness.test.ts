import { describe, expect, it, vi } from "vitest";
import { parseHarnessHealth, wakeOfficialHarness } from "@/lib/live/wakeHarness";

describe("parseHarnessHealth", () => {
  it("marks ready when ok and not busy", () => {
    const snap = parseHarnessHealth(
      { ok: true, busy: false, queue: 0, eval: { eval_window: "2026-W38", product: "1.0.0" } },
      40,
    );
    expect(snap.status).toBe("ready");
    expect(snap.evalWindow).toBe("2026-W38");
    expect(snap.product).toBe("1.0.0");
  });

  it("marks busy when a match is running", () => {
    expect(parseHarnessHealth({ ok: true, busy: true, queue: 2 }, 10).status).toBe("busy");
  });

  it("rejects non-ok bodies", () => {
    expect(parseHarnessHealth({ ok: false }, 0).status).toBe("unreachable");
    expect(parseHarnessHealth(null, 0).status).toBe("unreachable");
  });
});

describe("wakeOfficialHarness", () => {
  it("returns on first healthy response without opening a match socket", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, busy: false, queue: 0 }),
    }));
    const sleep = vi.fn(async () => undefined);
    const snap = await wakeOfficialHarness({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
      timeoutMs: 5_000,
      intervalMs: 10,
      now: () => 0,
    });
    expect(snap.status).toBe("ready");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ method: "GET" });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries until timeout when unreachable", async () => {
    let t = 0;
    const fetchImpl = vi.fn(async () => {
      throw new Error("cold");
    });
    const sleep = vi.fn(async (ms: number) => {
      t += ms;
    });
    const snap = await wakeOfficialHarness({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
      timeoutMs: 100,
      intervalMs: 40,
      now: () => t,
    });
    expect(snap.status).toBe("unreachable");
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(1);
  });
});
