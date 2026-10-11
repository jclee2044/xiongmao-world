import { normalizeVoice } from "../data/voices.js";
import { needsPronunciationContext } from "../data/pronunciation.js";

// Keep every narration request within the server's short-phrase limit.
export function narrationChunks(text) {
  const chunks = [];
  let remaining = String(text).trim();
  while (remaining.length > 180) {
    const prefix = remaining.slice(0, 180);
    const boundaries = [...prefix.matchAll(/[。！？.!?]\s*|\s+/g)];
    const last = boundaries.at(-1);
    let end = last ? last.index + last[0].length : 180;
    if (end < 60) end = 180;
    if (/[\uD800-\uDBFF]/.test(remaining[end - 1])) end--;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export class Speech {
  constructor(onStatus, getSettings, onActivity = () => {}) {
    this.onStatus = onStatus;
    this.getSettings = getSettings;
    this.onActivity = onActivity;
    this.active = false;
    this.generation = 0;
    this.voices = [];
    this.refresh();
    window.speechSynthesis?.addEventListener("voiceschanged", () =>
      this.refresh(),
    );
  }
  refresh() {
    this.voices =
      window.speechSynthesis
        ?.getVoices()
        .filter(
          (v) =>
            v.localService &&
            (/^(zh-CN|zh-TW|zh-SG|zh-Hans|cmn)(-|$)/i.test(
              v.lang.replaceAll("_", "-"),
            ) ||
              v.lang === "zh"),
        ) || [];
  }
  stop() {
    this.generation++;
    this.narrationQueue = null;
    this.controller?.abort();
    this.controller = null;
    window.speechSynthesis?.cancel();
    this.finish(this.generation);
  }
  activity(active, generation = this.generation) {
    if (generation !== this.generation || this.active === active) return;
    this.active = active;
    this.onActivity(active);
  }
  finish(generation) {
    if (generation !== this.generation) return;
    this.activity(false, generation);
    if (this.audio) {
      const audio = this.audio;
      this.audio = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
    this.complete?.();
    this.complete = null;
  }
  // Automatic Panda comments wait for the current speaker and each other.
  // Explicit playback, closing a panel, or leaving the page cancels the queue.
  narrate(text, { interrupt = false, valid = () => true } = {}) {
    if (interrupt) this.stop();
    if (!this.getSettings().voice) return Promise.resolve();
    const generation = this.generation;
    const previous =
      this.narrationQueue || this.completion || Promise.resolve();
    const task = previous.then(async () => {
      for (const chunk of narrationChunks(text)) {
        if (generation !== this.generation || !valid()) return;
        const playback = this.play(chunk, false, "panda");
        const completion = this.completion;
        await playback;
        await completion;
      }
    });
    this.narrationQueue = task;
    return task;
  }
  speak(text, slow = false, voice = this.voice || "panda", context) {
    this.stop();
    return this.play(text, slow, voice, context);
  }
  async play(text, slow, voice, context) {
    this.completion = new Promise((resolve) => (this.complete = resolve));
    const settings = this.getSettings();
    voice = normalizeVoice(voice);
    if (!settings.voice) {
      this.finish(this.generation);
      return this.onStatus("声音关了。可以在 Settings 里开。");
    }
    const generation = this.generation;
    try {
      if (this.resolveText) text = await this.resolveText(text);
    } catch {
      this.finish(generation);
      return;
    }
    if (generation !== this.generation) return;
    // Preserve Panda's expressive punctuation; NPCs use simple pause marks.
    if (voice !== "panda")
      text = text.replace(/[?？!！]+/g, "。").replace(/。+/g, "。");
    // Mobile voice lists can arrive after construction without voiceschanged.
    this.refresh();
    const selected =
      voice === "young-female"
        ? this.voices.find((v) =>
            /female|xiaoxiao|xiaoyi|huihui|ting.?ting|mei.?jia|sin.?ji|yaoyao|tian.?tian|女/i.test(
              v.name,
            ),
          )
        : null;
    // Native voices cannot accept our explicit contextual phones.
    if (selected && !needsPronunciationContext(text)) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selected;
      utterance.lang = selected.lang;
      utterance.rate = slow ? 0.65 : 0.9;
      // Native speech has no PCM gain stage; use the remaining volume headroom.
      utterance.volume = Math.min(1, settings.voiceVolume * 1.5);
      utterance.onstart = () =>
        this.activity(settings.voiceVolume > 0, generation);
      utterance.onend = () => this.finish(generation);
      utterance.onerror = () => {
        if (generation === this.generation) {
          this.finish(generation);
          this.onStatus("现在听不到声音。再试一次吧。");
        }
      };
      try {
        speechSynthesis.speak(utterance);
      } catch {
        this.finish(generation);
        return this.onStatus("现在听不到声音。再试一次吧。");
      }
      return this.onStatus(`正在说话…`);
    }
    this.onStatus("等一下，马上说…");
    this.controller = new AbortController();
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          slow,
          voice,
          ...(context ? { context } : {}),
        }),
        signal: this.controller.signal,
      });
      if (!response.ok) throw new Error("Speech unavailable");
      const blob = await response.blob();
      if (generation !== this.generation) return;
      this.url = URL.createObjectURL(blob);
      this.audio = new Audio(this.url);
      this.audio.volume = settings.voiceVolume;
      this.audio.onended = () => this.finish(generation);
      this.audio.onerror = () => {
        if (generation === this.generation) {
          this.finish(generation);
          this.onStatus("现在听不到声音。再试一次吧。");
        }
      };
      this.activity(settings.voiceVolume > 0, generation);
      await this.audio.play();
      if (generation === this.generation)
        this.onStatus(
          response.headers.get("X-Speech-Engine") === "neural"
            ? "正在说话…"
            : "正在说话…",
        );
    } catch (error) {
      if (generation === this.generation && error.name !== "AbortError") {
        this.finish(generation);
        this.onStatus("现在没有声音，可以先看看字。");
      }
    }
  }
}
