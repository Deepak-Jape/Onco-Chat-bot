# Deploying OncoSuite on the shared VM

Target URL: **https://204.168.157.213.sslip.io/chat-bot**

Workflow: **build the image on your machine, push to Docker Hub, pull on the VM.**
The VM does NOT get the source code — only the pulled image plus three hand-placed
files. Runs alongside HRMS without touching it:
- HRMS keeps port **8000**; OncoSuite uses **8014** (VM localhost only, behind nginx).
- Served under the **/chat-bot** path via the VM's existing nginx.
- Reads the prod Postgres (204.168.157.213:5432 / `chatbot`) — already populated.

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
The image (`deepak0105/oncosuite:latest`) already contains all code + deps.

---

## A. Build + push (on your machine)
```bash
cd <repo>/oncosuite
docker login
docker build -t deepak0105/oncosuite:latest .
docker push deepak0105/oncosuite:latest
```
The image is secrets-free (`.env`, CSV, deploy/ are in `.dockerignore`).

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
`docker-compose.yml` already references `deepak0105/oncosuite:latest`.

## C. Pull + run
```bash
cd /opt/oncosuite
docker login
docker compose pull
docker compose up -d
docker compose ps
curl -s http://127.0.0.1:8014/chat-bot/api/health      # -> {"status":"ok",...}
```

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
# your machine:
docker build -t deepak0105/oncosuite:latest . && docker push deepak0105/oncosuite:latest
# VM:
cd /opt/oncosuite && docker compose pull && docker compose up -d
```

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
