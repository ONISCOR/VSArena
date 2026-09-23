/** In-process FIFO match queue for the single-world harness. */

import type { WebSocket } from "ws";
import { harnessError } from "@/lib/eval/taxonomy";

export const MAX_MATCH_QUEUE = 8;
export const MATCH_QUEUE_WAIT_MS = 10 * 60 * 1000;

export type QueueNotify = (socket: WebSocket, payload: unknown) => void;

type Waiter = {
  socket: WebSocket;
  resolve: (acquired: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Serializes official matches: one active slot, FIFO waiters with position updates.
 */
export function createMatchQueue(options: { notify: QueueNotify; max?: number; waitMs?: number }) {
  const max = options.max ?? MAX_MATCH_QUEUE;
  const waitMs = options.waitMs ?? MATCH_QUEUE_WAIT_MS;
  const waiters: Waiter[] = [];
  let busy = false;

  function positionUpdate(): void {
    waiters.forEach((waiter, index) => {
      options.notify(
        waiter.socket,
        harnessError("harness.queued", `waiting — position ${index + 1}`, true),
      );
    });
  }

  function remove(waiter: Waiter): void {
    const index = waiters.indexOf(waiter);
    if (index >= 0) waiters.splice(index, 1);
    clearTimeout(waiter.timer);
  }

  async function acquire(socket: WebSocket): Promise<boolean> {
    if (!busy) {
      busy = true;
      return true;
    }
    if (waiters.length >= max) {
      options.notify(socket, harnessError("harness.busy", "match queue is full; retry shortly", true));
      return false;
    }
    return new Promise<boolean>((resolve) => {
      const waiter: Waiter = {
        socket,
        resolve,
        timer: setTimeout(() => {
          remove(waiter);
          options.notify(socket, harnessError("harness.busy", "queue wait timed out", true));
          resolve(false);
          positionUpdate();
        }, waitMs),
      };
      waiters.push(waiter);
      options.notify(
        socket,
        harnessError("harness.queued", `waiting — position ${waiters.length}`, true),
      );
    });
  }

  function release(): { promoted: boolean } {
    const next = waiters.shift();
    if (next) {
      clearTimeout(next.timer);
      busy = true;
      positionUpdate();
      next.resolve(true);
      return { promoted: true };
    }
    busy = false;
    return { promoted: false };
  }

  function isBusy(): boolean {
    return busy;
  }

  function depth(): number {
    return waiters.length;
  }

  return { acquire, release, isBusy, depth };
}

export type MatchQueue = ReturnType<typeof createMatchQueue>;
