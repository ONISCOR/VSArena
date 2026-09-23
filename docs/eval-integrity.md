# Evaluation integrity (V1)

What a public stacking ELO must disclose, vs what VSArena actually ships. Written against the usual “sim eval” shopping list (simulator provenance, reset, schemas, latency, hidden scenes, replay, failure taxonomy, negative controls, held-out sets, **pinned sampler seed**, **benign control arm**, **signed run manifest**).

Studio (`/simulation`) is still the **public canonical** layout. Official ELO is the hosted harness (`NODE_ENV=production` → `held_out`).

| Item | Status | What we do |
| --- | --- | --- |
| Simulator / version provenance | **Have** | Every official `result` stamps `provenance`: product `1.0.0`, Rapier `0.20.0`, physics 60 Hz, git SHA (Render/Vercel/`GIT_COMMIT`), Node, observation mode, latency budget, policy Hz, **sampler_seed**, scene id/seed/hash/arm. `GET /health` exposes the same eval block. |
| Fixed sampler seed per submission | **Have** | Seed is `hash("eval:" + ISO-week)`, **shared by every agent** that week. Not derived from the agent name (the name is choosable). Shown as the week id on the leaderboard row. |
| Live spectator | **Have** | `/spectate` streams the **control** arm (public table) of a live official match. The current held-out scored layout is **not** streamed. When idle, Studio live loops the **previous week's** best scored runs (`GET /api/highlights`). Run `supabase/highlights.sql` so the reel survives restarts. |
| Benign control arm | **Have** | Production runs a public-canonical episode (no held-out, no jitter) **before** the scored episode, same policy, same socket. The row reports control fail rate → scored fail rate. Local/dev (`public` set) copies scored into a `degenerate` control slot so we do not double the match. |
| Signed run manifest | **Have** | Two layers. **Integrity:** SHA-256 digest of the canonical manifest (stdlib, no key) — ingest rejects a mismatch. **Identity:** Ed25519 over DSSE PAE, verified against a **published** public key (`GET /api/eval/keys`, harness `/health`). HMAC-SHA256 is legacy-only (old rows). The ingest secret authenticates the *channel*, not the receipt. |
| Agent ownership | **Have** | Official `hello.agent` must already exist on `/account` and be owned by the profile behind `api_key`. Ingest body carries `owner_id`; Postgres rejects mismatches and never auto-creates agents under the house user for stranger names. |
| VLA-only public ELO | **Have** | `mode=state` may run for debug; harness skips ingest and `/api/matches` rejects non-VLA provenance. |
| Binary ELO outcome | **Have** | Full stack = 1, otherwise 0. Partial towers do not move rating. |
| Held-out private scenes | **Have (prod)** | Production `held_out` requires `VSARENA_HELD_OUT_JSON` (or explicit `VSARENA_ALLOW_INREPO_HELD_OUT=1` for staging). In-repo layouts remain for local/dev. |
| Match queue | **Have** | Single Rapier world; FIFO queue (≤8) with `harness.queued` position updates instead of instant busy reject. |
| Protocol aborts | **Have** | `protocol.*` failures (invalid action, etc.) do **not** ingest ELO — only `policy.*`. |
| Reset determinism | **Have** | Same sampler seed → same spawn hash. `ArenaSimulation.create({ spawns })` rebuilds from that layout. We do **not** claim bit-identical Rapier across OS/CPU after N steps. |
| Observation / action schemas | **Have** | VLA: RGB + instruction, **no cube poses**. State: privileged poses (debug). Actions are checked with `parseActionContract` before they touch Rapier. Invalid actions do not move the arm. |
| Latency budget | **Have** | VLA 2 s / 5 Hz (8 consecutive late actions → `policy.timeout`). State 150 ms / 20 Hz (20 strikes). Late ticks still hold the last valid action until the budget trips. |
| Hidden-scene construction | **Partial** | Production harness samples 8 in-repo held-out XY layouts + jitter from the **sampler seed**. **Those coordinates are in git** (this repo is open source). They are not the Studio layout, so a policy that only memorizes the screenshot of `/simulation` should not auto-win ELO. |
| Replay artifacts | **Have (V1)** | `result.replay` is `vsarena-replay-v1`: sparse privileged poses (no RGB). Persisted in `joint_torque_telemetry.eval.replay` for `/runs/[id]`. Replay is **not** part of the signed digest. |
| Task / schema versions | **Have (V1)** | Provenance stamps `task_id`, `task_version` (`block_stacking.v1`), `observation_schema_version`, `action_schema_version`, plus optional `started_at_ms` / `ended_at_ms` / `duration_ms` for the scored episode. |
| Run details UI | **Have (V1)** | `/runs/[id]` and `GET /api/matches/[id]` expose score, termination, counters, provenance, and the pose player. |
| Failure taxonomy | **Have** | `failure.code` is dotted: `policy.*` / `protocol.*` / `harness.*`. Wire `error` messages are `code: human text`. Disconnect mid-match is `harness.disconnect` and **does not** ingest ELO. |
| Negative controls (action contract) | **Have** | Fixtures in `lib/eval/actionSchema.ts` and `sdk/python` (`parse_action_contract`). Empty motion, NaN joints, unknown joints, huge `ee_delta`. This is not the benign control arm. |
| Held-out private scenes (ELO ≠ git memorization) | **Partial** | Operators set `VSARENA_HELD_OUT_JSON` (three `{id, position}` cubes) on the harness host. That override is **not** in this repository. Without it, a determined reader can still memorize `lib/eval/scenes.ts`. |

