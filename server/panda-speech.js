import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";

const cacheRoot = resolve("data/panda-speech");
const inflight = new Map();
let queue = Promise.resolve();

// Cache pronunciation as well as text: a contextual reading must never reuse
// another reading's audio. The profile versions both the speaker and effects.
export async function cachedPandaSpeech(request, generate) {
  const key = createHash("sha256")
    .update(JSON.stringify(request))
    .digest("hex");
  const path = `${cacheRoot}/${key}.wav`;
  try {
    return await readFile(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (inflight.has(key)) return inflight.get(key);
  const task = queue.then(async () => {
    const audio = await generate();
    await mkdir(cacheRoot, { recursive: true });
    const temporary = `${path}.${process.pid}.tmp`;
    await writeFile(temporary, audio);
    await rename(temporary, path);
    return audio;
  });
  queue = task.catch(() => {});
  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}
