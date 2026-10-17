import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { TOOLING_AUTH, toolingAuthMarkup } from "./tooling-auth-links.mjs";

const root = new URL("../", import.meta.url);
const read = file => readFile(new URL(file, root), "utf8");
for (const file of ["reference/python-tooling-workflow.html", "reference/token-session-lifecycle.html"]) {
  const html = await read(file);
  assert.ok(html.includes("<details>"));
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith("https://")) continue;
    const url = new URL(href, new URL(file, root));
    const hash = url.hash.slice(1);
    url.hash = "";
    await access(url);
    if (hash) assert.ok((await readFile(url, "utf8")).includes(`id="${hash}"`), href);
  }
}
const manifest = JSON.parse(await read("lessons/manifest.json"));
for (const [number, [label]] of Object.entries(TOOLING_AUTH)) {
  const lesson = manifest.lessons.find(l => l.number === number);
  const html = await read(lesson.path);
  assert.ok(html.includes(toolingAuthMarkup(number)));
  assert.ok(lesson.searchTerms.includes(label));
  assert.equal(lesson.revision, createHash("sha256").update(html).digest("hex").slice(0, 12));
}
assert.ok((await read("scripts/generate-lessons.mjs")).includes("${toolingAuthMarkup(lesson.number)}"));
for (const args of [
  ["-B", "practice/python-tooling/check_stdlib.py"],
  ["-B", "-m", "unittest", "discover", "-s", "practice/session-lifecycle", "-p", "test_*.py", "-v"],
  ["-B", "-c", "import ast,pathlib; [ast.parse(p.read_text()) for d in ('python-tooling','session-lifecycle') for p in pathlib.Path('practice',d).glob('*.py')]; print('Python source syntax checked without importing optional tools')"],
]) {
  const result = spawnSync(process.env.LESSON_PYTHON || "python3", args, {cwd: root, encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr || String(result.error));
  console.log((result.stdout + result.stderr).trim());
}
console.log("Five lesson links/revisions and local reference targets checked. Ruff, pytest, browser and live identity integrations were not executed.");
