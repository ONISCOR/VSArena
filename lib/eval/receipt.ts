/** Integrity (SHA-256 digest) and identity (Ed25519 over DSSE PAE). HMAC stays legacy-only. */

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject,
} from "node:crypto";
import {
  HMAC_ALG,
  resultsSigningSecret,
  stableStringify,
  verifyRunManifest,
  type RunManifest,
} from "@/lib/eval/manifest";

export const DIGEST_ALG = "sha256";
export const RECEIPT_ALG = "ed25519-dsse";
export const DSSE_PAYLOAD_TYPE = "application/vnd.vsarena.run-manifest+json";

export type ReceiptAlg = typeof RECEIPT_ALG | typeof HMAC_ALG;

export interface ManifestReceipt {
  digest: string;
  digest_alg: typeof DIGEST_ALG;
  signature: string;
  alg: typeof RECEIPT_ALG;
}

export interface EvalKeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
  privatePem: string;
  publicPem: string;
}

function manifestBytes(manifest: RunManifest): Buffer {
  return Buffer.from(stableStringify(manifest), "utf8");
}

function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

/**
 * DSSE pre-authentication encoding: DSSEv1 SP len(type) SP type SP len(payload) SP payload.
 *
 * @example dssePae("text/plain", Buffer.from("hi"))
 */
export function dssePae(payloadType: string, payload: Buffer): Buffer {
  const typeBuf = Buffer.from(payloadType, "utf8");
  return Buffer.concat([
    Buffer.from("DSSEv1 ", "utf8"),
    Buffer.from(String(typeBuf.length), "ascii"),
    Buffer.from(" ", "utf8"),
    typeBuf,
    Buffer.from(" ", "utf8"),
    Buffer.from(String(payload.length), "ascii"),
    Buffer.from(" ", "utf8"),
    payload,
  ]);
}

/**
 * Hex SHA-256 of the canonical manifest. No keys. Layer one.
 *
 * @example digestRunManifest(manifest)
 */
export function digestRunManifest(manifest: RunManifest): string {
  return createHash("sha256").update(manifestBytes(manifest)).digest("hex");
}

export function verifyDigest(manifest: RunManifest, digest: string): boolean {
  const got = (digest ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(got)) return false;
  const expected = digestRunManifest(manifest);
  if (got.length !== expected.length) return false;
  let mix = 0;
  for (let i = 0; i < got.length; i += 1) {
    mix |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mix === 0;
}

/**
 * Ed25519 signature of PAE(type, canonical JSON). Layer two. Base64.
 *
 * @example signManifestDsse(manifest, privateKey)
 */
export function signManifestDsse(manifest: RunManifest, privateKey: KeyObject): string {
  const pae = dssePae(DSSE_PAYLOAD_TYPE, manifestBytes(manifest));
  return cryptoSign(null, pae, privateKey).toString("base64");
}

export function verifyManifestDsse(manifest: RunManifest, signature: string, publicKey: KeyObject): boolean {
  const raw = (signature ?? "").trim();
  if (!raw) return false;
  let sig: Buffer;
  try {
    sig = Buffer.from(raw, "base64");
  } catch {
    return false;
  }
  if (sig.length !== 64) return false;
  const pae = dssePae(DSSE_PAYLOAD_TYPE, manifestBytes(manifest));
  try {
    return cryptoVerify(null, pae, publicKey, sig);
  } catch {
    return false;
  }
}

export function attachReceipt(manifest: RunManifest, privateKey: KeyObject): ManifestReceipt {
  return {
    digest: digestRunManifest(manifest),
    digest_alg: DIGEST_ALG,
    signature: signManifestDsse(manifest, privateKey),
    alg: RECEIPT_ALG,
  };
}

export function generateEvalKeyPair(): EvalKeyPair {
  const pair = generateKeyPairSync("ed25519");
  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    privatePem: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicPem: pair.publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
}

export function parseEd25519Private(pem: string): KeyObject | null {
  const normalized = normalizePem(pem);
  if (!normalized.includes("PRIVATE KEY")) return null;
  try {
    const key = createPrivateKey(normalized);
    return key.asymmetricKeyType === "ed25519" ? key : null;
  } catch {
    return null;
  }
}

export function parseEd25519Public(pem: string): KeyObject | null {
  const normalized = normalizePem(pem);
  if (!normalized.includes("PUBLIC KEY")) return null;
  try {
    const key = createPublicKey(normalized);
    return key.asymmetricKeyType === "ed25519" ? key : null;
  } catch {
    return null;
  }
}

export function exportPublicKeyPem(key: KeyObject): string {
  return key.export({ type: "spki", format: "pem" }).toString();
}

/**
 * Harness signing key. PKCS8 PEM; `\n` in the env value is fine.
 *
 * @example resultsEd25519Private()
 */
export function resultsEd25519Private(env: NodeJS.ProcessEnv = process.env): KeyObject | null {
  return parseEd25519Private(env.VSARENA_RESULTS_ED25519_PRIVATE ?? "");
}

/**
 * Published verify key. Dedicated PEM, or derived from the private key (local single-box).
 *
 * @example resultsEd25519Public()
 */
export function resultsEd25519Public(env: NodeJS.ProcessEnv = process.env): KeyObject | null {
  const fromPublic = parseEd25519Public(env.VSARENA_RESULTS_ED25519_PUBLIC ?? "");
  if (fromPublic) return fromPublic;
  const priv = resultsEd25519Private(env);
  if (!priv) return null;
  return createPublicKey(priv);
}

export function resultsEd25519PublicPem(env: NodeJS.ProcessEnv = process.env): string | null {
  const key = resultsEd25519Public(env);
  return key ? exportPublicKeyPem(key) : null;
}

export function asPublicKey(value: KeyObject | string | null | undefined): KeyObject | null {
  if (!value) return null;
  if (typeof value === "string") return parseEd25519Public(value);
  return value.asymmetricKeyType === "ed25519" ? value : null;
}

/**
 * Re-verify a stored eval blob on read. New rows: digest + Ed25519. Legacy: HMAC.
 *
 * @example verifyStoredReceipt(manifest, blob)
 */
export function verifyStoredReceipt(
  manifest: RunManifest,
  blob: { digest?: string; signature: string; alg?: string },
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (blob.alg === RECEIPT_ALG || (blob.digest && blob.alg !== HMAC_ALG)) {
    if (!blob.digest || !verifyDigest(manifest, blob.digest)) return false;
    const pub = resultsEd25519Public(env);
    if (!pub) return false;
    return verifyManifestDsse(manifest, blob.signature, pub);
  }
  const secret = resultsSigningSecret(env);
  if (secret.length < 16) return false;
  return verifyRunManifest(manifest, blob.signature, secret);
}
