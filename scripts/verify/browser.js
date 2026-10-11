import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, openSync, closeSync } from "node:fs";
import { basename, dirname } from "node:path";
import { sourceFiles } from "./discovery.js";
import { failureDetail } from "./outcomes.js";

const manifest = JSON.parse(readFileSync(new URL("./browser-manifest.json", import.meta.url), "utf8"));
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const group = option("--group", "maintained");
const baseline = args.includes("--baseline")
  ? new Map(JSON.parse(readFileSync(option("--baseline"), "utf8")).checks.map((check) => [check.script, check])) : null;
if (!["maintained", "supplemental", "active"].includes(group)) throw new Error(`Unknown browser group: ${group}`);
const listed = manifest.entries.map(({ file }) => file).sort();
const actual = sourceFiles("scripts", (file) => /\/browser-[^/]+\.js$/.test(file)).sort();
if (JSON.stringify(listed) !== JSON.stringify(actual)) throw new Error("Browser manifest is incomplete or contains duplicate/stale paths.");
const selected = manifest.entries.filter((entry) => entry.classification === "active" &&
  (group === "active" || entry.group === group) && (!args.includes("--only") || entry.file === option("--only")));
if (!selected.length) throw new Error("No browser checks selected.");
if (args.includes("--list")) {
  console.log(selected.map(({ file }) => file).join("\n"));
} else {
  const reportPath = option("--report", "test-results/refactor/browser-results.json");
  const timeoutMs = Number(option("--timeout-ms", "900000"));
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Invalid timeout.");
  mkdirSync(dirname(reportPath), { recursive: true });
  const results = [];
  for (const entry of selected) {
    const logPath = `${dirname(reportPath)}/${basename(entry.file, ".js")}.log`;
    const fd = openSync(logPath, "w"), started = Date.now();
    let timedOut = false;
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, [entry.file], { stdio: ["ignore", fd, fd], detached: true });
      const kill = (signal) => { try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== "ESRCH") throw error; } };
      let hardStop;
      const timer = setTimeout(() => {
        timedOut = true;
        kill("SIGTERM");
        hardStop = setTimeout(() => kill("SIGKILL"), 5000);
      }, timeoutMs);
      child.once("error", (error) => {
        clearTimeout(timer); clearTimeout(hardStop);
        resolve({ status: "error", error: error.message });
      });
      child.once("exit", (code, signal) => {
        clearTimeout(timer); clearTimeout(hardStop);
        resolve({ status: timedOut ? "timeout" : code === 0 ? "pass" : "fail", exitCode: code, signal });
      });
    });
    closeSync(fd);
    if (result.status !== "pass") result.failure = failureDetail(readFileSync(logPath, "utf8"));
    if (baseline) {
      const previous = baseline.get(entry.file);
      result.baselineMatch = previous?.status === result.status &&
        (result.status === "pass" || failureDetail(previous.failure) === result.failure);
    }
    results.push({ script: entry.file, ...result, milliseconds: Date.now() - started, log: logPath });
    writeFileSync(reportPath, JSON.stringify(results, null, 2) + "\n");
    console.log(`${results.length}/${selected.length} ${entry.file}: ${result.status} (${logPath})`);
    if (baseline && !result.baselineMatch) {
      console.error(`Baseline changed for ${entry.file}; stop before accepting the candidate.`);
      process.exitCode = 1;
      break;
    }
    if (!baseline && result.status !== "pass") {
      process.exitCode = 1;
      if (!args.includes("--keep-going")) break;
    }
  }
}