## Honest limits

- ColorSeek / Baseline-IK in the browser still use the public layout and **do not** write ELO.
- In-repo `held_out` is a *different public set*, not a secret set.
- Replay is a sparse pose trail (joints/cubes), not RGB video. Run comparison and action streams are post-V1.
- Horizon-end incomplete matches stay `status: completed` for telemetry, but **ELO uses a binary stack outcome** (full tower only). Timeout-budget and invalid-action-budget aborts are `failed`.
- Official production submits take ~2× wall time (control episode + scored episode). The policy is not reset between arms; control runs first so the official score is the fresh rollout.
- Studio live of a current official match is the **control** table only. Best-of-week scored poses appear only after that ISO week rotates. In local `public` scene sets, a scored arm may stream with spectate `kind=scored` (never mislabelled as control).
- Production match store **fails closed** if Postgres is down (no silent RAM leaderboard).
- The first week after deploy has an empty reel until one window closes.
- HMAC is not the public receipt. New rows carry a SHA-256 digest (anyone can recompute) plus an Ed25519 DSSE signature (anyone can verify with the published key). The ingest secret still gates who may POST; it cannot forge a valid Ed25519 receipt without the private key. Legacy HMAC rows stay visible and re-verify with `VSARENA_RESULTS_SIGNING_KEY` / the ingest secret.
- Legacy unsigned rows (pre-0.6) stay visible and are labelled unsigned.

## Operator env

| Variable | Default | Meaning |
| --- | --- | --- |
| `VSARENA_SCENE_SET` | `held_out` when `NODE_ENV=production`, else `public` | Force `public` or `held_out` |
| `VSARENA_HELD_OUT_JSON` | unset | Private three-cube JSON; sets `provenance.scene.private_override`. **Required in production** for held_out unless `VSARENA_ALLOW_INREPO_HELD_OUT=1`. |
| `VSARENA_ALLOW_INREPO_HELD_OUT` | unset | `1` allows git layouts in production (staging/tests only). |
| `VSARENA_SKIP_CONTROL` | unset | `1` skips the live control episode (local debug). Production should leave this unset. |
| `HARNESS_INGEST_SECRET` | unset | ≥16 chars. Header `x-vsarena-ingest` (channel auth). Not the public receipt. |
| `VSARENA_RESULTS_ED25519_PRIVATE` | unset | PKCS8 PEM (quoted `\n`, concatenated one-liner, or raw PKCS8 base64). Harness signs DSSE. |
| `VSARENA_RESULTS_ED25519_PUBLIC` | derived from private | SPKI PEM published on `/api/eval/keys` and harness `/health`. Same formats. On Vercel paste a real multiline PEM, then Redeploy. |
| `VSARENA_RESULTS_SIGNING_KEY` | ingest secret | Legacy HMAC key for pre-Ed25519 rows only. |
| (apply) `supabase/agents-name-ci.sql` | — | Unique index on `lower(name)`. |
| `RENDER_GIT_COMMIT` / `VERCEL_GIT_COMMIT_SHA` / `GIT_COMMIT` | `unknown` | SHA stamped on results |

## Wire extras on `result`

```json
{
  "failure": {
    "code": "policy.task_incomplete",
    "domain": "policy",
    "message": "policy.task_incomplete: horizon reached without a full stack",
    "recoverable": false
  },
  "provenance": {
    "product": "1.0.0",
    "rapier": "0.20.0",
    "physics_hz": 60,
    "git_sha": "…",
    "sampler_seed": 123456789,
    "eval_window": "2026-W37",
    "scene": { "set": "held_out", "id": "held_out.layout-3", "seed": 123456789, "hash": "…", "private_override": false, "arm": "scored" }
  },
  "control": {
    "arm": "control",
    "status": "completed",
    "task_completion_score": 0,
    "spatial_accuracy": 0.4,
    "degenerate": false,
    "scene": { "set": "public", "id": "public.canonical", "seed": 0, "hash": "…" }
  },
  "digest": "hex sha256",
  "signature": "base64 ed25519-dsse"
}
```

Ingest stores `{ peak, avg, eval: { failure, provenance, sampler_seed, control, digest, signature, alg } }` inside existing `joint_torque_telemetry` jsonb (no migration).
