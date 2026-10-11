import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { failureDetail } from "./outcomes.js";

const baseline = JSON.parse(readFileSync(new URL("../../docs/refactor/baseline-browsers.json", import.meta.url), "utf8"));
for (const check of baseline.checks.filter((check) => check.status !== "pass")) {
  const detail = failureDetail(check.failure);
  assert.equal(failureDetail(detail), detail, `${check.script}: normalization must be idempotent`);
  const asyncTrace = check.failure.replace(/( {4}at file:[^\n]+?)( \{)?\n/, "$1\n    at runNextTicks (node:internal/process/task_queues:65:5)\n    at process.processImmediate (node:internal/timers:541:9)$2\n");
  assert.equal(failureDetail(asyncTrace), detail, `${check.script}: internal stack scheduling is not an assertion change`);
  // A new value, message, timeout or call-log detail must still stop the gate.
  assert.notEqual(failureDetail(check.failure.replace(": ", ": changed ")), detail, `${check.script}: changed error text must be rejected`);
}
const log = "AssertionError [ERR_ASSERTION]: actor position changed\n\n    at file:///tmp/example.js:10:2 {\n  actual: 15,\n  expected: 14,\n  operator: 'strictEqual'\n}\n";
for (const changed of [log.replace("actual: 15", "actual: 16"), log.replace("expected: 14", "expected: 13"), log.replace("actor position", "scene identity")])
  assert.notEqual(failureDetail(changed), failureDetail(log));
console.log("Failure comparison preserves messages and values while ignoring asynchronous stack frames.");

const polling = baseline.checks.find(check => check.script.endsWith("browser-station-panda.js")).failure;
assert.equal(failureDetail(polling.replaceAll("60 ×", "61 ×")), failureDetail(polling));
for (const changed of [polling.replace("30000ms", "15000ms"), polling.replaceAll("hidden", "visible"), polling.replaceAll("#panda-speech", "#different")])
  assert.notEqual(failureDetail(changed), failureDetail(polling));
