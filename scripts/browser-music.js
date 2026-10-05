import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
try {
  const page = await browser.newPage({ serviceWorkers: "block" });
  await page.route("**/music-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<button id="start">Start music</button><div id="panel-content"></div>',
    }),
  );
  await page.goto("http://127.0.0.1:3210/music-check");
  await page.evaluate(async () => {
    const { Music } = await import("/game/music.js");
    const { Speech } = await import("/game/speech.js");
    const { createPanels } = await import("/game/panels.js");
    const { defaultSettings } = await import("/data/settings.js");
    const music = new Music({ music: 0.2 });
    const activity = [];
    const statuses = [];
    const state = {
      settings: { ...defaultSettings, music: 0.2 },
      settingsHistory: [],
      feedback: [],
    };
    const speech = new Speech(
      (status) => statuses.push(status),
      () => state.settings,
      (active) => {
        activity.push(active);
        music.duck(active);
      },
    );
    speech.voices = [];
    const panels = createPanels({
      persistence: {
        state,
        change: (change) => change(state),
      },
      openPanel: (_, html) => {
        document.querySelector("#panel-content").innerHTML = html;
      },
      toast: () => {},
      applySettings: () => music.applySettings(state.settings),
    });
    document.querySelector("#start").onclick = () => music.enable();
    window.check = { music, speech, activity, statuses, state, panels };
    const rate = 16000;
    const bytes = new ArrayBuffer(44 + rate * 2);
    const view = new DataView(bytes);
    const ascii = (offset, text) => {
      for (let i = 0; i < text.length; i++)
        view.setUint8(offset + i, text.charCodeAt(i));
    };
    ascii(0, "RIFF");
    view.setUint32(4, bytes.byteLength - 8, true);
    ascii(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    ascii(36, "data");
    view.setUint32(40, rate * 2, true);
    for (let i = 0; i < rate; i++)
      view.setInt16(
        44 + i * 2,
        Math.sin((i / rate) * Math.PI * 660) * 100,
        true,
      );
    window.check.wav = bytes;
  });

  assert.equal(
    await page.evaluate(() => Boolean(check.music.context)),
    false,
    "Restoring settings must not create an audio device before a gesture",
  );
  await page.getByRole("button", { name: "Start music" }).click();
  await page.waitForFunction(() => check.music.context?.state === "running");
  await page.waitForTimeout(650);
  assert.ok(await page.evaluate(() => check.music.master.gain.value > 0.17));
  assert.ok(await page.evaluate(() => check.music.notes.size > 0));

  // The Web Audio device and HTMLAudioElement are real. This one-second local
  // WAV fixture exercises playback lifecycle without depending on an OS voice.
  await page.evaluate(async () => {
    window.fetch = async () =>
      new Response(check.wav, { headers: { "Content-Type": "audio/wav" } });
    await check.speech.speak("你好。");
  });
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => check.music.master.gain.value < 0.04));
  assert.equal(await page.evaluate(() => check.music.ducked), true);
  await page.waitForFunction(() => !check.speech.active);
  await page.waitForTimeout(650);
  assert.equal(await page.evaluate(() => check.music.ducked), false);
  assert.ok(await page.evaluate(() => check.music.master.gain.value > 0.17));
  assert.equal(await page.evaluate(() => check.speech.url), null);

  await page.evaluate(async () => {
    await check.speech.speak("再见。");
    check.speech.stop();
  });
  assert.equal(await page.evaluate(() => check.music.ducked), false);
  assert.equal(await page.evaluate(() => check.speech.audio), null);

  await page.evaluate(async () => {
    let release;
    window.fetch = () => new Promise((resolve) => (release = resolve));
    const pending = check.speech.speak("旧消息。");
    check.speech.stop();
    release(new Response(check.wav));
    await pending;
  });
  assert.equal(await page.evaluate(() => check.music.ducked), false);
  assert.equal(await page.evaluate(() => check.speech.audio), null);

  await page.evaluate(async () => {
    window.fetch = async () => {
      throw new Error("Fixture speech unavailable");
    };
    await check.speech.speak("请再说一次。");
  });
  assert.equal(await page.evaluate(() => check.music.ducked), false);
  assert.ok(
    await page.evaluate(() => check.statuses.at(-1).includes("unavailable")),
  );

  await page.evaluate(async () => {
    window.fetch = async () => new Response("Fixture invalid audio");
    await check.speech.speak("请再说一次。");
  });
  assert.equal(await page.evaluate(() => check.music.ducked), false);
  assert.equal(await page.evaluate(() => check.speech.url), null);

  // A stale native speech end event must not unduck a newer utterance.
  await page.evaluate(async () => {
    check.speech.voices = [{ lang: "zh-CN", name: "Fixture" }];
    const utterances = [];
    window.SpeechSynthesisUtterance = class {};
    speechSynthesis.speak = (utterance) => utterances.push(utterance);
    await check.speech.speak("一。");
    utterances[0].onstart();
    await check.speech.speak("二。");
    utterances[1].onstart();
    utterances[0].onend();
    check.nativeStillDucked = check.music.ducked;
    utterances[1].onerror();
  });
  assert.equal(await page.evaluate(() => check.nativeStillDucked), true);
  assert.equal(await page.evaluate(() => check.music.ducked), false);

  await page.evaluate(() => check.panels.settings());
  await page.getByLabel("Background music").selectOption("off");
  await page.waitForFunction(() => check.music.context.state === "suspended");
  assert.equal(await page.getByLabel("Music volume").isDisabled(), true);
  assert.equal(await page.evaluate(() => check.state.settings.music), 0);
  await page.getByLabel("Background music").selectOption("on");
  await page.waitForFunction(() => check.music.context.state === "running");
  assert.equal(await page.evaluate(() => check.state.settings.music), 0.2);
  await page.getByLabel("Music volume").evaluate((input) => {
    input.value = "0.35";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.equal(await page.evaluate(() => check.music.volume), 0.35);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForFunction(() => check.music.context.state === "suspended");
  assert.equal(await page.evaluate(() => check.music.notes.size), 0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForFunction(() => check.music.context.state === "running");
  await page.evaluate(() => check.music.pause());
  await page.waitForFunction(() => check.music.context.state === "suspended");
  await page.evaluate(() => check.music.play());
  await page.waitForFunction(() => check.music.context.state === "running");
  await page.evaluate(() => check.music.dispose());
  assert.equal(await page.evaluate(() => check.music.context.state), "closed");

  // Exercise the actual game's save/gesture/load ordering. A saved mute must
  // remain silent while a delayed state response is still in flight.
  const context = await browser.newContext({ serviceWorkers: "block" });
  const game = await context.newPage();
  await game.addInitScript(() => {
    window.musicGraphs = [];
    window.musicGainSamples = [];
    const OriginalContext = window.AudioContext;
    window.AudioContext = function (...args) {
      const graph = new OriginalContext(...args),
        createGain = graph.createGain.bind(graph),
        createOscillator = graph.createOscillator.bind(graph);
      graph.createdNotes = 0;
      graph.createGain = () => {
        const gain = createGain();
        if (!graph.musicMaster) graph.musicMaster = gain;
        return gain;
      };
      graph.createOscillator = () => {
        graph.createdNotes++;
        return createOscillator();
      };
      musicGraphs.push(graph);
      return graph;
    };
    window.AudioContext.prototype = OriginalContext.prototype;
    setInterval(() => {
      for (const graph of musicGraphs)
        if (graph.musicMaster)
          musicGainSamples.push(graph.musicMaster.gain.value);
    }, 10);
  });
  await game.goto("http://127.0.0.1:3210");
  assert.equal(await game.evaluate(() => musicGraphs.length), 0);
  await game.getByRole("button", { name: "Wander with Panda" }).click();
  await game.locator("#world").waitFor({ state: "visible" });
  await game.waitForFunction(
    () =>
      musicGraphs[0]?.state === "running" &&
      musicGraphs[0]?.musicMaster.gain.value > 0.1 &&
      musicGraphs[0]?.createdNotes > 0,
  );
  await game.getByRole("button", { name: "Settings", exact: true }).click();
  await game.getByLabel("Background music").selectOption("off");
  await game.waitForFunction(() => musicGraphs[0]?.state === "suspended");
  await game.waitForFunction(
    () => !JSON.parse(localStorage.getItem("panda-world-v1")).dirty,
  );
  assert.equal(
    await game.evaluate(
      async () =>
        (await (await fetch("/api/state")).json()).state.settings.music,
    ),
    0,
    "Mute was saved to the actual server before reloading",
  );
  let releaseState, stateRequested;
  const delayedState = new Promise((resolve) => (releaseState = resolve)),
    requestedState = new Promise((resolve) => (stateRequested = resolve));
  let delay = true;
  await game.route("**/api/state", async (route) => {
    if (delay && route.request().method() === "GET") {
      stateRequested();
      await delayedState;
      delay = false;
    }
    await route.continue();
  });
  await game.reload();
  assert.equal(await game.evaluate(() => musicGraphs.length), 0);
  await game.getByRole("button", { name: "Wander with Panda" }).click();
  await requestedState;
  await game.waitForFunction(() => musicGraphs[0]?.musicMaster);
  await game.waitForTimeout(400);
  const pendingMute = await game.evaluate(() => ({
    gain: musicGraphs[0].musicMaster.gain.value,
    maximumGain: Math.max(...musicGainSamples),
    createdNotes: musicGraphs[0].createdNotes,
    state: musicGraphs[0].state,
  }));
  assert.equal(
    pendingMute.gain,
    0,
    "The unlocked audio graph stays silent while a saved mute is loading",
  );
  assert.equal(
    pendingMute.maximumGain,
    0,
    "No sampled music gain becomes audible before the state response",
  );
  assert.equal(
    pendingMute.createdNotes,
    0,
    "Muted loading must not schedule music notes",
  );
  assert.equal(pendingMute.state, "suspended");
  releaseState();
  await game.locator("#world").waitFor({ state: "visible" });
  await game.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  assert.equal(
    await game.evaluate(() => musicGraphs[0].musicMaster.gain.value),
    0,
  );
  assert.equal(await game.evaluate(() => musicGraphs[0].state), "suspended");
  await game.getByRole("button", { name: "Settings", exact: true }).click();
  assert.equal(await game.getByLabel("Background music").inputValue(), "off");
  assert.equal(await game.getByLabel("Music volume").isDisabled(), true);
  assert.equal(
    await game.evaluate(
      async () =>
        (await (await fetch("/api/state")).json()).state.settings.music,
    ),
    0,
  );
  await context.close();

  const result = {
    noAudioBeforeGesture: true,
    localSynthesis: true,
    realAudioPlaybackDucking: true,
    stopLateResponseAndErrorRestore: true,
    staleNativeSpeechIgnored: true,
    settingsToggleAndVolume: true,
    hiddenPageSuspends: true,
    freshGameStartsMusic: true,
    savedMuteSilentDuringDelayedLoad: pendingMute,
    savedMuteRestored: true,
  };
  await writeFile("test-results/music.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
