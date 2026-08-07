# OncoSuite UI -- Vite/React build served by nginx, which also reverse-proxies the
# API paths to the backend container so the browser sees a single origin (no CORS).
#
# IMPORTANT: build context is the REPO ROOT, not frontend/, because vite.config.js
# resolves `@ct` into ../vendor/ctsearch. Build with:
#   docker build -f frontend/Dockerfile -t deepak0105/oncosuite-ui:latest .

# ---------- build ----------
FROM node:22-slim AS build
WORKDIR /build

# Deps first for layer caching. package-lock.json is committed, so `npm ci`.
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# The vendored ctsearch sources are imported by the app via the `@ct` alias and
# must be present before `vite build`.
COPY vendor/ ./vendor/
COPY frontend/ ./frontend/

# Served under the /chat-bot path prefix (replacing the old backend-rendered page
# at that URL). VITE_BASE drives asset URLs + import.meta.env.BASE_URL (which
# src/api.js prefixes its fetches with); VITE_API_BASE_URL is the axios baseURL
# the vendored ctsearch client uses. Both must carry the same prefix.
# Override at build time for a root deployment: --build-arg VITE_BASE=/
ARG VITE_BASE=/chat-bot/

# MapTiler key for the map view (vendor/ctsearch MapView.jsx reads
# import.meta.env.VITE_MAPTILER_KEY). Vite inlines VITE_* at BUILD time, so this
# has to be passed here -- putting it in the VM's .env does nothing for the
# browser bundle, and without it the map requests `?key=undefined` and fails.
#   docker build --build-arg VITE_MAPTILER_KEY=<key> -f frontend/Dockerfile -t <tag> .
# Note: the key ships inside the public JS bundle (unavoidable for a client-side
# map), so restrict it by HTTP referrer in the MapTiler dashboard.
ARG VITE_MAPTILER_KEY=

ENV VITE_BASE=$VITE_BASE \
    VITE_API_BASE_URL=$VITE_BASE \
    VITE_MAPTILER_KEY=$VITE_MAPTILER_KEY

# Fail loudly rather than shipping a broken map.
RUN test -n "$VITE_MAPTILER_KEY" || { echo "ERROR: VITE_MAPTILER_KEY build-arg is required"; exit 1; }
RUN cd frontend && npm run build

# ---------- serve ----------
FROM nginx:1.27-alpine
COPY --from=build /build/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
# 8014 to match nginx.conf: this container answers as `oncosuite:8014`, keeping the
# VM's existing Caddy rule (`reverse_proxy oncosuite:8014`) working unchanged.
EXPOSE 8014

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8014/chat-bot/ >/dev/null || exit 1
