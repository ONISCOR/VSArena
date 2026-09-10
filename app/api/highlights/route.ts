import { NextResponse } from "next/server";
import { parseHighlightRun } from "@/lib/eval/highlights";
import { listPublicHighlights, recordHighlight } from "@/lib/eval/highlightStore";
import { requestHasIngestSecret } from "@/lib/matches/ingestAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Previous-week highlight reel. Current eval window is never returned.
 */
export async function GET() {
  const feed = await listPublicHighlights();
  return NextResponse.json(feed);
}

/**
 * Harness-only: store a scored run for next week's reel.
 */
export async function POST(request: Request) {
  if (!requestHasIngestSecret(request)) {
    return NextResponse.json({ error: "highlight writes are harness-only" }, { status: 403 });
  }
  try {
    const run = parseHighlightRun(await request.json());
    if (!run) {
      return NextResponse.json({ error: "invalid highlight payload" }, { status: 400 });
    }
    await recordHighlight(run);
    return NextResponse.json({ ok: true, match_id: run.match_id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
}
