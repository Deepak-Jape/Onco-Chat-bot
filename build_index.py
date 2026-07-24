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
    print(f"DONE: {result}")
    print(f"text_embeddings now holds {vector_store.index_size()} vectors.")


if __name__ == "__main__":
    main()
