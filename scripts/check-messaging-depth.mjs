import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { MESSAGING_LESSONS, messagingDepth, messagingSearch } from "./messaging-depth.mjs";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const manifest = JSON.parse(await read("lessons/manifest.json"));
for (const number of MESSAGING_LESSONS) {
  const lesson = manifest.lessons.find(l => l.number === number);
  const html = await read(lesson.path);
  assert.ok(html.includes(messagingDepth), number);
  assert.ok(lesson.searchTerms.includes(messagingSearch), number);
  assert.equal(lesson.revision, createHash("sha256").update(html).digest("hex").slice(0, 12));
}
const guide = await read("reference/rabbitmq-kafka.html");
for (const section of ["routing", "delivery", "durability", "retry", "comparison", "ordering", "outbox", "practice"]) {
  assert.ok(guide.includes(`id="${section}"`));
}
assert.ok((await read("scripts/generate-lessons.mjs")).includes('${MESSAGING_LESSONS.includes(lesson.number) ? messagingDepth : ""}'));
const run = spawnSync(process.env.LESSON_PYTHON || "python3", ["-B", "practice/messaging-delivery/exercise.py", "-v"], {cwd: root, encoding: "utf8"});
assert.equal(run.status, 0, run.stderr || String(run.error));
console.log(run.stderr.trim());
for (const args of [
  ["-B", "-m", "unittest", "discover", "-s", "practice/durable-workflows", "-p", "test_*.py", "-v"],
  ["-B", "practice/durable-workflows/demo.py"],
]) {
  const result = spawnSync(process.env.LESSON_PYTHON || "python3", args, {cwd: root, encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr || String(result.error));
  if (args.includes("practice/durable-workflows/demo.py")) {
    assert.ok(result.stdout.includes("Broker deliveries: 2"));
    assert.ok(result.stdout.includes("Business effects: 1"));
    assert.ok(result.stdout.includes("After restart and release: compensated"));
  }
  console.log((result.stdout + result.stderr).trim());
}
const recovery = await read("reference/durable-outbox-saga.html");
for (const id of ["outbox", "saga", "practice", "limits"]) assert.ok(recovery.includes(`id="${id}"`));
console.log("Five messaging links/revisions, delivery exercises and durable recovery demo/tests checked; no live broker test ran.");
