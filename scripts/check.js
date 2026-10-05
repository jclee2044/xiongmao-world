import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
async function check(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) await check(path);
    else if (path.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", path], {
        encoding: "utf8",
      });
      if (result.status !== 0) {
        process.stderr.write(result.stderr);
        process.exitCode = 1;
      }
    }
  }
}
for (const dir of ["public", "server", "test", "scripts"]) await check(dir);
if (!process.exitCode) console.log("All JavaScript syntax checks passed.");
