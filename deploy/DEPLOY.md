# Deploying OncoSuite on the shared VM

Target URL: **https://204.168.157.213.sslip.io/chat-bot**

The VM's reverse proxy is **Caddy** (shared with HRMS, ct_prod, thinkaiindia.com,
oncosuite.com and the UAT site), not nginx -- see `deploy/caddy-oncosuite-snippet.txt`
for the exact route to add.

Workflow: **backend is a Docker image (build here, push to Docker Hub, pull on
the VM). ctsearch (the frontend) is NOT a Docker image** -- it is deployed by
`git pull` + `npm run build` directly on the VM, with its static build served
however the VM already serves the UAT site's frontend (`root * /srv_uat` in
Caddy, per the existing site block).

- Served under **/chat-bot** on `204.168.157.213.sslip.io` (HTTPS). This was
  tested over plain HTTP at `204.168.157.213` earlier; now that ctsearch is
  integrated, the route moves to the HTTPS UAT host, same `/chat-bot` prefix.
- Reads the prod Postgres (204.168.157.213:5432 / `chatbot`) — already populated.

## Architecture

```
browser → Caddy (204.168.157.213.sslip.io, HTTPS)
            ├── /chat-bot*      → reverse_proxy oncosuite:8014   (this app, Docker)
            ├── /user/*, /search/*, /analytics/*, /site_intelligence/*, /hrms/*
            │                   → other services on the same VM (unchanged)
            └── (everything else) → static UAT frontend build (unchanged)
```

Key points:
- **Only Caddy publishes a host port.** The `oncosuite` container has no
  `ports:` — Caddy reaches it by container name (`oncosuite:8014`) over the
  external `app-network`, same convention as `ct_prod`, `list_endpoints`,
  `analytics_endpoints`, `test_analytics`, etc. on this VM.
- **Same origin, so no CORS** — the browser only ever talks to
  `204.168.157.213.sslip.io`; Caddy routes `/chat-bot*` internally.
- The `/chat-bot` prefix is passed through **unchanged** by Caddy
  (`handle /chat-bot* { reverse_proxy oncosuite:8014 }`, no path rewriting);
  the backend strips it itself (`ONCOSUITE_BASE_PATH=/chat-bot`).
- **Do not touch any other site block or route in the Caddyfile** — it is
  shared production infra for HRMS, ct_prod, oncosuite.com and thinkaiindia.com.
  Only the one `/chat-bot*` block needs adding to the
  `204.168.157.213.sslip.io` site (it already exists on the plain-HTTP site
  and on thinkaiindia.com — see `deploy/caddy-oncosuite-snippet.txt`).

---

## What lives where

**On your machine:** this repo (backend source + Docker). You build + push the
backend image here.

**On the VM:**
```
/opt/oncosuite/                        # backend: pulled image only, no source
├── docker-compose.yml                 # copied from this repo's root
├── .env                               # hand-placed: secrets (DB creds, DeepSeek key)
└── data/
    └── oncosuite_lung_cancer.csv      # hand-placed; optional (RAG index already on prod)

<ctsearch checkout>/                   # frontend: full git checkout, built in place
└── dist/                              # `npm run build` output
```

---

## A. Backend: build + push (on your machine)
```bash
cd <repo>/oncosuite
docker login
docker build -t deepak0105/oncosuite:latest .
docker push deepak0105/oncosuite:latest
```
The image is secrets-free (`.env`, CSV, `deploy/` are in `.dockerignore`).

## B. Backend: put the files on the VM
```bash
mkdir -p /opt/oncosuite/data && cd /opt/oncosuite
# copy docker-compose.yml here (scp from repo, or paste it)
nano .env            # ONCOSUITE_DSN (prod), DEEPSEEK_API_KEY (ROTATE!)
chmod 600 .env
# copy the CSV (only needed if you ever rebuild the index; the prod index is already built):
#   scp oncosuite_lung_cancer.csv  vm:/opt/oncosuite/data/
```

## C. Backend: tear down the OLD two-container setup first (one-time migration)
**Only needed the first time you deploy this new compose file** — skip on
later updates. The old setup ran TWO containers: `oncosuite-api` (the Python
app) and `oncosuite` (a React/nginx UI container that owned the name Caddy's
`reverse_proxy oncosuite:8014` targets). The new setup is a single backend
container that itself takes the name `oncosuite` — it will fail to start while
the old `oncosuite` UI container still holds that name.
```bash
cd /opt/oncosuite      # wherever the OLD docker-compose.yml lives
docker compose down    # stops + removes both old containers (oncosuite-api, oncosuite)
docker compose ps      # confirm both are gone
```
If the old containers were started with `docker run` rather than compose,
instead:
```bash
docker rm -f oncosuite oncosuite-api
```
This is a brief outage for `/chat-bot` on whichever site currently routes to
it (the plain-HTTP site / thinkaiindia.com) until step C below brings the new
container up — expected and fine for a planned migration.

