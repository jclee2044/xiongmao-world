import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

// A known tone makes pitch errors measurable, including a one-semitone shift.
const rate = 44100;
const wav = Buffer.alloc(44 + rate * 2 * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < rate * 2; i++)
  wav.writeInt16LE(
    Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 16000),
    44 + i * 2,
  );
const server = createApp({ store: new Store(":memory:") });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  await page.route("**/pitch-check", (route) =>
    route.fulfill({ contentType: "text/html", body: "<button>Start</button>" }),
  );
  await page.route("**/assets/audio/*.mp3", (route) =>
    route.fulfill({ contentType: "audio/wav", body: wav }),
  );
  await page.goto(`http://127.0.0.1:${server.address().port}/pitch-check`);
  await page.evaluate(async () => {
    // Fail if the old clock bridge ever returns.
    AudioContext.prototype.createMediaElementSource = () => {
      throw new Error("Media clock bridge forbidden");
    };
    const { Music } = await import("/game/music.js");
    window.music = new Music({ music: 0.5 });
    document.querySelector("button").onclick = () => music.enable();
    window.measurePitch = async () => {
      const analyser = music.context.createAnalyser();
      analyser.fftSize = 32768;
      music.master.connect(analyser);
      await new Promise((resolve) => setTimeout(resolve, 850));
      const spectrum = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(spectrum);
      music.master.disconnect(analyser);
      let peak = 0;
      for (let i = 1; i < spectrum.length; i++)
        if (spectrum[i] > spectrum[peak]) peak = i;
      return (peak * music.context.sampleRate) / analyser.fftSize;
    };
  });
  await page.click("button");
  await page.waitForFunction(() => music.audio && !music.audio.paused);
  const pitches = [];
  for (let i = 0; i < 4; i++) {
    await page.setViewportSize(
      i % 2 ? { width: 390, height: 844 } : { width: 844, height: 390 },
    );
    if (i) {
      await page.evaluate(async () => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
        await music.sync();
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForFunction(
        () => !music.audio.paused && music.context.state === "running",
      );
    }
    pitches.push(await page.evaluate(() => measurePitch()));
  }
  await page.evaluate(() => music.setScene({ id: "home" }));
  await page.waitForFunction(() => !music.audio.paused);
  pitches.push(await page.evaluate(() => measurePitch()));
  for (const pitch of pitches)
    assert.ok(Math.abs(pitch - 440) < 3, `Expected 440 Hz, measured ${pitch}`);
  await page.evaluate(() => music.dispose());
  console.log(
    "Stable pitch after startup, viewport rotation, hide/resume, loops and scene change:",
    pitches,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
