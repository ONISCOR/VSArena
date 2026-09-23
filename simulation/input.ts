import type { InputBuffer } from "./types";

/** Key → joint axis + sign. Bindings also documented in the HUD. */
export const KEY_BINDINGS: Record<string, { joint: "baseYaw" | "shoulderPitch" | "elbowPitch" | "wristPitch"; dir: number }> = {
  q: { joint: "baseYaw", dir: 1 },
  a: { joint: "baseYaw", dir: -1 },
  w: { joint: "shoulderPitch", dir: 1 },
  s: { joint: "shoulderPitch", dir: -1 },
  e: { joint: "elbowPitch", dir: 1 },
  d: { joint: "elbowPitch", dir: -1 },
  r: { joint: "wristPitch", dir: 1 },
  f: { joint: "wristPitch", dir: -1 },
};

export function createInputBuffer(): InputBuffer {
  return {
    held: {},
    gripperToggleQueued: false,
    resetQueued: false,
  };
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/**
 * Attach window keyboard listeners that mutate `buffer` in place.
 *
 * @returns disposer that removes the listeners
 */
export function attachKeyboard(buffer: InputBuffer): () => void {
  const onDown = (event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();

    if (key === " " || key === "escape") {
      event.preventDefault();
    }

    if (event.repeat) {
      if (KEY_BINDINGS[key]) event.preventDefault();
      return;
    }

    if (KEY_BINDINGS[key]) {
      event.preventDefault();
      buffer.held[key] = true;
      return;
    }

    if (key === " ") {
      buffer.gripperToggleQueued = true;
      return;
    }

    if (key === "escape") {
      buffer.resetQueued = true;
    }
  };

  const onUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (KEY_BINDINGS[key]) {
      buffer.held[key] = false;
    }
  };

  const onBlur = () => {
    buffer.held = {};
  };

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  };
}
