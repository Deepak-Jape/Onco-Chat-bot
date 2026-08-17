
"""
Central config for the hybrid assistant. Flip LLM_BACKEND to switch between a
local Ollama model, the Claude API, or the DeepSeek API without touching any
other code.

    LLM_BACKEND = "ollama"    -> fully local, private, no API key (needs Ollama installed)
    LLM_BACKEND = "claude"    -> Claude API (best accuracy, needs ANTHROPIC_API_KEY)
    LLM_BACKEND = "deepseek"  -> DeepSeek API (OpenAI-compatible, needs DEEPSEEK_API_KEY)
    LLM_BACKEND = "off"       -> disable the LLM path entirely; app uses keyword fast-path only

Everything reads from here. Environment variables override the defaults so you
can change backend without editing the file:  set ONCOSUITE_LLM_BACKEND=deepseek
"""
import os

# "ollama" | "claude" | "deepseek" | "off"
# Default is "off": the app runs fast on the keyword fast-path and NEVER contacts
# an external model. Flip this once you've picked a backend and set its key/host.
LLM_BACKEND = os.environ.get("ONCOSUITE_LLM_BACKEND", "deepseek")

# ---- Ollama (local) ----
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
OLLAMA_CHAT_MODEL = os.environ.get("ONCOSUITE_OLLAMA_MODEL", "qwen2.5-coder:7b")
# Embedding model served by Ollama. Must MATCH the model that produced the vectors
# stored in text_embeddings -- dims differ per model (nomic-embed-text=768,
# qwen3-embedding=1024) and cosine across mismatched dims is meaningless.
# Current prod index was built with nomic-embed-text (768-dim), copied from local.
# To switch to qwen3-embedding later: clear_csv_index() then rebuild.
OLLAMA_EMBED_MODEL = os.environ.get("ONCOSUITE_OLLAMA_EMBED", "nomic-embed-text")

# ---- Claude API ----
CLAUDE_MODEL = os.environ.get("ONCOSUITE_CLAUDE_MODEL", "claude-sonnet-5")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# ---- DeepSeek API ----
# OpenAI-compatible REST endpoint: POST {base}/chat/completions, Bearer auth.
# Current (2026) model names are deepseek-v4-flash (fast/cheap) and
# deepseek-v4-pro (top reasoning/agentic). The older deepseek-chat /
# deepseek-reasoner aliases are being retired July 24, 2026 -- don't rely on them.
# No first-party embeddings endpoint, so embed() falls back to Ollama, same as Claude.
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

# ---- behaviour ----
SQL_ROW_LIMIT = 200            # hard cap appended to generated SQL
# LLM call timeout. Local Ollama CPU models genuinely need minutes, but the hosted
# APIs (DeepSeek/Claude) respond in seconds -- a 300s timeout there just means a
# single network blip hangs the whole request (and the UI spins) for 5 minutes.
# So: generous for ollama, tight for the API backends. Override with ONCOSUITE_LLM_TIMEOUT.
LLM_TIMEOUT_SECONDS = int(os.environ.get(
    "ONCOSUITE_LLM_TIMEOUT",
    "300" if LLM_BACKEND == "ollama" else "60"))
MAX_HISTORY_TURNS = 12         # conversation turns kept as context
VECTOR_TOP_K = 5               # semantic-search fallback results


