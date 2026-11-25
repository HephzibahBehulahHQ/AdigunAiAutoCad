import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const account = await readFile(new URL("../cloudflare/product-account-ui.mjs", import.meta.url), "utf8");
const accountCss = await readFile(new URL("../cloudflare/product-account-ui.css", import.meta.url), "utf8");
const stage = await readFile(new URL("../scripts/stage-account-preview.mjs", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");
const botUi = await readFile(new URL("../cloudflare/product-bot-ui.mjs", import.meta.url), "utf8");
const botCss = await readFile(new URL("../cloudflare/product-bot-ui.css", import.meta.url), "utf8");
const help = await readFile(new URL("../docs/HELP.md", import.meta.url), "utf8");
const deploy = await readFile(new URL("../.github/workflows/cloudflare-worker.yml", import.meta.url), "utf8");

test("product account icon reflects verified active, signed-out, and unknown states", () => {
  for (const state of ['"active"', '"signed-out"', '"unknown"']) assert.ok(account.includes(state));
  assert.match(accountCss, /data-account-state="active"/);
  assert.match(accountCss, /data-account-state="unknown"/);
  assert.match(accountCss, /::after[^}]*background:\s*#7a8798/);
});

test("account state labels support all four product languages", () => {
  for (const language of ["en:", "de:", "yo:", "pcm:"]) assert.ok(account.includes(language));
});

test("product asset staging installs both account status and floating copilot UI", () => {
  assert.match(stage, /product-account-ui\.mjs/);
  assert.match(stage, /product-bot-ui\.mjs/);
  assert.match(stage, /product-bot-ui\.css/);
});

test("both preview and production route the BOT API through the Worker", () => {
  const routes = [...wrangler.matchAll(/run_worker_first\s*=\s*\[([^\]]+)\]/g)].map((match) => match[1]);
  assert.equal(routes.length, 2);
  for (const route of routes) {
    assert.match(route, /"\/api\/account"/);
    assert.match(route, /"\/api\/bot"/);
  }
});

test("floating BOT supports window controls, keyboard movement, and local preferences", () => {
  for (const feature of ["data-minimize", "data-maximize", "data-drag-handle", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "localStorage", "ResizeObserver"]) {
    assert.ok(botUi.includes(feature), `missing ${feature}`);
  }
  assert.match(botCss, /resize:\s*both/);
  assert.match(botCss, /\.is-minimized/);
  assert.match(botCss, /\.is-maximized/);
  assert.match(help, /Using the Adigun BOT Floating Window/);
  assert.match(help, /device/);
  assert.match(help, /cannot inspect or edit/);
});




test("production Worker release uses protected credentials and verifies the route", () => {
  assert.match(deploy, /environment: cloudflare-production/);
  assert.ok(deploy.includes(".github/workflows/cloudflare-worker.yml"));
  assert.ok(deploy.includes("secrets.CLOUDFLARE_API_TOKEN"));
  assert.ok(deploy.includes("vars.CLOUDFLARE_ACCOUNT_ID"));
  assert.match(deploy, /deploy --env production/);
  assert.ok(deploy.includes("adigunaiautocad.hephzibahbehulah.com/api/bot"));
  assert.ok(deploy.includes('test "$status" = "405"'));
});

test("Worker report assets stay below the per-file limit and keep the CSV URL", () => {
  assert.match(stage, /chunkBytes = 8 \* 1024 \* 1024/);
  assert.ok(stage.includes('for (const extension of ["csv", "json"])'));
  assert.ok(stage.includes("${filename}.parts.json"));
  assert.ok(stage.includes("${filename}.part-"));
  const routes = [...wrangler.matchAll(/run_worker_first\s*=\s*\[([^\]]+)\]/g)].map((match) => match[1]);
  assert.equal(routes.length, 2);
  for (const extension of ["csv", "json"]) for (const route of routes) assert.ok(route.includes(`"/docs/reports/component-bank.${extension}"`));
});
