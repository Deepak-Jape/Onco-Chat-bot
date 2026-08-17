"""
One-shot RAG index builder for production.

Embeds the trial CSV into oncosuite_gold.text_embeddings using the configured
embedding model (Qwen3-Embedding via Ollama). Run this ONCE after the container
is up and Ollama has the model, e.g.:

    docker exec oncosuite python build_index.py

Reads all config from env (same as the app): ONCOSUITE_DSN, OLLAMA_HOST,
ONCOSUITE_OLLAMA_EMBED. The CSV path comes from ONCOSUITE_CSV_PATH (default
/data/oncosuite_lung_cancer.csv -- the hand-placed, mounted CSV).

Safe to re-run: rows are upserted. If you switch embedding models, clear first
(vector_store.clear_csv_index()) then rebuild -- mixed dimensions break similarity.
"""
import os
import sys

import config
import llm_client
import vector_store

CSV_PATH = os.environ.get("ONCOSUITE_CSV_PATH", "/data/oncosuite_lung_cancer.csv")

# Auxiliary CSVs whose headers don't match the trial schema. Each is embedded
# with ALL columns and a unique `field` tag so its rows participate in semantic
# search alongside the trial rows (answers "population"/"facility" questions).
_CSV_DIR = os.path.dirname(CSV_PATH) or "."
AUX_CSVS = [
    (os.environ.get("ONCOSUITE_POPULATION_CSV",
                    os.path.join(_CSV_DIR, "population.csv")), "population",
     ["country_id", "country"]),
    (os.environ.get("ONCOSUITE_FACILITY_CSV",
                    os.path.join(_CSV_DIR, "facility_info.csv")), "facility",
     ["facility_id", "name"]),
]


def main():
    print(f"Embedding model : {config.OLLAMA_EMBED_MODEL} @ {config.OLLAMA_HOST}")
    print(f"CSV             : {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV not found at {CSV_PATH}. Mount it or set ONCOSUITE_CSV_PATH.")
        sys.exit(2)

    # Fail fast with a clear message if the embedding backend isn't reachable.
    try:
        dim = len(llm_client.embed(["healthcheck"])[0])
        print(f"Embedding backend OK (vector dim = {dim})")
    except Exception as e:
        print(f"ERROR: embedding backend unreachable: {e}")
        print("Ensure Ollama is running and the model is pulled: "
              f"`ollama pull {config.OLLAMA_EMBED_MODEL}`")
        sys.exit(3)

    print("Building index (this embeds ~1.5k rows; may take a few minutes)...")
    result = vector_store.build_index_from_csv(CSV_PATH)
    print(f"DONE (trials): {result}")

    for aux_path, field, id_fields in AUX_CSVS:
        if not os.path.exists(aux_path):
            print(f"SKIP {field}: CSV not found at {aux_path}")
            continue
        print(f"Embedding {field} CSV: {aux_path}")
        aux_result = vector_store.build_index_from_csv(
            aux_path,
            doc_fields=vector_store.ALL_COLUMNS,
            id_fields=id_fields,
            field=field,
        )
        print(f"DONE ({field}): {aux_result}")

    print(f"text_embeddings now holds {vector_store.index_size()} vectors.")


if __name__ == "__main__":
    main()
