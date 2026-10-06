import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
export const transcriptionAvailable = () =>
  existsSync(resolve("tools/whisper-base/model.bin")) &&
  existsSync(resolve("tools/asr-venv/bin/python"));
export function transcribe(base64) {
  if (!transcriptionAvailable())
    throw Error(
      "Local microphone recognition is unavailable. You can type your order.",
    );
  if (
    typeof base64 !== "string" ||
    base64.length > 2700000 ||
    !base64.length ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  )
    throw Error("Invalid recording.");
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      resolve("tools/asr-venv/bin/python"),
      [resolve("scripts/transcribe.py")],
      {
        env: {
          ...process.env,
          HF_HUB_OFFLINE: "1",
          HF_HUB_DISABLE_TELEMETRY: "1",
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    let output = "";
    let finished = false;
    const finish = (error, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      error ? reject(error) : resolvePromise(value);
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(Error("Local recognition took too long. Try a shorter order."));
    }, 55000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > 5000) {
        child.kill();
        finish(Error("Invalid recognition result."));
      }
    });
    child.stderr.resume();
    child.on("error", () =>
      finish(Error("Local recognition could not start.")),
    );
    child.on("close", (code) => {
      if (code)
        return finish(
          Error(
            "Could not understand this recording. Try again or type your order.",
          ),
        );
      try {
        const v = JSON.parse(output);
        if (typeof v.text !== "string") throw Error();
        finish(null, { text: v.text });
      } catch {
        finish(Error("Invalid recognition result."));
      }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(Buffer.from(base64, "base64"));
  });
}
