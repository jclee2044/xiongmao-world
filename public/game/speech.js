export class Speech {
  constructor(onStatus, getSettings) {
    this.onStatus = onStatus;
    this.getSettings = getSettings;
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
    window.speechSynthesis?.cancel();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
  }
  async speak(text, slow = false) {
    this.stop();
    const settings = this.getSettings();
    if (!settings.voice)
      return this.onStatus("Voice is turned off in Settings.");
    const generation = this.generation;
    if (this.voices.length) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voices[0];
      utterance.lang = this.voices[0].lang;
      utterance.rate = slow ? 0.65 : 0.9;
      utterance.volume = settings.voiceVolume;
      utterance.onerror = () => {
        if (generation === this.generation)
          this.onStatus("Device speech could not play. Try again.");
      };
      speechSynthesis.speak(utterance);
      return this.onStatus(`Device Mandarin voice: ${utterance.voice.name}`);
    }
    this.onStatus("Preparing local Mandarin speech…");
    this.controller = new AbortController();
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, slow }),
        signal: this.controller.signal,
      });
      if (!response.ok) throw new Error("Speech unavailable");
      const blob = await response.blob();
      if (generation !== this.generation) return;
      this.url = URL.createObjectURL(blob);
      this.audio = new Audio(this.url);
      this.audio.volume = settings.voiceVolume;
      await this.audio.play();
      if (generation === this.generation)
        this.onStatus("Local Mandarin · basic synthesized voice");
    } catch (error) {
      if (generation === this.generation && error.name !== "AbortError")
        this.onStatus(
          "Mandarin audio is unavailable right now. Text practice still works.",
        );
    }
  }
}
