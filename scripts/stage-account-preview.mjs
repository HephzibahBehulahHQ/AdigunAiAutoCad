import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const output = new URL("../.wrangler/account-assets/", import.meta.url);
const assets = [
  "index.html", "terminal-catalog.js", "cad-engine.js", "cad-dxf.js",
  "service-worker.js", "CNAME", ".nojekyll",
  "docs/reports/project-library-validation.json",
  "docs/reports/component-bank.json", "docs/reports/component-bank.csv",
  "examples/real-projects/library.json",
  "vendor/dxf-parser-1.1.2.js", "vendor/dxf-writer-2.8.9.mjs",
];
for (const [directory, suffix] of [
  ["vendor/", "LICENSE.txt"],
  ["examples/real-projects/", ".adigun.json"],
]) {
  for (const name of await readdir(new URL(directory, root))) {
    if (name.endsWith(suffix)) assets.push(directory + name);
  }
}

for (const asset of assets) {
  const target = new URL(asset, output);
  await mkdir(new URL(".", target), { recursive: true });
  await copyFile(new URL(asset, root), target);
}

const index = new URL("index.html", output);
const html = await readFile(index, "utf8");
const toolbarEnd = html.indexOf("</header>", html.indexOf('<header class="topbar">'));
if (!html.includes("</head>") || !html.includes("</body>") || toolbarEnd < 0) {
  throw new Error("Cannot attach account controls to the preview page");
}
const accountButton = '<button type="button" class="search-command cad-account-launch" aria-label="Account" title="Account"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></svg><span>Account</span></button>';
const version = createHash("sha256")
  .update(await readFile(new URL("cloudflare/product-account-ui.mjs", root)))
  .update(await readFile(new URL("cloudflare/product-account-ui.css", root)))
  .update(await readFile(new URL("cloudflare/product-bot-ui.mjs", root)))
  .update(await readFile(new URL("cloudflare/product-bot-ui.css", root)))
  .digest("hex").slice(0, 12);
await writeFile(index, (html.slice(0, toolbarEnd) + accountButton + html.slice(toolbarEnd))
  .replace("</head>", `<link rel="stylesheet" href="./product-account-ui.css?v=${version}">\n<link rel="stylesheet" href="./product-bot-ui.css?v=${version}">\n</head>`)
  .replace("</body>", `<script type="module" src="./product-account-ui.mjs?v=${version}"></script>\n<script type="module" src="./product-bot-ui.mjs?v=${version}"></script>\n</body>`));
const serviceWorker = new URL("service-worker.js", output);
const shell = await readFile(serviceWorker, "utf8");
await writeFile(serviceWorker, shell
  .replace("adigun-editor-shell-v2", `adigun-editor-account-shell-${version}`)
  .replace("cache.addAll([editorUrl, ...scripts]))", "cache.addAll([editorUrl, ...scripts])).then(() => self.skipWaiting())"));
for (const asset of ["product-account-ui.mjs", "product-account-ui.css", "product-bot-ui.mjs", "product-bot-ui.css"]) {
  await copyFile(new URL("cloudflare/" + asset, root), new URL(asset, output));
}

