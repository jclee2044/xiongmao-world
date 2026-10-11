import { StationAudio } from "./station-audio.js";
import { STATION_SCALE } from "../data/station-exterior.js";
// Procedural nature sounds with locally bundled station recordings.
const falloff = (distance, range) => Math.max(0, 1 - distance / range);
const boxDistance = (p, o) =>
  Math.hypot(
    Math.max(o.x - p.x, 0, p.x - o.x - o.w),
    Math.max(o.y - p.y, 0, p.y - o.y - o.h),
  );
export function soundscape(scene, player) {
  if (!scene || scene.interior || scene.id === "home")
    return {
      water: 0,
      breeze: 0,
      leaves: 0,
      fountain: 0,
      birds: 0,
      ducks: 0,
      pan: 0,
    };
  // The painted canal has no groundZones. Keep its nature sounds on the
  // planted quay, promenade and bridge, fading toward the station forecourt.
  const quay =
    scene.id === "shantang"
      ? Math.max(0, Math.min(1, (980 - player.x / STATION_SCALE) / 380))
      : 0;
  const water = Math.max(
    quay,
    ...(scene.groundZones || [])
      .filter((o) => ["lake", "canal"].includes(o.type))
      .map((o) => falloff(boxDistance(player, o), 330)),
  );
  const fountains = (scene.scenery || []).filter((o) => o.type === "fountain");
  const fountain = Math.max(
    0,
    ...fountains.map((o) =>
      falloff(
        Math.max(0, Math.hypot(o.x - player.x, o.y - 22 - player.y) - o.w / 2),
        520,
      ),
    ),
  );
  const plants = (scene.scenery || []).filter(
    (o) =>
      o.type === "tree" ||
      o.type === "fruit-tree" ||
      o.nature === "bamboo" ||
      o.type === "fountain-birds" ||
      o.animal === "bird",
  );
  const birds = Math.max(
    0,
    ...plants.map((o) =>
      falloff(Math.hypot(o.x - player.x, o.y - player.y), 380),
    ),
  );
  const duck = (scene.interactables || [])
    .filter((o) => o.animal === "duck")
    .sort(
      (a, b) =>
        Math.hypot(a.x - player.x, a.y - player.y) -
        Math.hypot(b.x - player.x, b.y - player.y),
    )[0];
  return {
    water,
    breeze: quay,
    leaves: quay,
    fountain,
    birds,
    ducks: duck
      ? falloff(Math.hypot(duck.x - player.x, duck.y - player.y), 350)
      : 0,
    pan: duck ? Math.max(-0.7, Math.min(0.7, (duck.x - player.x) / 300)) : 0,
  };
}
export class Ambience {
  constructor(getWorld, getSettings) {
    this.getWorld = getWorld;
    this.getSettings = getSettings;
    this.ready = false;
    this.ducked = false;
    this.nextBird = 0;
    this.nextDuck = 0;
    document.addEventListener("visibilitychange", () => this.tick());
  }
  enable() {
    if (this.context) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    this.context = new Audio();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
    this.station = new StationAudio(this.context, this.master);
    const c = this.context,
      buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate),
      data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + Math.random() * 0.05 - 0.025) / 1.015;
      data[i] = last * 3;
    }
    this.stream = c.createBufferSource();
    this.stream.buffer = buffer;
    this.stream.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 480;
    this.water = c.createGain();
    this.water.gain.value = 0;
    this.stream.connect(filter).connect(this.water).connect(this.master);
    // Brighter falling-water hiss layered over the low canal murmur.
    const splash = c.createBiquadFilter();
    splash.type = "bandpass";
    splash.frequency.value = 1600;
    splash.Q.value = 0.45;
    this.fountain = c.createGain();
    this.fountain.gain.value = 0;
    this.stream.connect(splash).connect(this.fountain).connect(this.master);
    this.stream.start();
    // Independent stereo pink noise avoids a single flat hiss. Long loops and
    // slow, differently timed swells suggest air moving through foliage.
    const airBuffer = c.createBuffer(2, c.sampleRate * 19, c.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = airBuffer.getChannelData(channel);
      let slow = 0,
        medium = 0,
        fast = 0;
      for (let i = 0; i < samples.length; i++) {
        const white = Math.random() * 2 - 1;
        slow = slow * 0.997 + white * 0.03;
        medium = medium * 0.96 + white * 0.12;
        fast = fast * 0.6 + white * 0.3;
        samples[i] = (slow + medium + fast) * 0.45;
      }
      // Bring the loop seam to silence over a short, inaudible edge taper.
      const edge = Math.floor(c.sampleRate * 0.04);
      for (let i = 0; i < edge; i++) {
        samples[i] *= i / edge;
        samples[samples.length - 1 - i] *= i / edge;
      }
    }
    this.air = c.createBufferSource();
    this.air.buffer = airBuffer;
    this.air.loop = true;
    for (const [name, frequency, q] of [
      ["breeze", 420, 0.5],
      ["leaves", 2300, 0.65],
    ]) {
      const band = c.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = frequency;
      band.Q.value = q;
      this[name] = c.createGain();
      this[name].gain.value = 0;
      this.air.connect(band).connect(this[name]).connect(this.master);
    }
    this.air.start();
    this.timer = setInterval(() => this.tick(), 450);
    this.tick();
  }
  applySettings() {
    this.ready = true;
    this.tick();
  }
  duck(active) {
    this.ducked = active;
    this.tick();
  }
  tick() {
    const c = this.context;
    if (!c) return;
    const w = this.getWorld(),
      volume = this.getSettings().ambience ?? 0.25;
    const audible = this.ready && w && !document.hidden && volume > 0;
    this.station.update(w?.scene, w?.player, audible);
    if (!audible) {
      this.master.gain.value = 0;
      c.suspend().catch(() => {});
      return;
    }
    if (c.state === "suspended") c.resume().catch(() => {});
    const levels = soundscape(w.scene, w.player),
      t = c.currentTime;
    this.master.gain.setTargetAtTime(
      volume * (this.ducked ? 0.12 : w.paused ? 0.3 : 1),
      t,
      0.15,
    );
    this.water.gain.setTargetAtTime(
      levels.water * (w.scene.id === "shantang" ? 0.38 * 0.30 : 0.085),
      t,
      1.8,
    );
    const gust = 0.76 + 0.16 * Math.sin(t * 0.31) + 0.08 * Math.sin(t * 0.73);
    this.breeze.gain.setTargetAtTime(levels.breeze * 0.32 * 0.30 * gust, t, 1.2);
    this.leaves.gain.setTargetAtTime(
      levels.leaves * 0.22 * 0.30 * gust * (0.8 + 0.2 * Math.sin(t * 1.17)),
      t,
      0.7,
    );
    this.fountain.gain.setTargetAtTime(levels.fountain * 0.25, t, 0.45);
    if (w.paused || this.ducked) return;
    if (levels.birds > 0.05 && t > this.nextBird) {
      this.bird(levels.birds);
      this.nextBird = t + 5 + Math.random() * 7;
    }
    if (levels.ducks > 0.05 && t > this.nextDuck) {
      this.quack(levels.ducks, levels.pan);
      this.nextDuck = t + 7 + Math.random() * 9;
    }
  }
  bird(level) {
    const c = this.context;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator(),
        g = c.createGain(),
        t = c.currentTime + i * 0.18;
      o.type = "sine";
      o.frequency.setValueAtTime(1800 + i * 130, t);
      o.frequency.exponentialRampToValueAtTime(2900 - i * 200, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(2100, t + 0.13);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09 * level, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.15);
    }
  }
  quack(level, pan) {
    const c = this.context;
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator(),
        filter = c.createBiquadFilter(),
        g = c.createGain(),
        p = c.createStereoPanner(),
        t = c.currentTime + i * 0.3;
      o.type = "sawtooth";
      o.frequency.setValueAtTime(210, t);
      o.frequency.exponentialRampToValueAtTime(135, t + 0.19);
      filter.type = "bandpass";
      filter.frequency.value = 850;
      filter.Q.value = 1.4;
      p.pan.value = pan;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.24 * level, t + 0.035);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.21);
      o.connect(filter).connect(g).connect(p).connect(this.master);
      o.start(t);
      o.stop(t + 0.23);
    }
  }
}