## C. Backend: pull + run
```bash
cd /opt/oncosuite
# replace docker-compose.yml here with the NEW one from this repo (single
# `oncosuite` service, no `oncosuite-api` / `oncosuite-ui`)
docker login
docker compose pull
docker compose up -d
docker compose ps            # oncosuite should be healthy
```
Health check is internal only at this point (no host port published) — verify
it once Caddy is routing (step E) with:
```bash
curl -s https://204.168.157.213.sslip.io/chat-bot/api/health
```

## D. Frontend (ctsearch): deploy by git pull + npm run build
Entirely separate from the backend's Docker flow. On the VM, inside the
ctsearch checkout:
```bash
git pull
npm install               # only needed when dependencies changed
npm run build              # writes dist/, served the same way the UAT
                            # frontend is already served (root * /srv_uat)
```
`.env` in the ctsearch checkout must have:
```
VITE_API_BASE_URL=https://204.168.157.213.sslip.io
VITE_CHATBOT_API_BASE=https://204.168.157.213.sslip.io/chat-bot
VITE_MAPTILER_KEY=<real key>          # required, inlined at build time
```
Vite inlines `VITE_*` values at **build** time — changing `.env` requires
re-running `npm run build`; a running dev server or a stale `dist/` won't pick
it up.

## E. Caddy — add the /chat-bot route (does not touch anything else)
See `deploy/caddy-oncosuite-snippet.txt` for the exact block and where it goes
in the existing `204.168.157.213.sslip.io` site. Summary:
```caddyfile
handle /chat-bot* {
    reverse_proxy oncosuite:8014
}
```
Then:
```bash
caddy validate --config /path/to/Caddyfile
sudo systemctl reload caddy
curl -s https://204.168.157.213.sslip.io/chat-bot/api/health
```

## F. Embeddings / RAG — index ALREADY on prod
The prod `text_embeddings` table already holds all **1563 vectors** (copied from local,
built with **nomic-embed-text**, 768-dim). No rebuild needed. The VM only needs the
matching model so it can embed incoming QUESTIONS:
```bash
ollama pull nomic-embed-text     # ~274MB; MUST match the stored 768-dim vectors
```
Then set `OLLAMA_HOST` in `.env` to reach it (host.docker.internal:11434 if Ollama runs
on the VM host). Without Ollama, keyword + SQL + general-knowledge still work; only the
semantic/RAG path is disabled.

Do NOT use qwen3-embedding here — it is 1024-dim and would not match the stored vectors.
(`build_index.py` is ONLY for a from-scratch rebuild: `clear_csv_index()` then rebuild
with a single model, requires the CSV mounted at `/data`.)

---

## Updating later

**Backend changed:**
```bash
# your machine:
docker build -t deepak0105/oncosuite:latest .
docker push deepak0105/oncosuite:latest
# VM:
cd /opt/oncosuite && docker compose pull && docker compose up -d
```

**ctsearch changed:**
```bash
# VM, inside the ctsearch checkout:
git pull && npm install && npm run build
```
No Caddy reload needed for a ctsearch-only change — it serves the new build on
the next request.

## Stop / rollback (other Caddy sites untouched)
```bash
cd /opt/oncosuite && docker compose down
# to remove the route: delete the /chat-bot* block from the
# 204.168.157.213.sslip.io site in the Caddyfile, then:
caddy validate --config /path/to/Caddyfile && sudo systemctl reload caddy
```

## Database prerequisites (REQUIRED — the app crashes without these)
The search layer uses `similarity()` (fuzzy term matching) and `levenshtein()`, which
come from Postgres extensions. Install them ONCE per database (already done on the
current prod DB 2026-07):
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
```
Symptom if missing: `Error: function similarity(text, unknown) does not exist`.

## Notes / caveats
- The prod DB (204.168.157.213 / `chatbot`) is already populated: trial_info 1562,
  cohort_info 1877, arms_info 2682, endpoints 12173; vocab_terms + text_embeddings
  (1563 vectors) created/loaded; pg_trgm + fuzzystrmatch installed. Nothing to restore.
- `/chat-bot/api/ask` has NO auth yet. Before sharing publicly, add an API key check or
  a Caddy `basic_auth` on the `/chat-bot/api/` path (the site already does this
  for `/docs*`, `/openapi.json`, etc. — same pattern).
- ROTATE the DeepSeek key in the VM's `.env` — the repo ships a dev fallback key.
- The app is base-path aware (`ONCOSUITE_BASE_PATH=/chat-bot`); Caddy passes the
  full path through (no rewrite) and the app strips the prefix internally.
- ctsearch's API base URLs are baked in at `npm run build` time — changing the
  deployment path means rebuilding ctsearch, not just editing its `.env` on a
  running build.
- CORS support exists in `web_app.py` (`ONCOSUITE_CORS_ORIGINS`) but is unused
  in this same-origin Caddy setup — it's there only for local dev against a
  remote API on a different origin.
