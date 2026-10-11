import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, posix } from "node:path";
import babel from "prettier/plugins/babel";
import { sourceFiles } from "./discovery.js";

const baseline = JSON.parse(readFileSync(new URL("../../docs/refactor/baseline-inventory.json", import.meta.url), "utf8"));
const files = [...sourceFiles("public"), ...sourceFiles("server")];
const graph = {}, assetReferences = new Set();
for (const file of files) {
  const ast = babel.parsers.babel.parse(readFileSync(file, "utf8"));
  const imports = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source) imports.push(node.source.value);
    if (node.type === "StringLiteral" && node.value.startsWith("/assets/")) assetReferences.add(node.value);
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(ast);
  graph[file] = imports.map((value) => value.startsWith(".") ? posix.normalize(posix.join(dirname(file), value)) : value);
  for (const dependency of graph[file]) {
    if (/^(public|server)\//.test(dependency)) assert.ok(existsSync(dependency), `${file}: missing import ${dependency}`);
    if (file.startsWith("public/") && !dependency.startsWith("public/")) throw new Error(`${file}: non-browser dependency ${dependency}`);
    if (file.startsWith("public/shared/") && /^(public\/(app|engine|worlds)\/|server\/|node:)/.test(dependency))
      throw new Error(`${file}: shared capability imports a higher layer ${dependency}`);
  }
}
for (const file of sourceFiles("public", (file) => /\.(html|css|webmanifest)$/.test(file)))
  for (const match of readFileSync(file, "utf8").matchAll(/\/assets\/[^\s"'()<>]+/g)) assetReferences.add(match[0]);
for (const asset of assetReferences) assert.ok(existsSync("public" + asset), `Missing literal asset reference: ${asset}`);
let protectedAssets = 0;
for (const [file, info] of Object.entries(baseline.files)) {
  if (!file.startsWith("public/assets/")) continue;
  assert.ok(existsSync(file), `Original asset removed: ${file}`);
  assert.equal(createHash("sha256").update(readFileSync(file)).digest("hex"), info.sha256, `Original asset changed: ${file}`);
  protectedAssets++;
}
function cycles(imports) {
  const found = new Set(), done = new Set(), stack = [];
  function visit(file) {
    const at = stack.indexOf(file);
    if (at >= 0) {
      const members = stack.slice(at), rotations = members.map((_, i) => [...members.slice(i), ...members.slice(0, i)].join(" -> "));
      found.add(rotations.sort()[0]); return;
    }
    if (done.has(file)) return;
    stack.push(file);
    for (const target of imports[file] || []) if (imports[target]) visit(target);
    stack.pop(); done.add(file);
  }
  Object.keys(imports).forEach(visit);
  return found;
}
const knownCycles = cycles(baseline.imports), currentCycles = cycles(graph);
for (const cycle of currentCycles) assert.ok(knownCycles.has(cycle), `New module cycle: ${cycle}`);
console.log(JSON.stringify({ modules: files.length, protectedAssets, literalAssetReferences: assetReferences.size, existingCycles: [...currentCycles] }, null, 2));
