import { spawn } from "node:child_process";
import { sourceFiles } from "./discovery.js";

const files = sourceFiles("test", (file) => file.endsWith(".test.js"));
if (!files.length) throw new Error("No unit tests discovered.");
if (process.argv.includes("--list")) console.log(files.join("\n"));
else {
  const child = spawn(process.execPath, ["--test", ...process.argv.slice(2), ...files], { stdio: "inherit" });
  child.on("error", (error) => { console.error(error); process.exitCode = 1; });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code ?? 1;
  });
}
