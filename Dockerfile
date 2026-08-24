# OncoSuite -- clinical-trial assistant (web UI + JSON API)
# Small, dependency-light image: stdlib HTTP server + psycopg2 + langgraph.
FROM python:3.12-slim

# psycopg2-binary ships wheels, so no build toolchain needed. curl for healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# App code (respects .dockerignore -- venv, csv, caches excluded).
COPY . .

# Run as non-root.
RUN useradd -r -u 10001 oncosuite && chown -R oncosuite:oncosuite /app
USER oncosuite

# Served inside the container on 8014 (matches ONCOSUITE_PORT); the VM's Caddy
# proxies /chat-bot* on the public domain -> this port, same convention as its
# other services (/search/*, /analytics/*, etc.). ctsearch (the frontend) is a
# separate, non-Docker deploy (git pull + npm run build on the VM).
ENV ONCOSUITE_HOST=0.0.0.0 \
    ONCOSUITE_PORT=8014 \
    ONCOSUITE_BASE_PATH=/chat-bot
EXPOSE 8014

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8014/chat-bot/api/health || exit 1

CMD ["python", "web_app.py"]
