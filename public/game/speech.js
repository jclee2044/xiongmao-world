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
            (/^(zh-CN|zh-TW|zh-SG|zh-Hans|cmn)(-|$)/i.test(v.lang) ||
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
    text = text.replace(/[?？!！]+/g, "。").replace(/。+/g, "。");
    if (!settings.voice)
      return this.onStatus("Voice is turned off in Settings.");
    const generation = this.generation;
    const selected =
      voice === "female"
        ? this.voices.find((v) =>
            /female|xiaoxiao|xiaoyi|huihui|ting.?ting|meijia|sin.?ji|yaoyao|女/i.test(
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
          this.onStatus("Device speech could not play. Try again.");
        }
      };
      try {
        speechSynthesis.speak(utterance);
      } catch {
        this.finish(generation);
        return this.onStatus("Device speech could not play. Try again.");
      }
      return this.onStatus(`Device Mandarin voice: ${utterance.voice.name}`);
    }
    this.onStatus("Preparing local Mandarin speech…");
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
          this.onStatus("Mandarin audio could not play. Try again.");
        }
      };
      this.activity(settings.voiceVolume > 0, generation);
      await this.audio.play();
      if (generation === this.generation)
        this.onStatus(
          response.headers.get("X-Speech-Engine") === "neural"
            ? "Local Mandarin · neural voice"
            : "Local Mandarin voice",
        );
    } catch (error) {
      if (generation === this.generation && error.name !== "AbortError") {
        this.finish(generation);
        this.onStatus(
          "Mandarin audio is unavailable right now. Text practice still works.",
        );
      }
    }
  }
}
