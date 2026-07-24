"""
Quick manual tester for the semantic-search (embedding/RAG) layer.

Run:  ./venv/Scripts/python.exe test_embeddings.py "your question here"
   or just: ./venv/Scripts/python.exe test_embeddings.py     (uses the sample questions)

It embeds your question, runs cosine similarity against the text_embeddings
table (which now holds the 1563 CSV-ingested trials under table_name='csv_upload'),
and prints the top matches with their scores -- so you can SEE whether the
embeddings return sensible trials for a meaning-based question.
"""
import sys
import vector_store as vs


SAMPLE_QUESTIONS = [
    "trials exploring ways to overcome resistance to immunotherapy",
    "novel antibody-drug conjugate approaches in lung cancer",
    "combining radiation with immune checkpoint inhibitors",
    "treatment options for patients who relapsed after chemotherapy",
    "studies targeting the tumor microenvironment",
]


def show(question, top_k=5):
    print(f"\n=== QUESTION: {question}")
    res = vs.search(question, top_k=top_k)
    if res["status"] != "ok":
        print(f"  [status={res['status']}] {res.get('reason')}")
        return
    if not res["results"]:
        print("  (no matches)")
        return
    for i, r in enumerate(res["results"], 1):
        snippet = r["snippet"].replace("\n", " | ")
        print(f"  {i}. score={r['score']:.4f}  id={r['ref_id']}")
        print(f"       {snippet[:110]}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        show(" ".join(sys.argv[1:]))
    else:
        print(f"Index size: {vs.index_size()} embeddings")
        for q in SAMPLE_QUESTIONS:
            show(q)
