import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";

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
if (!html.includes("</head>") || !html.includes("</body>")) {
  throw new Error("Cannot attach account controls to the preview page");
}
await writeFile(index, html
  .replace("</head>", '<link rel="stylesheet" href="./product-account-ui.css">\n</head>')
  .replace("</body>", '<script type="module" src="./product-account-ui.mjs"></script>\n</body>'));
for (const asset of ["product-account-ui.mjs", "product-account-ui.css"]) {
  await copyFile(new URL("cloudflare/" + asset, root), new URL(asset, output));
}
