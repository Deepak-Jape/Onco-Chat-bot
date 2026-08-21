/* Talks to the Python app. Vite proxies /ask and /api to it in dev, so there is
   no CORS handling and no base-URL config on either side. */

/* Chart-first answer. Hits /ask/fast, which runs the query, asks the model only
   which chart fits, and returns typed blocks -- skipping the prose-writing LLM
   call that made broad questions time out. */
export async function askFast(question, onStep, sessionId) {
  const res = await fetch("/ask/fast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: question, session_id: sessionId }),
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let payload = { blocks: [] };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;

      let obj;
      try {
        obj = JSON.parse(data);
      } catch {
        continue;
      }

      if (event === "step" && onStep) onStep(obj.text);
      else if (event === "answer") payload = obj;
      else if (event === "error") throw new Error(obj.message || "Server error");
    }
  }
  return payload;
}

/** Parse the SSE body frame-by-frame, invoking onStep for each live step. */
export async function askStream(question, onStep, sessionId) {
  const res = await fetch("/ask/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: question, session_id: sessionId }),
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let html = null;
  let ids = [];

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;

      let obj;
      try {
        obj = JSON.parse(data);
      } catch {
        continue;
      }

      if (event === "step" && onStep) onStep(obj.text);
      else if (event === "answer") {
        html = obj.html;
        if (Array.isArray(obj.oncosuite_ids)) ids = obj.oncosuite_ids;
      } else if (event === "error") {
        throw new Error(obj.message || "Server error");
      }
    }
  }

  // Charts are a second, non-blocking call: the prose answer is already usable,
  // and a chart failure must never take the answer down with it.
  let blocks = [];
  if (ids.length) {
    try {
      blocks = await fetchCharts(question, ids);
    } catch {
      blocks = [];
    }
  }
  return { html, blocks };
}

export async function fetchCharts(question, oncosuiteIds) {
  const res = await fetch("/api/charts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: question, oncosuite_ids: oncosuiteIds }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.blocks || [];
}

/** Chart catalog, including which are gated and why. Useful for debugging. */
export async function fetchCatalog() {
  const res = await fetch("/api/charts");
  if (!res.ok) return {};
  return (await res.json()).charts || {};
}
