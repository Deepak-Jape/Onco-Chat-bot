# """
# Backend-agnostic LLM client. One interface, two implementations (Ollama / Claude),
# chosen by config.LLM_BACKEND. Everything is stdlib-only for the Ollama path
# (urllib) so no extra installs are required; the Claude path uses the anthropic
# SDK if present.

# Design goals:
#   - NEVER crash the app if the model is unavailable. Every call returns either a
#     result or raises LLMUnavailable, which callers catch to fall back gracefully.
#   - chat(messages) -> str        for text-to-SQL and answer synthesis
#   - embed(texts) -> list[vector] for the semantic-search index
# """
# import json
# import urllib.request
# import urllib.error

# import config


# class LLMUnavailable(Exception):
#     """Raised when the configured backend can't be reached / isn't configured."""


# # --------------------------------------------------------------------------- #
# # Ollama (local, stdlib only)
# # --------------------------------------------------------------------------- #
# def _ollama_post(path, payload):
#     url = config.OLLAMA_HOST.rstrip("/") + path
#     data = json.dumps(payload).encode("utf-8")
#     req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
#     try:
#         with urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT_SECONDS) as r:
#             return json.loads(r.read().decode("utf-8"))
#     except urllib.error.URLError as e:
#         raise LLMUnavailable(f"Ollama not reachable at {config.OLLAMA_HOST}: {e}") from e
#     except Exception as e:
#         raise LLMUnavailable(f"Ollama error: {e}") from e


# def _ollama_chat(messages):
#     out = _ollama_post("/api/chat", {
#         "model": config.OLLAMA_CHAT_MODEL,
#         "messages": messages,
#         "stream": False,
#         "keep_alive": "30m",          # keep model resident so it doesn't cold-reload each call
#         "options": {"temperature": 0, "num_ctx": 4096},
#     })
#     return out.get("message", {}).get("content", "")


# def _ollama_embed(texts):
#     vecs = []
#     for t in texts:
#         out = _ollama_post("/api/embeddings", {
#             "model": config.OLLAMA_EMBED_MODEL,
#             "prompt": t,
#         })
#         vecs.append(out.get("embedding", []))
#     return vecs


# # --------------------------------------------------------------------------- #
# # Claude API (optional SDK)
# # --------------------------------------------------------------------------- #
# def _claude_chat(messages):
#     if not config.ANTHROPIC_API_KEY:
#         raise LLMUnavailable("ANTHROPIC_API_KEY not set")
#     try:
#         import anthropic
        
#     except ImportError as e:
#         raise LLMUnavailable("anthropic SDK not installed (pip install anthropic)") from e
#     client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
#     # split optional system message
#     system = ""
#     conv = []
#     for m in messages:
#         if m["role"] == "system":
#             system += m["content"] + "\n"
#         else:
#             conv.append({"role": m["role"], "content": m["content"]})
#     resp = client.messages.create(
#         model=config.CLAUDE_MODEL, max_tokens=1500,
#         system=system or None, messages=conv,
#     )
#     return "".join(block.text for block in resp.content if getattr(block, "type", "") == "text")


# def _claude_embed(texts):
#     # Anthropic has no first-party embedding endpoint; embeddings should use Ollama
#     # (nomic-embed-text) even when chat uses Claude. Fall back to that.
#     return _ollama_embed(texts)


# # --------------------------------------------------------------------------- #
# # Public interface
# # --------------------------------------------------------------------------- #
# def available() -> bool:
#     return config.LLM_BACKEND in ("ollama", "claude")


# def chat(messages) -> str:
#     """messages: [{"role": "system"|"user"|"assistant", "content": str}] -> reply text."""
#     if config.LLM_BACKEND == "ollama":
#         return _ollama_chat(messages)
#     if config.LLM_BACKEND == "claude":
#         return _claude_chat(messages)
#     raise LLMUnavailable("LLM backend is off")


# def embed(texts):
#     """texts: list[str] -> list[list[float]]."""
#     if config.LLM_BACKEND == "ollama":
#         return _ollama_embed(texts)
#     if config.LLM_BACKEND == "claude":
#         return _claude_embed(texts)
#     raise LLMUnavailable("LLM backend is off")


# def health():
#     """Quick reachability probe; returns (ok: bool, detail: str). Never raises."""
#     if config.LLM_BACKEND == "off":
#         return False, "LLM disabled"
#     try:
#         reply = chat([{"role": "user", "content": "reply with the single word: ok"}])
#         return True, f"{config.backend_summary()} -> {reply.strip()[:40]}"
#     except LLMUnavailable as e:
#         return False, str(e)
#     except Exception as e:  # noqa: BLE001
#         return False, f"unexpected: {e}"



"""
Backend-agnostic LLM client. One interface, two implementations (Ollama / Claude),
chosen by config.LLM_BACKEND. Everything is stdlib-only for the Ollama path
(urllib) so no extra installs are required; the Claude path uses the anthropic
SDK if present.

Design goals:
  - NEVER crash the app if the model is unavailable. Every call returns either a
    result or raises LLMUnavailable, which callers catch to fall back gracefully.
  - chat(messages) -> str        for text-to-SQL and answer synthesis
  - embed(texts) -> list[vector] for the semantic-search index
"""
import json
import urllib.request
import urllib.error

import config


class LLMUnavailable(Exception):
    """Raised when the configured backend can't be reached / isn't configured."""


# --------------------------------------------------------------------------- #
# Ollama (local, stdlib only)
# --------------------------------------------------------------------------- #
def _ollama_post(path, payload):
    url = config.OLLAMA_HOST.rstrip("/") + path
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT_SECONDS) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.URLError as e:
        raise LLMUnavailable(f"Ollama not reachable at {config.OLLAMA_HOST}: {e}") from e
    except Exception as e:
        raise LLMUnavailable(f"Ollama error: {e}") from e


