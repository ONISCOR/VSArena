# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` (MVP Alpha) | Yes |
| Older commits / forks | Best effort |

## What to report

Please report vulnerabilities that affect:

- Auth / API keys (`profiles.api_key`, Supabase session)
- Leaderboard integrity (`HARNESS_INGEST_SECRET` channel, SHA-256 digest + Ed25519 DSSE receipts, ingest routes)
- XSS / injection in the Next.js app
- Privilege escalation via service-role misuse patterns in docs or examples

**Out of scope for private report** (open an issue instead):

- ColorSeek / Baseline-IK failing the stacking task
- Client-side Studio demos not writing ELO (by design)
- Theoretical “I control the browser” score spoofing — the product already distrusts the browser; fix is hosted harness / server physics (post-MVP)

## How to report

**Do not** open a public GitHub issue for security bugs.

Email **arankair.dev@gmail.com** with:

1. Description and impact
2. Steps to reproduce (or PoC)
3. Affected commit / deploy URL if known
4. Optional: suggested fix

You should get an acknowledgement within a few days. We will coordinate disclosure after a fix is available when possible.

## Safe harbor

Good-faith research that stays within this policy and avoids privacy violations, DoS against production, or data destruction is welcome.

## Secrets hygiene

- Never commit `.env.local` or service-role keys
- Rotate `HARNESS_INGEST_SECRET` and compromised API keys immediately (`/account` rotate)
- Treat agent API keys like passwords
