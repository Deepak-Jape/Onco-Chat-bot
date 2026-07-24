"""
Semantic-search fallback over FREE-TEXT fields only (titles, arm descriptions,
eligibility prose, MOA, summaries). This is the "search by meaning" path for
questions that text-to-SQL can't express, e.g. "trials about immunotherapy
resistance". Structured facts still go through SQL -- this is only the fallback.

Storage strategy (works TODAY, no pgvector needed):
  - Embeddings are stored in a plain table `oncosuite_gold.text_embeddings`
    (id, table_name, ref_id, field, content, embedding jsonb).
  - Similarity is computed in Python (cosine). For ~1.5k trials this is fine.
  - If/when pgvector is installed, this module can be upgraded to a vector column
    + ANN index without changing the public search() interface.

Building the index requires the embedding model (Ollama). Until then, search()
returns an empty result with a clear reason -- the app degrades gracefully.
"""
import csv
import json
import math

import config
import llm_client
from db import query, get_conn
from schema_metadata import FREE_TEXT_FIELDS

EMB_TABLE = "oncosuite_gold.text_embeddings"

# Marker table_name for rows that came from an uploaded CSV rather than the live
# DB. search() treats every embedding row identically, so these participate in
# semantic search alongside the DB-built ones with no change to the search path.
CSV_TABLE_NAME = "csv_upload"

# Columns worth folding into a CSV row's embedded document, in priority order.
# Missing columns are simply skipped -- a CSV with any subset still works. These
# match the normalized Manticore export headers; unknown columns are ignored.
CSV_DOC_FIELDS = [
    "official_title", "phases", "trial_status", "sponsor_name",
    "organ", "histology", "biomarkers", "cancer_stage", "line_of_therapy",
    "moa", "moa_category", "modality", "classes", "target", "drug_name",
    "treatment", "prior_therapy", "primary_endpoints", "primary_endpoint_type",
    "arm_type", "control_type", "mode_of_administration", "comorbidities",
]

# Candidate columns (in order) to use as the stable ref_id for a CSV row.
CSV_ID_FIELDS = ["oncosuite_id", "unique_identifier", "nct_id", "official_title"]


def ensure_table():
    """Create the embeddings table if missing. Safe to call repeatedly."""
    conn = get_conn()
    conn.set_session(readonly=False, autocommit=True)
    with conn.cursor() as cur:
        cur.execute(
            f"CREATE TABLE IF NOT EXISTS {EMB_TABLE} ("
            "  id bigserial PRIMARY KEY,"
            "  table_name text NOT NULL,"
            "  ref_id text NOT NULL,"
            "  field text NOT NULL,"
            "  content text NOT NULL,"
            "  embedding jsonb NOT NULL,"
            "  UNIQUE (table_name, ref_id, field)"
            ")"
        )


def _text_of(val):
    if val is None:
        return ""
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    return str(val)


def build_index(limit_per_field=None):
    """
    Read free-text fields, embed them, store vectors. Requires the embedding model.
    Returns a dict of counts per field. Raises llm_client.LLMUnavailable if embed fails.
    """
    ensure_table()
    conn = get_conn()
    conn.set_session(readonly=False, autocommit=True)
    counts = {}
    for table, field in FREE_TEXT_FIELDS:
        pk = "oncosuite_id" if table in ("trial_info", "cohort_info", "summary",
                                         "study_endpoints_info") else _pk_for(table)
        sql = f"SELECT {pk} AS ref_id, {field} AS content FROM oncosuite_gold.{table}"
        if limit_per_field:
            sql += f" LIMIT {int(limit_per_field)}"
        rows = query(sql)
        texts, refs = [], []
        for r in rows:
            content = _text_of(r["content"]).strip()
            if content:
                texts.append(content[:2000])
                refs.append(str(r["ref_id"]))
        if not texts:
            counts[f"{table}.{field}"] = 0
            continue
        vecs = llm_client.embed(texts)  # may raise LLMUnavailable
        with conn.cursor() as cur:
            for ref, content, vec in zip(refs, texts, vecs):
                cur.execute(
                    f"INSERT INTO {EMB_TABLE} (table_name, ref_id, field, content, embedding) "
                    "VALUES (%s,%s,%s,%s,%s) "
                    "ON CONFLICT (table_name, ref_id, field) DO UPDATE "
                    "SET content=EXCLUDED.content, embedding=EXCLUDED.embedding",
                    (table, ref, field, content, json.dumps(vec)),
                )
        counts[f"{table}.{field}"] = len(texts)
    return counts


