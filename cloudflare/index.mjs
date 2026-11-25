import accountWorker from "./account.mjs";
import productBot from "./product-bot.mjs";

async function componentBankReport(request, env, filename) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const manifestUrl = new URL(`/docs/reports/${filename}.parts.json`, request.url);
  const response = await env.ASSETS.fetch(new Request(manifestUrl));
  if (!response.ok) return new Response("Component inventory unavailable", { status: 502 });
  const manifest = await response.json();
  if (manifest?.version !== 1 || !Number.isSafeInteger(manifest.bytes) || manifest.bytes < 1 ||
      !Array.isArray(manifest.parts) || manifest.parts.length < 1 || manifest.parts.length > 100 ||
      manifest.parts.some((part, index) =>
        typeof part.path !== "string" ||
        part.path !== `/docs/reports/${filename}.part-${String(index + 1).padStart(3, "0")}` ||
        !Number.isSafeInteger(part.bytes) || part.bytes < 1 || part.bytes > 8 * 1024 * 1024) ||
      manifest.parts.reduce((total, part) => total + part.bytes, 0) !== manifest.bytes) {
    return new Response("Invalid component inventory manifest", { status: 502 });
  }
  const headers = {
    "Content-Type": `${filename.endsWith(".csv") ? "text/csv" : "application/json"}; charset=utf-8`,
    "Content-Length": String(manifest.bytes),
    "Cache-Control": "public, max-age=300",
  };
  if (request.method === "HEAD") return new Response(null, { headers });
  const body = new ReadableStream({
    async start(controller) {
      let total = 0;
      try {
        for (const part of manifest.parts) {
          const partUrl = new URL(part.path, request.url);
          const partResponse = await env.ASSETS.fetch(new Request(partUrl));
          if (!partResponse.ok || !partResponse.body) throw new Error("Component inventory chunk missing");
          const reader = partResponse.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              total += value.byteLength;
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }
        }
        if (total !== manifest.bytes) throw new Error("Component inventory size mismatch");
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(body, { headers });
}

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/docs/reports/component-bank.csv") return componentBankReport(request, env, "component-bank.csv");
    if (path === "/docs/reports/component-bank.json") return componentBankReport(request, env, "component-bank.json");
    if (path === "/api/account")
      return accountWorker.fetch(request, env);
    if (path === "/api/bot") return productBot.fetch(request, env);
    return env.ASSETS.fetch(request);
  },
};