def _ollama_chat(messages):
    out = _ollama_post("/api/chat", {
        "model": config.OLLAMA_CHAT_MODEL,
        "messages": messages,
        "stream": False,
        "keep_alive": "30m",          # keep model resident so it doesn't cold-reload each call
        "options": {"temperature": 0, "num_ctx": 4096},
    })
    return out.get("message", {}).get("content", "")


def _ollama_embed(texts):
    vecs = []
    for t in texts:
        out = _ollama_post("/api/embeddings", {
            "model": config.OLLAMA_EMBED_MODEL,
            "prompt": t,
        })
        vecs.append(out.get("embedding", []))
    return vecs


# --------------------------------------------------------------------------- #
# Claude API (optional SDK)
# --------------------------------------------------------------------------- #
def _claude_chat(messages):
    if not config.ANTHROPIC_API_KEY:
        raise LLMUnavailable("ANTHROPIC_API_KEY not set")
    try:
        import anthropic
        
    except ImportError as e:
        raise LLMUnavailable("anthropic SDK not installed (pip install anthropic)") from e
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    # split optional system message
    system = ""
    conv = []
    for m in messages:
        if m["role"] == "system":
            system += m["content"] + "\n"
        else:
            conv.append({"role": m["role"], "content": m["content"]})
    resp = client.messages.create(
        model=config.CLAUDE_MODEL, max_tokens=1500,
        system=system or None, messages=conv,
    )
    return "".join(block.text for block in resp.content if getattr(block, "type", "") == "text")


def _claude_embed(texts):
    # Anthropic has no first-party embedding endpoint; embeddings should use Ollama
    # (nomic-embed-text) even when chat uses Claude. Fall back to that.
    return _ollama_embed(texts)


# --------------------------------------------------------------------------- #
# DeepSeek API (OpenAI-compatible, stdlib only -- same pattern as Ollama above)
# --------------------------------------------------------------------------- #
def _deepseek_chat(messages):
    if not config.DEEPSEEK_API_KEY:
        raise LLMUnavailable("DEEPSEEK_API_KEY not set")
    url = config.DEEPSEEK_BASE_URL.rstrip("/") + "/chat/completions"
    payload = {
        "model": config.DEEPSEEK_MODEL,
        "messages": messages,   # DeepSeek uses the same {"role","content"} shape we already build
        "temperature": 0,
        "stream": False,
    }
    # NOTE: deliberately no max_tokens here. DEEPSEEK_MODEL can be a reasoning
    # model (deepseek-v4-flash emits reasoning_content before content), and the
    # cap applies to reasoning + content combined -- so a cap large enough to be
    # useful is still spent entirely on reasoning, returning finish_reason
    # "length" with an EMPTY content string. Measured: 2000 -> 0 chars,
    # 8000 -> 0 chars. Capping turns a slow answer into a silently blank one.
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.DEEPSEEK_API_KEY}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT_SECONDS) as r:
            out = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise LLMUnavailable(f"DeepSeek HTTP {e.code}: {body[:300]}") from e
    except urllib.error.URLError as e:
        raise LLMUnavailable(f"DeepSeek not reachable at {config.DEEPSEEK_BASE_URL}: {e}") from e
    try:
        choice = out["choices"][0]
        content = choice["message"]["content"]
    except (KeyError, IndexError) as e:
        raise LLMUnavailable(f"DeepSeek returned an unexpected response shape: {out}") from e

    # A reasoning model that spends its whole budget thinking returns
    # finish_reason "length" with empty content. Treat that as unavailable so
    # callers fall back to the deterministic renderer, instead of rendering a
    # blank answer as if the model had succeeded.
    if not (content or "").strip():
        reason = choice.get("finish_reason")
        raise LLMUnavailable(
            f"DeepSeek returned empty content (finish_reason={reason}); "
            "the model likely exhausted its budget on reasoning tokens"
        )
    return content


def _deepseek_embed(texts):
    # DeepSeek has no first-party embeddings endpoint -- same situation as Claude.
    # Fall back to Ollama's local embedding model for the vector-search layer.
    return _ollama_embed(texts)


# --------------------------------------------------------------------------- #
# Public interface
# --------------------------------------------------------------------------- #
def available() -> bool:
    return config.LLM_BACKEND in ("ollama", "claude", "deepseek")


def chat(messages) -> str:
    """messages: [{"role": "system"|"user"|"assistant", "content": str}] -> reply text."""
    if config.LLM_BACKEND == "ollama":
        return _ollama_chat(messages)
    if config.LLM_BACKEND == "claude":
        return _claude_chat(messages)
    if config.LLM_BACKEND == "deepseek":
        return _deepseek_chat(messages)
    raise LLMUnavailable("LLM backend is off")


def embed(texts):
    """texts: list[str] -> list[list[float]]."""
    if config.LLM_BACKEND == "ollama":
        return _ollama_embed(texts)
    if config.LLM_BACKEND == "claude":
        return _claude_embed(texts)
    if config.LLM_BACKEND == "deepseek":
        return _deepseek_embed(texts)
    raise LLMUnavailable("LLM backend is off")


def health():
    """Quick reachability probe; returns (ok: bool, detail: str). Never raises."""
    if config.LLM_BACKEND == "off":
        return False, "LLM disabled"
    try:
        reply = chat([{"role": "user", "content": "reply with the single word: ok"}])
        return True, f"{config.backend_summary()} -> {reply.strip()[:40]}"
    except LLMUnavailable as e:
        return False, str(e)
    except Exception as e:  # noqa: BLE001
        return False, f"unexpected: {e}"