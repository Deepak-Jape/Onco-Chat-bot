"""Chart selection: given a question, decide which charts belong in the answer.

The split that matters: this module picks WHICH charts to show, chart_data.py
decides WHAT the numbers are. The model never returns data -- only names -- so a
hallucinated value cannot reach a chart. Names outside the enabled set are
discarded, and gated charts (KMCurve today) are never offered in the first
place, so the model cannot select one.
"""

import json
import re

from chart_data import build_chart, enabled_specs

_PROMPT = """You choose which visualisations belong with an answer to a clinical-trial question.

Available charts:
{catalog}

Question: {question}

Reply with ONLY a JSON array of chart names to show, most useful first, e.g.
["SiteMap"]. Choose at most 2. Choose only charts whose "use when" genuinely
matches the question. If none fit, reply []. Do not invent names.
"""


def _catalog(specs: dict) -> str:
    return "\n".join(
        f'- {name}: use when {spec["use_when"]}' for name, spec in specs.items()
    )


def _parse_names(raw: str, allowed: set) -> list:
    """Pull a name list out of the model's reply, tolerating prose or fences."""
    if not raw:
        return []
    m = re.search(r"\[.*?\]", raw, re.S)
    names = []
    if m:
        try:
            parsed = json.loads(m.group(0))
            if isinstance(parsed, list):
                names = [str(x) for x in parsed]
        except (ValueError, TypeError):
            names = []
    if not names:
        # Fall back to scanning for bare chart names.
        names = [n for n in allowed if n in raw]
    # Preserve order, drop unknowns and duplicates.
    seen, out = set(), []
    for n in names:
        if n in allowed and n not in seen:
            seen.add(n)
            out.append(n)
    return out


def select_charts(question: str, max_charts: int = 2) -> list:
    """Chart names the model wants for this question (may be empty)."""
    specs = enabled_specs()
    if not specs:
        return []
    try:
        import llm_client

        if not llm_client.available():
            return []
        raw = llm_client.chat(
            [{"role": "user",
              "content": _PROMPT.format(catalog=_catalog(specs), question=question)}]
        )
    except Exception:
        # No LLM / call failed -> no charts. Text answers still work.
        return []
    return _parse_names(raw or "", set(specs))[:max_charts]


def build_chart_blocks(question: str, oncosuite_ids: list) -> list:
    """Selected charts, built and filtered to those that actually have data.

    A chart whose builder returns None is dropped rather than rendered empty --
    so the UI never shows a chart frame with nothing in it.
    """
    # The maps can answer a geography question across the whole database, so an
    # empty id list is not a reason to skip chart selection outright.
    blocks = []
    for name in select_charts(question):
        props = build_chart(name, oncosuite_ids)
        if props:
            blocks.append({"type": "chart", "chart": name, "props": props})
    return blocks
