import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, posix } from "node:path";
import { pathToFileURL } from "node:url";
import babel from "prettier/plugins/babel";

// Run from the checkout being measured. Only tracked production files are read.
const root = process.cwd();
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const tracked = git("ls-files", "-z").split("\0").filter(Boolean);
const production = tracked.filter((file) => /^(public|server)\//.test(file));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = Object.fromEntries(production.map((file) => [file, {
  bytes: statSync(file).size,
  sha256: sha256(readFileSync(file)),
}]));
const imports = {};
for (const file of production.filter((file) => file.endsWith(".js"))) {
  const ast = babel.parsers.babel.parse(readFileSync(file, "utf8"));
  const sources = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source)
      sources.push(node.source.value);
    if (node.type === "ImportExpression" && node.source?.type === "StringLiteral") sources.push(node.source.value);
    if (node.type === "CallExpression" && node.callee?.type === "Import" && node.arguments[0]?.type === "StringLiteral") sources.push(node.arguments[0].value);
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "tokens", "comments"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);
  imports[file] = sources.map((source) => source.startsWith(".")
    ? posix.normalize(posix.join(dirname(file), source)) : source);
}
const load = (file) => import(pathToFileURL(resolve(root, file)));
const { scenes, MAP_VERSION } = await load("public/game/world.js");
const { npcs } = await load("public/data/content.js");
const { activities } = await load("public/data/activities.js");
const assets = Object.entries(files).filter(([file]) => file.startsWith("public/assets/"));
console.log(JSON.stringify({
  format: 1,
  revision: git("rev-parse", "HEAD"),
  tools: {
    node: process.version,
    chromium: execFileSync("/usr/bin/chromium", ["--version"], { encoding: "utf8" }).trim(),
    dependencies: JSON.parse(readFileSync("package.json", "utf8")).devDependencies,
  },
  mapVersion: MAP_VERSION,
  scenes: Object.keys(scenes),
  npcs: Object.keys(npcs),
  activities: activities.map(({ id }) => id),
  assets: { count: assets.length, bytes: assets.reduce((sum, [, info]) => sum + info.bytes, 0) },
  files,
  imports,
}, null, 2));
