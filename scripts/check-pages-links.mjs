import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const pages = ["index.html", "lesson.html",
  ...(await readdir(new URL("reference/", root))).filter(name => name.endsWith(".html")).map(name => `reference/${name}`),
  ...manifest.lessons.map(lesson => lesson.path)];
let checked = 0;
for (const basePath of ["/", "/lessons/", "/nested/project/"]) {
  const site = new URL(basePath, "https://pages.example");
  async function checkLink(href, page) {
    const target = new URL(href, new URL(page, site));
    if (target.origin !== site.origin) return;
    assert.ok(target.pathname.startsWith(site.pathname), `${page}: ${href} escapes deployment prefix ${basePath}`);
    const relative = decodeURIComponent(target.pathname.slice(site.pathname.length)) || "index.html";
    await access(new URL(relative, root));
    checked++;
  }
  for (const lesson of manifest.lessons) {
    assert.match(lesson.path, /^lessons\/[a-z0-9-]+\.html$/, `Noncanonical manifest path: ${lesson.path}`);
    await checkLink(`${lesson.path}?v=${lesson.revision}`, "lesson.html");
  }
  for (const page of pages) {
    const html = await readFile(new URL(page, root), "utf8");
    for (const [, href] of html.matchAll(/<(?:a|link|script|iframe)\b[^>]*\b(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|data:|#)/.test(href)) continue;
      await checkLink(href.replaceAll("&amp;", "&"), page);
    }
  }
}
console.log(`Checked ${checked} local links and lesson URLs at root and two deployment subpaths (${fileURLToPath(root)}).`);
