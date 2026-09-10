import { NextResponse } from "next/server";
import { resultsEd25519Public } from "@/lib/eval/receipt";
import { requestHasIngestSecret } from "@/lib/matches/ingestAuth";
import { parseOfficialIngest } from "@/lib/matches/ingestPayload";
import { listMatches, recordMatch } from "@/lib/matches/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ matches: await listMatches() });
}

/**
 * Official leaderboard write. Harness-only. Body must carry digest + Ed25519 DSSE.
 *
 * @example POST /api/matches  header x-vsarena-ingest
 */
export async function POST(request: Request) {
  if (!requestHasIngestSecret(request)) {
    return NextResponse.json(
      { error: "leaderboard writes are harness-only (missing x-vsarena-ingest)" },
      { status: 403 },
    );
  }
  try {
    const parsed = parseOfficialIngest(await request.json(), { publicKey: resultsEd25519Public() });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const stored = await recordMatch(parsed.entry);
    return NextResponse.json(stored, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
}
