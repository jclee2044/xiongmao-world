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

export const backgroundTrack = {
  url: "/assets/audio/asia-fsm-team.mp3",
  title: "Asia",
  artist: "FSM Team",
  source: "https://www.free-stock-music.com/fsm-team-asia.html",
  license: "https://creativecommons.org/licenses/by/4.0/",
  credit: "Music by https://www.free-stock-music.com",
};

export const indoorTrack = {
  url: "/assets/audio/sonican-asian-music-magical-dream.mp3",
  title: "Asian Music - Magical Dream",
  artist: "Sonican",
  source: "https://pixabay.com/music/china-asian-music-magical-dream-321895/",
  license: "https://pixabay.com/service/license-summary/",
};

// The licensed recording is bundled locally. The original pentatonic score
// remains available when the recording cannot load or decode.
export class Music {
  constructor(settings = {}) {
    this.volume = 0.15;
    this.enabled = false;
    this.wanted = false;
    this.ducked = false;
    this.notes = new Set();
    this.step = 0;
    this.version = 0;
    this.track = backgroundTrack;
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

  setScene(scene) {
    const track = scene?.interior || scene?.id === "home" ? indoorTrack : backgroundTrack;
    if (track === this.track) return;
    this.track = track;
    ++this.version;
    this.stopNotes();
    if (this.audio) {
      this.audio.onplay = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.source?.disconnect();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = null;
      this.source = null;
    }
    this.trackFailed = false;
    if (this.master) {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.value = 0;
    }
    this.sync();
  }

  setGain() {
    if (!this.master) return;
    const now = this.context.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setTargetAtTime(
      this.audible() ? this.volume * (this.ducked ? 0.1 : 1) : 0,
      now,
      this.ducked ? 0.035 : 0.3,
    );
  }

  audible() {
    return (
      this.enabled &&
      this.wanted &&
      this.volume > 0 &&
      !document.hidden &&
      !this.disposed
    );
  }

  createTrack() {
    if (this.audio || this.trackFailed) return;
    try {
      this.audio = new Audio(this.track.url);
      this.audio.loop = true;
      this.audio.preload = "auto";
      this.audio.onplay = () => {
        // A pending play must not outlive a mute, pause, or hidden page.
        if (!this.audible()) this.audio.pause();
      };
      this.audio.onerror = () => this.failTrack();
      this.source = this.context.createMediaElementSource(this.audio);
      this.source.connect(this.master);
    } catch {
      this.failTrack();
    }
  }

  failTrack() {
    if (this.trackFailed || this.disposed) return;
    this.trackFailed = true;
    this.audio?.pause();
    this.source?.disconnect();
    this.sync();
  }

  stopNotes() {
    clearTimeout(this.timer);
    this.timer = null;
    for (const note of this.notes) {
      try {
        note.stop();
      } catch {}
    }
    this.notes.clear();
  }

  async sync() {
    if (!this.context || !this.enabled) return;
    const version = ++this.version;
    if (!this.audible()) {
      this.audio?.pause();
      this.stopNotes();
      // Silence immediately, including while a state response is pending.
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.value = 0;
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
    if (version !== this.version || !this.audible()) return;
    if (this.context.state !== "running") return;
    this.createTrack();
    if (this.trackFailed) {
      if (!this.timer) this.tick();
      return;
    }
    this.stopNotes();
    try {
      await this.audio.play();
      if (!this.audible()) this.audio.pause();
    } catch (error) {
      if (version !== this.version || !this.audible()) return;
      // Browser gesture restrictions and an interrupted play are not broken
      // recordings; retain the track so the next user gesture can retry it.
      if (error.name !== "NotAllowedError" && error.name !== "AbortError")
        this.failTrack();
    }
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
    if (this.context.state !== "running" || !this.audible()) return;
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
      if (this.audible()) this.tick();
    }, 2200);
  }

  async dispose() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.disposed = true;
    await this.pause();
    if (this.audio) {
      this.audio.onplay = null;
      this.audio.onerror = null;
      this.audio.removeAttribute("src");
      this.audio.load();
    }
    this.source?.disconnect();
    await this.context?.close();
  }
}
