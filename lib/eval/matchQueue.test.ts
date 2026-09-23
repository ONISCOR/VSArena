import { describe, expect, it, vi } from "vitest";
import { createMatchQueue } from "@/lib/eval/matchQueue";

describe("match queue", () => {
  it("serializes acquire/release and promotes the next waiter", async () => {
    const notes: string[] = [];
    const queue = createMatchQueue({
      notify: (_socket, payload) => {
        const message = (payload as { message?: string }).message ?? "";
        notes.push(message);
      },
      waitMs: 2000,
    });

    expect(await queue.acquire({} as never)).toBe(true);
    expect(queue.isBusy()).toBe(true);

    const second = queue.acquire({} as never);
    await vi.waitFor(() => expect(notes.some((n) => n.includes("position 1"))).toBe(true));

    const { promoted } = queue.release();
    expect(promoted).toBe(true);
    expect(await second).toBe(true);

    expect(queue.release().promoted).toBe(false);
    expect(queue.isBusy()).toBe(false);
  });

  it("rejects when the queue is full", async () => {
    const queue = createMatchQueue({
      notify: () => undefined,
      max: 1,
      waitMs: 5000,
    });
    expect(await queue.acquire({} as never)).toBe(true);
    const waiting = queue.acquire({} as never);
    await Promise.resolve();
    expect(await queue.acquire({} as never)).toBe(false);
    queue.release();
    await waiting;
  });
});