def _csv_doc_and_id(row):
    """Build (ref_id, document_text) from one CSV row dict.

    The document concatenates the meaningful columns into labelled prose so the
    embedding captures the row's full semantic content ("PD-L1 inhibitor NSCLC
    Phase 3 ..."). ref_id is the first available identifier column.
    """
    ref_id = None
    for k in CSV_ID_FIELDS:
        v = row.get(k)
        if v and str(v).strip():
            ref_id = str(v).strip()
            break

    parts = []
    for col in CSV_DOC_FIELDS:
        if col not in row:
            continue
        val = _text_of(row[col]).strip()
        # Normalized exports often store JSON-ish list text like ["NSCLC"] or
        # {"a","b"} -- strip the noise chars so the embedding sees plain words.
        val = val.strip('[]{}"').replace('","', ', ').replace('"', '').strip()
        if val and val.lower() not in ("null", "none", "not specified"):
            parts.append(f"{col.replace('_', ' ')}: {val}")
    return ref_id, "\n".join(parts)


def build_index_from_csv(path, id_field=None, encoding="utf-8-sig", batch=64):
    """
    Read an uploaded CSV (e.g. the normalized Manticore export -- one row per
    trial) and embed each row into the SAME text_embeddings table the DB index
    uses, under table_name='csv_upload'. The existing search() then includes
    these rows automatically with no other change.

    id_field: override which column to use as ref_id (else auto-detects from
              CSV_ID_FIELDS, falling back to the row number).
    Returns {"embedded": n, "skipped": n, "ref_field": <col used>}.
    Raises llm_client.LLMUnavailable if embedding is unavailable.
    """
    ensure_table()
    conn = get_conn()
    conn.set_session(readonly=False, autocommit=True)

    with open(path, newline="", encoding=encoding) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    docs, refs = [], []
    skipped = 0
    for i, row in enumerate(rows):
        if id_field and row.get(id_field):
            ref = str(row[id_field]).strip()
            _, doc = _csv_doc_and_id(row)
        else:
            ref, doc = _csv_doc_and_id(row)
        if not doc:                      # nothing embeddable in this row
            skipped += 1
            continue
        refs.append(ref or f"row-{i}")   # never drop a row for lack of an id
        docs.append(doc[:2000])

    embedded = 0
    for start in range(0, len(docs), batch):
        chunk_docs = docs[start:start + batch]
        chunk_refs = refs[start:start + batch]
        vecs = llm_client.embed(chunk_docs)   # may raise LLMUnavailable
        with conn.cursor() as cur:
            for ref, content, vec in zip(chunk_refs, chunk_docs, vecs):
                cur.execute(
                    f"INSERT INTO {EMB_TABLE} (table_name, ref_id, field, content, embedding) "
                    "VALUES (%s,%s,%s,%s,%s) "
                    "ON CONFLICT (table_name, ref_id, field) DO UPDATE "
                    "SET content=EXCLUDED.content, embedding=EXCLUDED.embedding",
                    (CSV_TABLE_NAME, ref, "csv_row", content, json.dumps(vec)),
                )
                embedded += 1

    return {"embedded": embedded, "skipped": skipped,
            "ref_field": id_field or "auto", "csv_rows": len(rows)}


def clear_csv_index():
    """Remove all CSV-uploaded embeddings (leaves DB-built ones intact)."""
    conn = get_conn()
    conn.set_session(readonly=False, autocommit=True)
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {EMB_TABLE} WHERE table_name = %s", (CSV_TABLE_NAME,))
        return cur.rowcount


def _pk_for(table):
    return {
        "arms_info": "arm_id",
        "drug_info": "drug_id",
    }.get(table, "id")


def _cosine(a, b):
    if not a or not b or len(a) != len(b):
        return -1.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return -1.0
    return dot / (na * nb)


def index_size():
    try:
        rows = query(f"SELECT count(*) AS n FROM {EMB_TABLE}")
        return rows[0]["n"]
    except Exception:
        return 0


def search(question, top_k=None):
    """
    Semantic search. Returns dict:
      {"status": "ok"|"empty_index"|"unavailable", "results": [...], "reason": str|None}
    Never raises.
    """
    top_k = top_k or config.VECTOR_TOP_K
    if index_size() == 0:
        return {"status": "empty_index", "results": [],
                "reason": "no embeddings built yet (run vector_store.build_index once the embedding model is available)"}
    try:
        qvec = llm_client.embed([question])[0]
    except llm_client.LLMUnavailable as e:
        return {"status": "unavailable", "results": [], "reason": str(e)}

    rows = query(f"SELECT table_name, ref_id, field, content, embedding FROM {EMB_TABLE}")
    scored = []
    for r in rows:
        emb = r["embedding"]
        if isinstance(emb, str):
            emb = json.loads(emb)
        scored.append((_cosine(qvec, emb), r))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [
        {"score": round(s, 4), "table": r["table_name"], "ref_id": r["ref_id"],
         "field": r["field"], "snippet": r["content"][:400]}
        for s, r in scored[:top_k] if s > 0
    ]
    return {"status": "ok", "results": results, "reason": None}
