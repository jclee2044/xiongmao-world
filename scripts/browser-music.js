import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
const testServer = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${testServer.address().port}`;
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  const phone = await mobile.newPage();
  await phone.route("**/mobile-music-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<button id="start">Start</button>',
    }),
  );
  await phone.goto(base + "/mobile-music-check");
  await phone.evaluate(async () => {
    await fetch("/api/state");
    const { Music } = await import("/game/music.js");
    // Model phone policy: each audio device must first start in the tap handler.
    let inTap = false;
    for (const [prototype, method] of [
      [AudioContext.prototype, "resume"],
      [HTMLMediaElement.prototype, "play"],
    ]) {
      const original = prototype[method];
      const unlocked = new WeakSet();
      prototype[method] = function (...args) {
        if (inTap) unlocked.add(this);
        if (!unlocked.has(this))
          return Promise.reject(
            new DOMException("Tap required", "NotAllowedError"),
          );
        return original.apply(this, args);
      };
    }
    window.mobileMusic = new Music({ music: 0 });
    document.querySelector("#start").onclick = () => {
      inTap = true;
      mobileMusic.enable();
      inTap = false;
      setTimeout(() => mobileMusic.applySettings({ music: 0.2 }), 300);
    };
  });
  await phone.locator("#start").tap();
  await phone.waitForFunction(
    () =>
      mobileMusic.context.state === "running" &&
      !mobileMusic.audio.paused &&
      mobileMusic.audio.currentTime > 0.1 &&
      mobileMusic.master.gain.value > 0.1,
  );
  await phone.evaluate(() => mobileMusic.dispose());
  await mobile.close();
  console.log(
    "Phone startup plays saved volume after delayed settings without another tap.",
  );
  const page = await browser.newPage({ serviceWorkers: "block" });
  let recordingRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/assets/audio/asia-fsm-team.mp3"))
      recordingRequests++;
  });
  await page.route("**/music-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<button id="start">Start music</button><div id="panel-content"></div>',
    }),
  );
  await page.goto(base + "/music-check");
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
  assert.equal(recordingRequests, 0, "No music fetch before a user gesture");
  await page.getByRole("button", { name: "Start music" }).click();
  await page.waitForFunction(
    () =>
      check.music.context?.state === "running" &&
      check.music.audio?.currentTime > 0.1,
  );
  await page.waitForTimeout(650);
  assert.ok(await page.evaluate(() => check.music.master.gain.value > 0.17));
  assert.equal(await page.evaluate(() => check.music.trackFailed), undefined);
  assert.equal(await page.evaluate(() => check.music.notes.size), 0);
  assert.equal(await page.evaluate(() => check.music.audio.loop), true);
  assert.equal(await page.evaluate(() => check.music.audio.paused), false);
  const recording = await page.request.get(
    base + "/assets/audio/asia-fsm-team.mp3",
  );
  assert.equal(recording.status(), 200);
  assert.match(recording.headers()["content-type"], /audio\/mpeg/);
  const recordedSound = await page.evaluate(async () => {
    const response = await fetch("/assets/audio/asia-fsm-team.mp3");
    const buffer = await check.music.context.decodeAudioData(
      await response.arrayBuffer(),
    );
    const analyser = check.music.context.createAnalyser();
    check.music.master.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    await new Promise((resolve) => setTimeout(resolve, 100));
    analyser.getFloatTimeDomainData(samples);
    check.music.master.disconnect(analyser);
    return {
      duration: buffer.duration,
      channels: buffer.numberOfChannels,
      playbackRms: Math.sqrt(
        samples.reduce((sum, sample) => sum + sample * sample, 0) /
          samples.length,
      ),
    };
  });
  assert.ok(recordedSound.duration > 210 && recordedSound.duration < 212);
  assert.equal(recordedSound.channels, 2);
  assert.ok(
    recordedSound.playbackRms > 0.0001,
    "Real music reaches the gain graph",
  );
  assert.ok(
    (await readFile("public/assets/audio/asia-fsm-team.mp3")).byteLength <
      8 * 1024 * 1024,
  );
  await page.evaluate(() => {
    check.music.audio.currentTime = check.music.audio.duration - 0.2;
  });
  await page.waitForFunction(() => check.music.audio.currentTime < 1);
  assert.equal(await page.evaluate(() => check.music.audio.paused), false);

  await page.evaluate(() => check.music.setScene({ id: "home" }));
  await page.waitForFunction(
    () =>
      check.music.audio?.src.endsWith(
        "sonican-asian-music-magical-dream.mp3",
      ) && check.music.audio.currentTime > 0.1,
  );
  const indoor = await page.evaluate(async () => {
    const response = await fetch(
      "/assets/audio/sonican-asian-music-magical-dream.mp3",
    );
    const buffer = await check.music.context.decodeAudioData(
      await response.arrayBuffer(),
    );
    return { duration: buffer.duration, channels: buffer.numberOfChannels };
  });
  assert.ok(indoor.duration > 78 && indoor.duration < 80);
  assert.equal(indoor.channels, 2);
  assert.equal(await page.evaluate(() => check.music.audio.loop), true);
  await page.evaluate(() =>
    check.music.setScene({ id: "bakery", interior: true }),
  );
  assert.ok(
    await page.evaluate(() =>
      check.music.audio.src.endsWith("sonican-asian-music-magical-dream.mp3"),
    ),
  );
  await page.evaluate(() => check.music.setScene({ id: "shanghai" }));
  await page.waitForFunction(
    () =>
      check.music.audio?.src.endsWith("asia-fsm-team.mp3") &&
      check.music.audio.currentTime > 0.1,
  );

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
    await page.evaluate(() => check.statuses.at(-1).includes("现在没有声音")),
  );

  await page.evaluate(async () => {
    window.fetch = async () => new Response("Fixture invalid audio");
    await check.speech.speak("请再说一次。");
  });
  assert.equal(await page.evaluate(() => check.music.ducked), false);
  assert.equal(await page.evaluate(() => check.speech.url), null);

  // A stale native speech end event must not unduck a newer utterance.
  await page.evaluate(async () => {
    check.speech.voices = [{ lang: "zh-CN", name: "Fixture female" }];
    const utterances = [];
    window.SpeechSynthesisUtterance = class {};
    speechSynthesis.speak = (utterance) => utterances.push(utterance);
    await check.speech.speak("一。", false, "female");
    utterances[0].onstart();
    await check.speech.speak("二。", false, "female");
    utterances[1].onstart();
    utterances[0].onend();
    check.nativeStillDucked = check.music.ducked;
    utterances[1].onerror();
  });
  assert.equal(await page.evaluate(() => check.nativeStillDucked), true);
  assert.equal(await page.evaluate(() => check.music.ducked), false);

  await page.evaluate(() => check.panels.settings());
  await page.getByLabel("音乐", { exact: true }).selectOption("off");
  await page.waitForFunction(() => check.music.context.state === "suspended");
  assert.equal(await page.evaluate(() => check.music.audio.paused), true);
  assert.equal(await page.evaluate(() => check.music.master.gain.value), 0);
  assert.equal(await page.getByLabel("音乐声音大小").isDisabled(), true);
  assert.equal(await page.evaluate(() => check.state.settings.music), 0);
  await page.getByLabel("音乐", { exact: true }).selectOption("on");
  await page.waitForFunction(() => check.music.context.state === "running");
  await page.waitForFunction(() => !check.music.audio.paused);
  assert.equal(await page.evaluate(() => check.state.settings.music), 0.2);
  await page.getByLabel("音乐声音大小").evaluate((input) => {
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
  assert.equal(await page.evaluate(() => check.music.audio.paused), true);
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
  const pausedAt = await page.evaluate(() => check.music.audio.currentTime);
  await page.waitForTimeout(150);
  assert.equal(
    await page.evaluate(() => check.music.audio.currentTime),
    pausedAt,
  );
  await page.context().setOffline(true);
  await page.evaluate(() => check.music.play());
  await page.waitForFunction(() => check.music.context.state === "running");
  await page.waitForFunction(
    (time) => check.music.audio.currentTime > time + 0.05,
    pausedAt,
  );
  await page.evaluate(() => check.music.dispose());
  assert.equal(await page.evaluate(() => check.music.context.state), "closed");
  assert.equal(await page.evaluate(() => check.music.audio.paused), true);

  await page.context().setOffline(false);
  // Muting while an actual recording request is pending also stops playback
  // when its data arrives after the mute.
  const pending = await browser.newPage({ serviceWorkers: "block" });
  await pending.route("**/music-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<button id="start">Start music</button>',
    }),
  );
  let releaseRecording, recordingRequested;
  const heldRecording = new Promise((resolve) => (releaseRecording = resolve)),
    requestedRecording = new Promise(
      (resolve) => (recordingRequested = resolve),
    );
  const recordingBytes = await readFile(
    "public/assets/audio/asia-fsm-team.mp3",
  );
  await pending.route("**/assets/audio/asia-fsm-team.mp3", async (route) => {
    recordingRequested();
    await heldRecording;
    await route.fulfill({ contentType: "audio/mpeg", body: recordingBytes });
  });
  await pending.goto(base + "/music-check");
  await pending.evaluate(async () => {
    const { Music } = await import("/game/music.js");
    window.music = new Music({ music: 0.2 });
    document.querySelector("#start").onclick = () => music.enable();
  });
  await pending.getByRole("button", { name: "Start music" }).click();
  await requestedRecording;
  await pending.evaluate(() => music.applySettings({ music: 0 }));
  await pending.waitForFunction(() => music.context.state === "suspended");
  releaseRecording();
  await pending.waitForTimeout(300);
  assert.equal(await pending.evaluate(() => music.audio.paused), true);
  assert.equal(await pending.evaluate(() => music.master.gain.value), 0);
  assert.equal(await pending.evaluate(() => music.notes.size), 0);
  await pending.evaluate(() => music.dispose());
  await pending.close();

  // A missing or corrupt bundled recording falls back to the local score,
  // with the same mute and speech-ducking behavior.
  const fallback = await browser.newPage({ serviceWorkers: "block" });
  await fallback.route("**/music-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<button id="start">Start music</button>',
    }),
  );
  await fallback.route("**/assets/audio/asia-fsm-team.mp3", (route) =>
    route.fulfill({ status: 404, body: "Missing recording fixture" }),
  );
  await fallback.goto(base + "/music-check");
  await fallback.evaluate(async () => {
    const { Music } = await import("/game/music.js");
    window.music = new Music({ music: 0.2 });
    document.querySelector("#start").onclick = () => music.enable();
  });
  await fallback.getByRole("button", { name: "Start music" }).click();
  await fallback.waitForFunction(
    () => music.trackFailed && music.notes.size > 0,
  );
  await fallback.waitForTimeout(650);
  assert.ok(await fallback.evaluate(() => music.master.gain.value > 0.17));
  await fallback.evaluate(() => music.duck(true));
  await fallback.waitForTimeout(200);
  assert.ok(await fallback.evaluate(() => music.master.gain.value < 0.04));
  await fallback.evaluate(() => music.applySettings({ music: 0 }));
  await fallback.waitForFunction(() => music.context.state === "suspended");
  assert.equal(await fallback.evaluate(() => music.notes.size), 0);
  assert.equal(await fallback.evaluate(() => music.master.gain.value), 0);
  await fallback.context().setOffline(true);
  await fallback.evaluate(() => {
    music.duck(false);
    music.applySettings({ music: 0.2 });
  });
  await fallback.waitForFunction(
    () => music.context.state === "running" && music.notes.size > 0,
  );
  await fallback.evaluate(() => music.dispose());
  await fallback.close();

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
        createOscillator = graph.createOscillator.bind(graph),
        createMediaElementSource = graph.createMediaElementSource.bind(graph);
      graph.createdNotes = 0;
      graph.musicTracks = [];
      graph.createGain = () => {
        const gain = createGain();
        if (!graph.musicMaster) graph.musicMaster = gain;
        return gain;
      };
      graph.createOscillator = () => {
        graph.createdNotes++;
        return createOscillator();
      };
      graph.createMediaElementSource = (audio) => {
        graph.musicTracks.push(audio);
        return createMediaElementSource(audio);
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
  await game.goto(base);
  assert.equal(await game.evaluate(() => musicGraphs.length), 0);
  await game.getByRole("button", { name: "和熊猫一起走走" }).click();
  await game.locator("#world").waitFor({ state: "visible" });
  await game.waitForFunction(
    () =>
      musicGraphs[0]?.state === "running" &&
      musicGraphs[0]?.musicMaster.gain.value > 0.1 &&
      musicGraphs[0]?.musicTracks[0]?.currentTime > 0.1,
  );
  await game.getByRole("button", { name: "设置", exact: true }).click();
  await game.getByLabel("音乐", { exact: true }).selectOption("off");
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
  await game.getByRole("button", { name: "和熊猫一起走走" }).click();
  await requestedState;
  await game.waitForFunction(() => musicGraphs[0]?.musicMaster);
  await game.waitForTimeout(400);
  const pendingMute = await game.evaluate(() => ({
    gain: musicGraphs[0].musicMaster.gain.value,
    maximumGain: Math.max(...musicGainSamples),
    createdNotes: musicGraphs[0].createdNotes,
    createdTracks: musicGraphs[0].musicTracks.length,
    trackPaused: musicGraphs[0].musicTracks[0]?.paused,
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
  assert.equal(
    pendingMute.createdTracks,
    1,
    "The Start tap primes one silent recording for mobile playback",
  );
  assert.equal(pendingMute.trackPaused, true);
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
  await game.getByRole("button", { name: "设置", exact: true }).click();
  assert.equal(
    await game.getByLabel("音乐", { exact: true }).inputValue(),
    "off",
  );
  assert.equal(await game.getByLabel("音乐声音大小").isDisabled(), true);
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
    licensedLocalRecording: recordedSound,
    realRecordingPlaybackAndLoop: true,
    bufferedRecordingResumesOffline: true,
    pendingRecordingMuteStaysSilent: true,
    localSynthesisFallbackOffline: true,
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
  await new Promise((resolve) => testServer.close(resolve));
}
