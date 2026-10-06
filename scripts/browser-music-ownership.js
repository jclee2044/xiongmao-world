import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

const server = createApp({ store: new Store(":memory:") });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
const pages = [];
try {
  for (const origin of [base, base, base.replace("127.0.0.1", "localhost")]) {
    // Separate storage partitions emulate independent embedded preview views;
    // BroadcastChannel cannot coordinate these, including the different origin.
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.route("**/music-owner-check", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<button id="start">Start</button><button id="mute">Mute</button><button id="unmute">Unmute</button>',
      }),
    );
    await page.goto(origin + "/music-owner-check");
    await page.evaluate(async () => {
      await fetch("/api/state");
      const { Music } = await import("/game/music.js");
      window.music = new Music({ music: 0.2 });
      window.timeline = [];
      const OriginalAudio = window.Audio;
      window.Audio = function (...args) {
        const audio = new OriginalAudio(...args);
        for (const name of ["playing", "pause"])
          audio.addEventListener(name, () =>
            timeline.push({ time: Date.now(), active: name === "playing" }),
          );
        return audio;
      };
      document.querySelector("#start").onclick = () => music.enable();
      document.querySelector("#mute").onclick = () =>
        music.applySettings({ music: 0 });
      document.querySelector("#unmute").onclick = () =>
        music.applySettings({ music: 0.2 });
    });
    pages.push(page);
  }
  for (let i = 0; i < pages.length; i++) {
    await pages[i].click("#start");
    await pages[i].waitForFunction(
      () => music.audio && !music.audio.paused && music.audio.currentTime > 0.1,
    );
    for (const previous of pages.slice(0, i)) {
      assert.equal(await previous.evaluate(() => music.audio.paused), true);
      assert.equal(await previous.evaluate(() => music.master.gain.value), 0);
      assert.equal(
        await previous.evaluate(() => music.context.state),
        "suspended",
      );
    }
  }
  // Muting from an old view must also stop the soundtrack owned by another view.
  await pages[0].click("#mute");
  await pages[2].waitForFunction(
    () => music.audio.paused && music.master.gain.value === 0,
  );
  for (const page of pages)
    assert.equal(await page.evaluate(() => music.audio.paused), true);
  await pages[0].click("#unmute");
  await pages[0].waitForFunction(
    () => !music.audio.paused && music.audio.currentTime > 0.1,
  );
  await pages[0].evaluate(() => music.setScene({ id: "home" }));
  await pages[0].waitForFunction(
    () => music.audio.src.includes("sonican") && music.audio.currentTime > 0.1,
  );
  await pages[0].click("#mute");
  await pages[0].waitForFunction(
    () => music.audio.paused && music.context.state === "suspended",
  );
  // Merge event timestamps across contexts to catch overlap during handoff,
  // rather than only asserting the final state after the second player starts.
  const events = (
    await Promise.all(
      pages.map((page, index) =>
        page.evaluate((index) => timeline.map((e) => ({ ...e, index })), index),
      ),
    )
  )
    .flat()
    .sort((a, b) => a.time - b.time || Number(a.active) - Number(b.active));
  const active = new Set();
  for (const event of events) {
    if (event.active) active.add(event.index);
    else active.delete(event.index);
    assert.ok(
      active.size <= 1,
      "Soundtracks never overlap, including during handoff",
    );
  }
  // Losing the server while offline still permits the locally cached recording.
  await pages[0].context().setOffline(true);
  await pages[0].click("#unmute");
  await pages[0].waitForFunction(
    () => !music.audio.paused && music.context.state === "running",
  );
  await pages[0].click("#mute");
  await pages[0].waitForFunction(
    () => music.audio.paused && music.master.gain.value === 0,
  );
  console.log(
    "Isolated previews and different origins: exclusive handoff, shared mute, scene changes and offline playback pass.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
