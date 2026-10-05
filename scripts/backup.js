import { DatabaseSync, backup } from "node:sqlite";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const directory = resolve(process.env.DATA_DIR || "data");
await mkdir(resolve(directory, "backups"), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(resolve(directory, "world.sqlite"));
try {
  const path = resolve(
    directory,
    "backups",
    `world-${new Date().toISOString().replaceAll(":", "-")}.sqlite`,
  );
  await backup(db, path);
  console.log(`Consistent SQLite backup: ${path}`);
} finally {
  db.close();
}
