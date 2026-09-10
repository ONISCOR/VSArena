import { NextResponse } from "next/server";
import { DIGEST_ALG, DSSE_PAYLOAD_TYPE, RECEIPT_ALG, resultsEd25519PublicPem } from "@/lib/eval/receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Published eval receipt key. Submitters verify a row offline against this PEM.
 */
export async function GET() {
  const public_key = resultsEd25519PublicPem();
  return NextResponse.json({
    digest_alg: DIGEST_ALG,
    signature_alg: RECEIPT_ALG,
    payload_type: DSSE_PAYLOAD_TYPE,
    public_key,
  });
}
