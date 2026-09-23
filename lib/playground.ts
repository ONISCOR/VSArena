export type PlayTrick = "wave" | "nod" | "point" | "snap";
export type PlayCommand = "colorseek" | "ik" | "reset" | PlayTrick;

/**
 * Map a public playground prompt to a real in-tab demo or canned joint script.
 */
export function matchPlayCommand(prompt: string): PlayCommand | null {
  const text = prompt.toLowerCase().trim();
  if (!text) return null;
  if (/\b(reset|azzera|clear|stop|abort)\b/.test(text)) return "reset";
  if (/\b(ciao|hello|hi|hey|wave|saluta|saluto)\b/.test(text)) return "wave";
  if (/\b(nod|yes)\b/.test(text) || /annuis/.test(text) || /d['’]accordo/.test(text)) return "nod";
  if (/\b(punta|point|indica)\b/.test(text)) return "point";
  if (
    /\b(pinza|pinch|snap|clap|grip)\b/.test(text) ||
    /\b(apri|chiudi|open|close)\b/.test(text)
  ) {
    return "snap";
  }
  if (/\b(ik|baseline)\b/.test(text) || /geometr/.test(text)) return "ik";
  if (/(stack|impila|torre|tower|colorseek)/.test(text)) return "colorseek";
  return null;
}

export function isPlayTrick(cmd: PlayCommand): cmd is PlayTrick {
  return cmd === "wave" || cmd === "nod" || cmd === "point" || cmd === "snap";
}
