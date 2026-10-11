import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

export function sourceFiles(directory, accept = (file) => file.endsWith(".js")) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .flatMap((entry) => {
      const file = join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(file, accept)
        : entry.isFile() && accept(file) ? [file] : [];
    });
}

// Retain the original corpus/order; include each proposed destination before moves.
export function authoredSourceFiles(kind = "language") {
  const excluded = new Set(kind === "pronunciation" ? ["hsk-vocabulary.js"] : [
    "hsk-vocabulary.js", "language.js", "art-bounds.js", "pronunciation.js",
  ]);
  const roots = ["public/data", ...(kind === "language" ? ["public/game"] : []),
    "public/app", "public/engine", "public/shared", "public/state", "public/content", "public/worlds"];
  const accept = (file) => file.endsWith(".js") && !excluded.has(basename(file));
  return ["public/app.js", ...roots.flatMap((root) => sourceFiles(root, accept)),
    ...(kind === "language" ? ["server/coach.js", "server/dialogue.js",
      ...sourceFiles("server/dialogue", accept)] : [])];
}
