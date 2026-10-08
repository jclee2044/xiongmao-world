// Original procedural ambience: no recordings or network requests.
const falloff = (distance, range) => Math.max(0, 1 - distance / range);
const boxDistance = (p, o) =>
  Math.hypot(
    Math.max(o.x - p.x, 0, p.x - o.x - o.w),
    Math.max(o.y - p.y, 0, p.y - o.y - o.h),
  );
export function soundscape(scene, player) {
  if (!scene || scene.interior || scene.id === "home")
    return { water: 0, fountain: 0, birds: 0, ducks: 0, pan: 0 };
  const water = Math.max(
    0,
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
    this.water.gain.setTargetAtTime(levels.water * 0.085, t, 1.8);
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