# ---------------------------------------------------------------------------
# SHARED ANSWER-FORMATTING CONTRACT
# Every answer-producing path (LLM-written SQL, semantic/RAG summary, general
# knowledge, and the strong-model synthesis for the structured tools) appends
# this block to its prompt so answers look CONSISTENT no matter which path the
# router chose. The rules only use the markdown subset render_markdown_lite()
# understands: **bold headers**, pipe tables, "- " bullets, **inline bold**,
# _italic notes_. Keep this the single source of truth -- edit here, not per-path.
# ---------------------------------------------------------------------------
ANSWER_FORMAT_CONTRACT = """
Write a POLISHED, EXECUTIVE-STYLE answer for a pharma/clinical audience. It must read like a
finished report section, NOT an internal scratchpad. Do NOT open with "How I got this",
"I searched", "The tool returned", or any description of your own process.

STRUCTURE (scale UP for broad analytical/landscape questions, DOWN for simple ones):

- Start with a concise **bold title line** naming the topic. No preamble before it.

- **Executive Summary** (2-3 tight paragraphs): the headline answer and the key pattern that
  informs a decision. If the database cannot supply a requested statistic (e.g. US incidence),
  say so explicitly here in one sentence and pivot to what the data CAN show.

- Then the substantive sections, DATA FIRST in each:
  1. A segment / landscape table when the question spans categories (e.g. EGFR NSCLC by
     line-of-therapy + stage). Rich multi-column table. When inclusion criteria apply
     ("active", "corporate-sponsored"), add an "Included in Analysis?" column with per-row
     reasons ("No (Academic)", "No (Not Active)").
  2. One or more **trial tables** listing the actual trials, columns like: Trial | Sponsor |
     Phase | Status | Enrollment | Role/Notes. Group by segment with bold sub-headers when
     helpful. Never list comparable trials as prose.
  3. A short qualitative interpretation ("What this says ...") -- a few "- " bullets on the
     pattern (where industry is investing, where it's thin), decision-relevant.

- End with a **References** list of the NCT ids cited, and a brief "Want to go deeper?" offer
  of 2-4 concrete follow-up analyses.

PROVENANCE (critical -- the answer must be rich AND trustworthy):
- Facts that come FROM THE DATABASE (trials in the provided context, their sponsors, phases,
  statuses, counts) are the verified backbone -- present them as fact.
- When you add well-established oncology context that is NOT in the provided data (real-world
  incidence figures, widely-known trials or segments not present in the context, market
  dynamics), you MAY include it because it makes the answer more useful -- but clearly mark it,
  e.g. a section note "_Industry context below is general oncology knowledge, not from this
  dataset._" or an inline "(general knowledge)". NEVER blur the two: a reader must be able to
  tell which trial rows are verified from the dataset and which are added context.
- Do NOT invent database counts or attribute made-up trials to the dataset.

- Keep interpretation tight and decision-focused. No filler, no marketing language, no emoji.

HARD RULES:
- Lead each section with its TABLE/figures, not with explanation. If you catch yourself
  explaining before showing the table, move the table up.
- Emphasize key figures and trial ids with **bold**.
- If the data cannot answer the question, say so plainly and precisely (what is missing), then
  give the labeled general-knowledge baseline if one exists -- do NOT pad with an unrelated table.
- For a simple one-fact question, skip the title/sections -- a single clean sentence is enough.
- Only use markdown: **bold**, pipe tables, "- " bullets, and _italic_ for a caveat note.

GUARDRAILS (never violate):
- NEVER expose internal machinery in the answer: no routing labels (intent, tool, response_mode,
  path, escalate), no similarity/cosine scores (e.g. "0.721"), no raw internal ids, no
  session/backend/debug fields. Write for the end user only. Trial identifiers (NCT numbers)
  ARE fine to show as references; internal oncosuite ids and scores are NOT.
- HONOR user exclusions strictly. If the user says "not interested in academia" (or excludes
  universities/hospitals/institutes/government), do NOT mention or include those sponsors'
  trials in the answer; treat the provided data as already filtered and state that academic/
  non-industry sponsors were excluded per the request.
- MISSING-DATA FALLBACK: if the database context lacks the requested statistic (e.g. US cancer
  incidence, population figures), (1) state plainly and specifically what data is missing, then
  (2) if you can give a well-established published baseline estimate from general medical
  knowledge, offer it EXPLICITLY labelled as a general-knowledge estimate (not from this
  database), and (3) offer to refine the query to what the database can answer. Never fabricate
  database figures to fill the gap.
""".strip()


def backend_summary() -> str:
    if LLM_BACKEND == "ollama":
        return f"Ollama @ {OLLAMA_HOST} (chat={OLLAMA_CHAT_MODEL}, embed={OLLAMA_EMBED_MODEL})"
    if LLM_BACKEND == "claude":
        keyed = "key set" if ANTHROPIC_API_KEY else "NO KEY"
        return f"Claude API (model={CLAUDE_MODEL}, {keyed})"
    if LLM_BACKEND == "deepseek":
        keyed = "key set" if DEEPSEEK_API_KEY else "NO KEY"
        return f"DeepSeek API (model={DEEPSEEK_MODEL}, {keyed})"
    return "LLM disabled (keyword fast-path only)"
