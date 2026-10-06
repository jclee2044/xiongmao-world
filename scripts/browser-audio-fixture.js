import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { synthesize } from "../server/speech.js";

// Synthetic, non-private speech for the actual browser microphone/ASR check.
export async function prepareAudioFixture() {
  await mkdir("test-results", { recursive: true });
  const audio = await synthesize("我要豆腐和青菜。不要辣。", false, "female");
  await writeFile("test-results/female-mandarin.wav", audio);
  execFileSync("ffmpeg", [
    "-loglevel",
    "error",
    "-y",
    "-i",
    "test-results/female-mandarin.wav",
    "-ar",
    "48000",
    "-ac",
    "1",
    "test-results/microphone-order.wav",
  ]);
  return audio;
}
