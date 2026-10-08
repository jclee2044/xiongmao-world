import { normalizeVoice } from "../data/voices.js";

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
  }
  async speak(text, slow = false, voice = this.voice || "male") {
    this.stop();
    const settings = this.getSettings();
    voice = normalizeVoice(voice);
    text = text.replace(/[?？!！]+/g, "。").replace(/。+/g, "。");
    if (!settings.voice) return this.onStatus("声音关了，可以在设置里打开。");
    const generation = this.generation;
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
    if (selected) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selected;
      utterance.lang = selected.lang;
      utterance.rate = slow ? 0.65 : 0.9;
      utterance.volume = settings.voiceVolume;
      utterance.onstart = () =>
        this.activity(settings.voiceVolume > 0, generation);
      utterance.onend = () => this.finish(generation);
      utterance.onerror = () => {
        if (generation === this.generation) {
          this.finish(generation);
          this.onStatus("声音没播出来，再试一次吧。");
        }
      };
      try {
        speechSynthesis.speak(utterance);
      } catch {
        this.finish(generation);
        return this.onStatus("声音没播出来，再试一次吧。");
      }
      return this.onStatus(`正在说话…`);
    }
    this.onStatus("等一下，马上说…");
    this.controller = new AbortController();
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, slow, voice }),
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
          this.onStatus("声音没播出来，再试一次吧。");
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
        this.onStatus("现在没有声音，可以先看看文字。");
      }
    }
  }
}
