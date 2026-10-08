import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const speechRoot = resolve("tools/speech/usr");
export const neuralAvailable = (voice = "male") => {
  const root =
    voice === "female"
      ? "tools/vits-icefall-zh-aishell3"
      : "tools/vits-zh-hf-fanchen-wnj";
  const model =
    voice === "female" ? "model.onnx" : "vits-zh-hf-fanchen-wnj.onnx";
  return (
    [model, "lexicon.txt", "tokens.txt"].every((file) =>
      existsSync(resolve(root, file)),
    ) && existsSync(resolve("tools/asr-venv/bin/python"))
  );
};
export const speechAvailable = () =>
  existsSync(resolve(speechRoot, "bin/espeak-ng"));
export function synthesize(text, slow = false, voice = "male") {
  if (typeof text !== "string" || !text.trim() || text.length > 180)
    throw new Error("Please use a short phrase.");
  const neural = neuralAvailable(voice);
  if (!neural && (!speechAvailable() || voice === "female"))
    throw new Error("No local Mandarin speech engine installed.");
  // Punctuation supplies a pause; never send repeated marks to the phoneme engine.
  text = text
    .replace(/[?？!！]+/g, "。")
    .replace(/。+/g, "。")
    .trim();
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      neural
        ? resolve("tools/asr-venv/bin/python")
        : resolve(speechRoot, "bin/espeak-ng"),
      neural
        ? [resolve("scripts/synthesize-neural.py")]
        : [
            `--path=${speechRoot}/share`,
            "--stdout",
            "-v",
            "cmn",
            "-s",
            slow ? "115" : "155",
            "--stdin",
          ],
      {
        env: { ...process.env, LD_LIBRARY_PATH: `${speechRoot}/lib` },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const chunks = [];
    let size = 0;
    const timeout = setTimeout(
      () => {
        child.kill();
        reject(new Error("Speech timed out."));
      },
      neural ? 30000 : 12000,
    );
    child.stdout.on("data", (chunk) => {
      size += chunk.length;
      if (size > 6 * 1024 * 1024) {
        child.kill();
        reject(new Error("Speech too long."));
      } else chunks.push(chunk);
    });
    child.stderr.resume();
    child.on("error", (e) => {
      clearTimeout(timeout);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error("Speech unavailable."));
      const audio = Buffer.concat(chunks);
      if (audio.toString("ascii", 0, 4) !== "RIFF" || audio.length < 100)
        return reject(new Error("Speech generation failed."));
      audio.writeUInt32LE(audio.length - 8, 4);
      const dataOffset = audio.indexOf(Buffer.from("data"));
      if (dataOffset >= 0 && dataOffset + 8 < audio.length)
        audio.writeUInt32LE(audio.length - dataOffset - 8, dataOffset + 4);
      resolvePromise(audio);
    });
    child.stdin.on("error", () => {});
    child.stdin.end(neural ? JSON.stringify({ text, slow, voice }) : text);
  });
}
