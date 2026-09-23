import { NextResponse } from "next/server";
import { getMatch } from "@/lib/matches/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const match = await getMatch(id);
  if (!match) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }
  return NextResponse.json({ match });
}
