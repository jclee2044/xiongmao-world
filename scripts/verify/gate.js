import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, createWriteStream } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const out = resolve(option("--out", "test-results/refactor/gate"));
const baseline = resolve(option("--baseline", "docs/refactor"));
const original = option("--original"), previous = option("--previous", original);
const reference = (name) => resolve(baseline, `baseline-${name}.json`);

function verifyUnit(log, status) {
  const expected = JSON.parse(readFileSync(reference("failures"), "utf8")).unit;
  assert.equal(status, expected.failed ? 1 : 0, "Unit process status changed");
  for (const [label, count] of [["tests", expected.tests], ["pass", expected.passed], ["fail", expected.failed]])
    assert.match(log, new RegExp(`ℹ ${label} ${count}\\b`), `Unit ${label} count changed`);
  const names = [...new Set([...log.matchAll(/^✖ (.+?) \(/gm)].map((match) => match[1]))].sort();
  assert.deepEqual(names, expected.failures.map((failure) => failure.test).sort(), "Unit failure names changed");
  for (const failure of expected.failures) {
    assert.ok(log.includes(failure.detail), `Unit assertion changed: ${failure.test}`);
    if (failure.actual !== undefined) assert.ok(log.includes(`'${failure.actual}' !== '${failure.expected}'`), `Unit assertion values changed: ${failure.test}`);
  }
}

if (args.includes("--check-unit-log")) {
  verifyUnit(readFileSync(option("--check-unit-log"), "utf8"), Number(option("--unit-status", "1")));
  console.log("Recorded unit outcomes match the baseline; no full gate was run.");
} else {
  assert.ok(original && previous, "Provide --original and --previous checkout paths");
  const node = process.execPath;
  const checks = [
    ["syntax", ["npm", "run", "check"]],
    ["structure", [node, "scripts/verify/structure.js"]],
    ["worlds", [node, "scripts/verify/worlds.js"]],
    ["contracts", [node, "scripts/verify/contracts.js", "--compare", reference("contracts")]],
    ["geometry", [node, "scripts/verify/geometry.js", "--compare", reference("geometry"), "--out", resolve(out, "geometry.json")]],
    ["unit", ["npm", "test"]],
    ["frames", [node, "scripts/verify/frames.js", "--compare", reference("frames"), "--out", resolve(out, "frames.json")]],
    ...[...new Set([resolve(original), resolve(previous)])].map((root, i) => [
      `offline-${i}`, [node, "scripts/verify/offline-upgrade.js", "--previous", root, "--candidate", ".", "--out", resolve(out, `offline-${i}.json`)],
    ]),
    ["browsers", [node, "scripts/verify/browser.js", "--group", "active", "--baseline", reference("browsers"), "--report", resolve(out, "browsers/results.json")]],
    ["diff", ["git", "diff", "--check"]],
  ];
  if (args.includes("--list")) console.log(JSON.stringify(checks, null, 2));
  else {
    mkdirSync(out, { recursive: true });
    const results = [];
    for (const [name, [command, ...commandArgs]] of checks) {
      const path = resolve(out, `${name}.log`), stream = createWriteStream(path), started = Date.now();
      const status = await new Promise((done, reject) => {
        const child = spawn(command, commandArgs, { stdio: ["ignore", "pipe", "pipe"] });
        for (const channel of [child.stdout, child.stderr]) channel.on("data", (chunk) => {
          stream.write(chunk);
          if (name === "browsers") process.stdout.write(chunk);
        });
        child.once("error", reject);
        child.once("close", (code) => stream.end(() => done(code)));
      });
      let error;
      try {
        if (name === "unit") verifyUnit(readFileSync(path, "utf8"), status);
        else assert.equal(status, 0, `${name} comparison failed; do not accept this batch`);
      } catch (failure) { error = failure.message; }
      results.push({ name, status, baselineEquivalent: !error, milliseconds: Date.now() - started, log: path, ...(error ? { error } : {}) });
      writeFileSync(resolve(out, "results.json"), JSON.stringify(results, null, 2) + "\n");
      if (error) throw new Error(`${name}: ${error}. Restore the unaccepted batch before investigating a possible gameplay difference.`);
      console.log(`${name}: baseline equivalent`);
    }
    console.log("Complete batch gate matched the recorded baseline, including its explicitly retained existing failures.");
  }
}
