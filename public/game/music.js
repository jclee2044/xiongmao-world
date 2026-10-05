const melody = [
  62,
  null,
  66,
  69,
  null,
  64,
  62,
  null,
  71,
  69,
  null,
  66,
  64,
  null,
  62,
  null,
];
const bass = [38, 45, 42, 40];
const frequency = (note) => 440 * 2 ** ((note - 69) / 12);

// A small original pentatonic score. All sound is made locally; no audio files
// or network requests are needed, including during offline exploration.
export class Music {
  constructor(settings = {}) {
    this.volume = 0.15;
    this.enabled = false;
    this.wanted = false;
    this.ducked = false;
    this.notes = new Set();
    this.step = 0;
    this.onVisibility = () => this.sync();
    document.addEventListener("visibilitychange", this.onVisibility);
    this.applySettings(settings);
  }

  async enable() {
    // Only the game's first user gesture calls this method. Merely loading the
    // page, restoring a save, or changing volume never creates an audio device.
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
    }
    this.enabled = true;
    this.wanted = true;
    await this.sync();
    return this.context.state === "running";
  }

  play() {
    this.wanted = true;
    return this.sync();
  }

  pause() {
    this.wanted = false;
    return this.sync();
  }

  applySettings(settings) {
    if (Number.isFinite(settings.music))
      this.volume = Math.max(0, Math.min(1, settings.music));
    this.sync();
  }

  duck(active) {
    this.ducked = Boolean(active);
    this.setGain();
  }

  setGain() {
    if (!this.master) return;
    const now = this.context.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setTargetAtTime(
      this.volume * (this.ducked ? 0.1 : 1),
      now,
      this.ducked ? 0.035 : 0.3,
    );
  }

  async sync() {
    if (!this.context || !this.enabled) return;
    const audible = this.wanted && this.volume > 0 && !document.hidden;
    if (!audible) {
      clearTimeout(this.timer);
      this.timer = null;
      for (const note of this.notes) {
        try {
          note.stop();
        } catch {}
      }
      this.notes.clear();
      try {
        await this.context.suspend();
      } catch {}
      return;
    }
    this.setGain();
    try {
      await this.context.resume();
    } catch {
      return;
    }
    if (
      this.context.state === "running" &&
      this.wanted &&
      this.volume > 0 &&
      !document.hidden &&
      !this.timer
    )
      this.tick();
  }

  note(note, when, duration, level, type = "sine") {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency(note);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(level, when + 0.09);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    this.notes.add(oscillator);
    oscillator.onended = () => {
      this.notes.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(when);
    oscillator.stop(when + duration + 0.03);
  }

  tick() {
    if (this.context.state !== "running") return;
    const when = this.context.currentTime + 0.05;
    const note = melody[this.step % melody.length];
    if (note !== null) {
      this.note(note, when, 2.5, 0.11, "triangle");
      this.note(note + 12, when + 0.04, 1.9, 0.035);
    }
    if (this.step % 4 === 0)
      this.note(bass[Math.floor(this.step / 4) % bass.length], when, 5.5, 0.08);
    this.step++;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.wanted && this.volume > 0 && !document.hidden) this.tick();
    }, 2200);
  }

  async dispose() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    await this.pause();
    await this.context?.close();
  }
}
