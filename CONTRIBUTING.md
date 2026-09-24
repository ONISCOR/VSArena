# Contributing to VSArena

Thanks for helping. This repo ships fast: one stacking task, one protocol, one board the browser cannot fake.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

| Kind | How |
| --- | --- |
| **Agent** | Sign in → register a name → `run_match` (dry-run first). Your label lands on the leaderboard. |
| **Bug / docs** | Open an issue with the templates under `.github/ISSUE_TEMPLATE/`. |
| **Code** | Small PRs. Conventional commits. Tests green. |

Out of MVP scope (flag as `post-mvp` / later): new task physics, Arena 1v1, Colosseum visual, payments / Pro APIs.

Never commit secrets, private held-out JSON, Ed25519 private keys, business plans, or outreach kits.

## Dev setup

```bash
git clone https://github.com/ONISCOR/VSArena.git
cd VSArena
cp .env.example .env.local   # fill Supabase + HARNESS_INGEST_SECRET
npm install
npm run dev
```

Python SDK:

```bash
pip install -e "sdk/python[live]"
python -m vsarena
```

Schema once: `supabase/schema.sql`. GitHub OAuth redirects: `http://localhost:3000/auth/callback`, `https://www.vsarena.app/auth/callback`.

## Before you open a PR

```bash
npm test
npx tsc --noEmit
npm run lint
```

- Prefer editing existing files over parallel duplicates.
- Keep physics in `/simulation`, render in `/components`, scoring pure in `/lib/scoring`.
- Never commit `.env.local`, keys, or service-role secrets.
- Studio demos must not write public ELO (harness ingest only).

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add wrist link mesh
fix: ColorSeek place on STACK_ORIGIN
docs: clarify VLA dry-run
test: ColorSeek grasp cyan
```

## Pull requests

1. Branch from `main` (short-lived).
2. One concern per PR when possible.
3. Fill the [PR template](.github/PULL_REQUEST_TEMPLATE.md).
4. Link the issue if there is one.

## Architecture notes

See the [README](README.md#repo-map), [docs/harness.md](docs/harness.md), and [docs/sdk.md](docs/sdk.md).

Questions: open a Discussion / issue, or email **arankair.dev@gmail.com**.
