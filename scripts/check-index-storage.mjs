import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { INDEX_STORAGE_LESSONS, indexStorageDepth, indexStorageSearch } from "./index-storage-depth.mjs";
const root = new URL("../", import.meta.url);
const read = file => readFile(new URL(file, root), "utf8");
const manifest = JSON.parse(await read("lessons/manifest.json"));
for (const number of INDEX_STORAGE_LESSONS) {
  const lesson = manifest.lessons.find(l => l.number === number);
  const html = await read(lesson.path);
  assert.ok(html.includes(indexStorageDepth));
  assert.ok(lesson.searchTerms.includes(indexStorageSearch));
  assert.equal(lesson.revision, createHash("sha256").update(html).digest("hex").slice(0, 12));
}
const reference = await read("reference/index-storage-design.html");
for (const id of ["clustered", "engines", "lookup", "bplus", "lsm", "tradeoffs", "practice"]) {
  assert.ok(reference.includes(`id="${id}"`));
}
assert.ok((await read("scripts/generate-lessons.mjs")).includes('${INDEX_STORAGE_LESSONS.includes(lesson.number) ? indexStorageDepth : ""}'));
const result = spawnSync(process.env.LESSON_PYTHON || "python3", ["-B", "practice/index-storage/exercise.py", "-v"], {cwd: root, encoding: "utf8"});
assert.equal(result.status, 0, result.stderr || String(result.error));
console.log(result.stderr.trim());
console.log("Two index-storage lesson links/revisions and seven teaching sections checked. No database or benchmark ran.");
