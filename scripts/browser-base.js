import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("http://127.0.0.1:3210");
  await page.locator(".welcome-panda").waitFor();
  assert.equal(
    await page
      .locator(".welcome-panda")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    true,
  );
  await page.screenshot({ path: "test-results/stage-0.png" });
  const voices = await page.evaluate(async () => {
    const synth = window.speechSynthesis;
    if (!synth) return [];
    await new Promise((resolve) => {
      synth.addEventListener("voiceschanged", resolve, { once: true });
      setTimeout(resolve, 1500);
    });
    return synth.getVoices().map((v) => ({
      name: v.name,
      lang: v.lang,
      localService: v.localService,
    }));
  });
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/stage-0.json",
    JSON.stringify({ errors, voices }, null, 2),
  );
  console.log(
    JSON.stringify({ startup: "pass", assets: "pass", errors, voices }),
  );
} finally {
  await browser.close();
}
