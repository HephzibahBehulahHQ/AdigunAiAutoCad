import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const account = await readFile(new URL("../cloudflare/product-account-ui.mjs", import.meta.url), "utf8");
const accountCss = await readFile(new URL("../cloudflare/product-account-ui.css", import.meta.url), "utf8");
const stage = await readFile(new URL("../scripts/stage-account-preview.mjs", import.meta.url), "utf8");

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

