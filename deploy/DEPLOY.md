# Deploying OncoSuite on the shared VM

Target URL: **https://204.168.157.213.sslip.io/chat-bot**

Workflow: **build the images on your machine, push to Docker Hub, pull on the VM.**
The VM does NOT get the source code — only the pulled images plus three hand-placed
files. Runs alongside HRMS without touching it:
- HRMS keeps port **8000**; OncoSuite uses **8014** (VM localhost only, behind nginx).
- Served under the **/chat-bot** path via the VM's existing nginx.
- Reads the prod Postgres (204.168.157.213:5432 / `chatbot`) — already populated.

## Architecture (changed — there are now TWO containers)

```
browser → VM nginx (:80/:443, /chat-bot)
            → 127.0.0.1:8014  = oncosuite-ui   (nginx: serves the React build)
                 ├── /chat-bot/*                     → static SPA files
                 └── /chat-bot/{ask,api,search}/*     → proxied over the internal
                                                        docker network to ↓
                                oncosuite      (python web_app.py, :8014)
```

Key points:
- **Only the UI publishes a host port.** The backend has no `ports:` — it is reachable
  only from the UI container, so the API is not exposed directly to the internet.
- **Same origin, so no CORS** anywhere: the browser only ever talks to the UI's nginx.
- The `/chat-bot` prefix is passed through **unchanged** at every hop; the backend
  strips it itself (`ONCOSUITE_BASE_PATH=/chat-bot`).
- This **replaces** the old backend-rendered page that used to serve `/chat-bot`.
  The Python app still serves that page, but nginx now only routes API paths to it.

---

## What lives where

**On your machine (source + Docker):** the repo. You build + push here.

**On the VM — ONE folder (e.g. `/opt/oncosuite/`), just these files (NO source code):**
```
/opt/oncosuite/
├── docker-compose.yml                 # copied from the repo's deploy/ (or repo root)
├── .env                               # hand-placed: secrets (DB creds, DeepSeek key)
└── data/
    └── oncosuite_lung_cancer.csv      # hand-placed; optional (RAG index already on prod)
```
The images (`deepak0105/oncosuite:latest`, `deepak0105/oncosuite-ui:latest`) already
contain all code + deps.

---

## A. Build + push (on your machine)
```bash
cd <repo>/oncosuite
docker login

# backend (Python API)
docker build -t deepak0105/oncosuite:latest .

# UI (React build served by nginx)
# NOTE 1: build context is the REPO ROOT, not frontend/ — vite.config.js resolves
#         `@ct` into ../vendor/ctsearch, which must be inside the context.
# NOTE 2: VITE_MAPTILER_KEY is REQUIRED (the build fails without it). Vite inlines
#         VITE_* at BUILD time, so a key in the VM's .env does NOT reach the
#         browser bundle — the map would request `?key=undefined` and stay blank.
docker build --build-arg VITE_MAPTILER_KEY="$(sed -n 's/^VITE_MAPTILER_KEY=//p' .env | tr -d '\r\n')" \
  -f frontend/Dockerfile -t deepak0105/oncosuite-ui:latest .

docker push deepak0105/oncosuite:latest
docker push deepak0105/oncosuite-ui:latest
```
Both images are secrets-free (`.env`, CSV, deploy/ are in `.dockerignore`).

**Submodule:** the UI build needs `vendor/ctsearch` populated. On a fresh clone run
`git submodule update --init --recursive` first, or the build fails on missing `@ct/*`.

The UI is baked to the `/chat-bot` prefix at build time (`ARG VITE_BASE=/chat-bot/`).
To serve it at the domain root instead, rebuild with `--build-arg VITE_BASE=/` and
set `ONCOSUITE_BASE_PATH: ""` in `docker-compose.yml`.

## B. Put the 3 files on the VM
```bash
mkdir -p /opt/oncosuite/data && cd /opt/oncosuite
# copy docker-compose.yml here (scp from repo, or paste it)
# create .env here with the real values (see the repo's .env as the template):
nano .env            # ONCOSUITE_DSN (prod), DEEPSEEK_API_KEY (ROTATE!), ports, base path
chmod 600 .env
# copy the CSV (only needed if you ever rebuild the index; the prod index is already built):
#   scp oncosuite_lung_cancer.csv  vm:/opt/oncosuite/data/
```
`docker-compose.yml` already references both images.

## C. Pull + run
```bash
cd /opt/oncosuite
docker login
docker compose pull
docker compose up -d
docker compose ps            # both `oncosuite` and `oncosuite-ui` should be healthy

# API reaches the backend through the UI container:
curl -s http://127.0.0.1:8014/chat-bot/api/health      # -> {"status":"ok",...}
# SPA is served:
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8014/chat-bot/   # -> 200
```
If `oncosuite-ui` fails to bind :8014, the OLD single-container deploy is probably
still up. Remove it first: `docker rm -f oncosuite` (or `docker compose down` in the
old directory), then `docker compose up -d` again.

## D. Embeddings / RAG — index ALREADY on prod
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

## E. nginx — add the /chat-bot location (does not touch HRMS)
Add the two `location` blocks from `deploy/nginx-oncosuite.conf` into the existing
`204.168.157.213.sslip.io` server block, OR install the file standalone:
```bash
sudo cp nginx-oncosuite.conf /etc/nginx/sites-available/oncosuite   # if copied to the VM
sudo ln -s /etc/nginx/sites-available/oncosuite /etc/nginx/sites-enabled/oncosuite
sudo nginx -t          # MUST pass; if it errors, do NOT reload (HRMS stays up)
sudo systemctl reload nginx
```

## F. HTTPS
```bash
sudo certbot --nginx -d 204.168.157.213.sslip.io
curl -s https://204.168.157.213.sslip.io/chat-bot/api/health
# browser: https://204.168.157.213.sslip.io/chat-bot
```

---

## Updating later
```bash
# your machine (rebuild whichever changed; UI build context is the repo root):
docker build -t deepak0105/oncosuite:latest .
docker build -f frontend/Dockerfile -t deepak0105/oncosuite-ui:latest .
docker push deepak0105/oncosuite:latest
docker push deepak0105/oncosuite-ui:latest
# VM:
cd /opt/oncosuite && docker compose pull && docker compose up -d
```
Browsers cache aggressively: the UI's nginx sends `no-store` for index.html and
immutable long-lived caching only for hashed `/assets/*`, so a redeploy is picked up
on the next load without a hard refresh.

## Stop / rollback (HRMS untouched)
```bash
cd /opt/oncosuite && docker compose down
sudo rm /etc/nginx/sites-enabled/oncosuite && sudo nginx -t && sudo systemctl reload nginx
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
  an nginx `allow/deny` / `auth_basic` on the `/chat-bot/api/` location.
- ROTATE the DeepSeek key in the VM's `.env` — the repo ships a dev fallback key.
- The app is base-path aware (`ONCOSUITE_BASE_PATH=/chat-bot`); nginx passes the full
  path through (no rewrite) and the app strips the prefix internally.
- The React UI's API prefix comes from Vite's `base` (`import.meta.env.BASE_URL`, see
  `frontend/src/api.js`), so the prefix is set in ONE place: `VITE_BASE` at build time.
  Changing the deployment path means rebuilding the UI image — it is baked in, not
  runtime-configurable.
- `vendor/ctsearch` never committed `src/assets/Container_margin.svg`, which broke
  `vite build` (the dev server resolves assets lazily, so it only failed in Docker).
  A local copy now lives at `frontend/src/assets/Container_margin.svg`. If the
  submodule later adds the real asset, the imports can point back at `@ct/`.
