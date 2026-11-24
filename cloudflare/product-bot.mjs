const MODEL = "@cf/zai-org/glm-4.7-flash";
const PRODUCT_HOST = "adigunaiautocad.hephzibahbehulah.com";
const LANGUAGES = {
  en: "English",
  de: "German",
  yo: "Yoruba",
  pcm: "Nigerian Pidgin English",
};
const SYSTEM = `You are Adigun BOT, the product copilot for AdigunAiAutoCad, an electrical CAD drawing workspace. Help users understand the editor, electrical drawing concepts, and safe drafting workflows. You cannot see the user's current drawing, operate controls, save files, or inspect account data; never claim otherwise. You may explain design concepts, but do not certify a design, assert code compliance, or present an illustrative drawing as installation-ready. Ask for missing context and state uncertainty. Never direct physical equipment or perform actions. Keep answers concise and practical.`;
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

function allowedHost(host) {
  return host === PRODUCT_HOST || host.endsWith(".workers.dev");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/bot" || !allowedHost(url.hostname))
      return json({ error: "not-found" }, 404);
    if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
    if (request.headers.get("Origin") !== url.origin)
      return json({ error: "origin-not-allowed" }, 403);
    if (!request.headers.get("Content-Type")?.startsWith("application/json"))
      return json({ error: "json-required" }, 415);
    if (Number(request.headers.get("Content-Length") || 0) > 14_000)
      return json({ error: "message-too-large" }, 413);
    if (!env.BOT_LIMITER?.limit || !env.AI?.run)
      return json({ error: "assistant-unavailable" }, 503);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    try {
      if (!(await env.BOT_LIMITER.limit({ key: `adigun-autocad:${ip}` })).success)
        return json({ error: "wait-and-retry" }, 429);
    } catch {
      return json({ error: "assistant-unavailable" }, 503);
    }

    let raw;
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "invalid-json" }, 400);
      const chunks = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 14_000) {
          await reader.cancel();
          return json({ error: "message-too-large" }, 413);
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      raw = new TextDecoder().decode(bytes);
    } catch { return json({ error: "invalid-json" }, 400); }
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "invalid-json" }, 400); }
    const source = Array.isArray(body?.messages) ? body.messages : [];
    const messages = source
      .filter((item) => ["user", "assistant"].includes(item?.role) && typeof item.content === "string")
      .slice(-10)
      .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 2_000) }))
      .filter((item) => item.content);
    const total = messages.reduce((size, item) => size + item.content.length, 0);
    if (!messages.length || messages.at(-1).role !== "user")
      return json({ error: "user-message-required" }, 400);
    if (total > 8_000) return json({ error: "conversation-too-large" }, 413);
    const language = LANGUAGES[body.language] || LANGUAGES.en;
    const input = [
      { role: "system", content: `${SYSTEM} Reply in ${language} when practical.` },
      ...messages,
    ];
    try {
      let result;
      try { result = await env.AI.run(MODEL, { messages: input, stream: true, max_tokens: 700 }); }
      catch { result = null; }
      const stream = result instanceof ReadableStream ? result : result?.body;
      if (stream instanceof ReadableStream) return new Response(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          "x-content-type-options": "nosniff",
          "x-accel-buffering": "no",
        },
      });
      const fallback = await env.AI.run(MODEL, { messages: input, max_tokens: 700 });
      const answer = String(fallback?.response || fallback?.choices?.[0]?.message?.content || "").trim();
      return answer ? json({ answer }) : json({ error: "assistant-response-unavailable" }, 502);
    } catch {
      return json({ error: "assistant-temporarily-unavailable" }, 502);
    }
  },
};

