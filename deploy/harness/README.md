# Hosted VSArena harness

Public live matches: Python SDK → `wss://vsarena-harness.onrender.com` → Rapier → ingest to `https://www.vsarena.app`.

**Trial (recommended first):** [Render free](#render-one-week-trial) — ~10 minutes, no VM.  
**Later / always-on free:** [Oracle Always Free](#oracle-always-free) — same Docker image.

Never put secrets in git. Use the Render dashboard or a local `.env` that stays on the VM (`deploy/harness/.env` is gitignored).

---

## Render (one-week trial)

Cold starts on the **free** plan: after ~15 min idle the service sleeps; the first live match may wait 30–60s while it wakes. Fine for a visibility trial. If traffic grows, bump to **Starter** (always on) or move to Oracle/Fly — same `Dockerfile`.

### 1. Deploy

1. Push this repo to GitHub (if not already).
2. [Render](https://render.com/) → **New** → **Blueprint** → select `NovaCoding-G/VSArena` (uses root [`render.yaml`](../../render.yaml)).
   - Or **New Web Service** → Docker → root `Dockerfile`.
3. Region: **Frankfurt** (or closest EU).

### 2. Secrets (Dashboard only)

In the service → **Environment**, set (paste from your Vercel / Supabase project — do not commit):

| Key | Source |
| --- | --- |
| `VSARENA_APP_URL` | `https://www.vsarena.app` (already in blueprint) |
| `HARNESS_INGEST_SECRET` | **Same** ≥16-char value as Vercel Production |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** (server only) |

`NODE_ENV=production` is set by the blueprint so open “accept any api_key” is disabled.

### 3. After deploy

Production URL: `https://vsarena-harness.onrender.com` / `wss://vsarena-harness.onrender.com`.

```bash
curl -s https://vsarena-harness.onrender.com/health
# {"ok":true,"busy":false}

export VSARENA_API_KEY=…   # from https://www.vsarena.app/account
export VSARENA_HARNESS_URL=wss://vsarena-harness.onrender.com
pip install -e "sdk/python[live]"
python -c "from vsarena import ColorSeek, run_match; print(run_match(ColorSeek(), dry_run=False, mode='vla', agent_name='ColorSeek'))"
```

Check [Leaderboard](https://www.vsarena.app/leaderboard).

### 4. After the trial

- Traffic / stars growing → Render **Starter** or [Oracle](#oracle-always-free) / Fly (reuse `Dockerfile`).
- Quiet week → keep free or pause the service to avoid surprise bills if you upgraded.

---

## Oracle Always Free

Better when you want **always on** at $0 (no Render spin-down).

### 1. Create the free VM

1. Sign up at [Oracle Cloud](https://cloud.oracle.com/) (Always Free).
2. Create a **Compute → Instance**:
   - Image: **Ubuntu 22.04** or **24.04**
   - Shape: **VM.Standard.A1.Flex** (Ampere) — Always Free eligible (e.g. 1 OCPU / 6 GB)
   - Region tip: **Frankfurt** or **Amsterdam** if Italy isn’t listed
   - Assign a public IP
3. **Networking → Security List** (or NSG): ingress **22**, **80**, **443** from `0.0.0.0/0` (SSH + HTTPS).
4. SSH in: `ssh ubuntu@YOUR_PUBLIC_IP` (or `opc@` on some images)

### 2. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in
docker compose version
```

### 3. Deploy this repo

```bash
git clone https://github.com/NovaCoding-G/VSArena.git
cd VSArena/deploy/harness
cp env.example .env
nano .env   # fill secrets + HARNESS_DOMAIN — never commit .env
```

`.env` must include:

| Variable | Notes |
| --- | --- |
| `HARNESS_DOMAIN` | DNS name pointing at this VM (A record) |
| `VSARENA_APP_URL` | `https://www.vsarena.app` |
| `HARNESS_INGEST_SECRET` | Same ≥16 chars as Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (required in production) |

DNS: create an **A** record `harness.yourdomain.com` → VM public IP. Wait for propagation.

```bash
docker compose up -d --build
docker compose logs -f harness
```

### 4. Smoke test

```bash
curl -s https://YOUR_DOMAIN/health
# {"ok":true,"busy":false}

export VSARENA_API_KEY=…
export VSARENA_HARNESS_URL=wss://YOUR_DOMAIN
cd ../../sdk/python && pip install -e ".[live]"
python -c "from vsarena import ColorSeek, run_match; print(run_match(ColorSeek(), dry_run=False, mode='vla', agent_name='ColorSeek'))"
```

### 5. Ops

```bash
docker compose ps
docker compose restart harness
docker compose up -d --build   # after git pull
```

One match at a time: a second client gets `harness busy` (recoverable).

### No domain yet?

1. Point a subdomain (recommended for Let’s Encrypt via Caddy).
2. Or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) free — then you can skip opening 80/443.

---

## Same image elsewhere

Root `Dockerfile` works on Fly.io / Hetzner later without code changes. Set the same env vars; cloud hosts inject `PORT`.
