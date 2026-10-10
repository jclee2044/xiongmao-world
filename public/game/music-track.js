// Keep decoding and playback on the same Web Audio clock. Bridging an HTML
// media element into Web Audio can temporarily speed up playback as the browser
// reconciles the two clocks after startup or an audio-device interruption.
export class MusicTrack {
  constructor(context, url, destination) {
    this.context = context;
    this.destination = destination;
    this.src = url;
    this.loop = true;
    this.offset = 0;
    this.generation = 0;
    this.preloaded = new Map();
  }

  get paused() {
    return !this.node;
  }

  get duration() {
    return this.buffer?.duration || 0;
  }

  get currentTime() {
    const elapsed = this.node ? this.context.currentTime - this.startedAt : 0;
    return this.duration ? (this.offset + elapsed) % this.duration : 0;
  }

  set currentTime(time) {
    const playing = !this.paused;
    this.pause();
    this.offset = this.duration
      ? Math.max(0, time) % this.duration
      : Math.max(0, time);
    if (playing) this.play().catch(() => {});
  }

  load() {
    this.pause();
    this.controller?.abort();
    this.controller = null;
    this.loading = null;
    this.buffer = null;
    this.error = null;
    this.offset = 0;
  }

  preload(url) {
    if (this.preloaded.has(url)) return this.preloaded.get(url).promise;
    const controller = new AbortController();
    const prepared = { controller };
    prepared.promise = (async () => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok)
        throw new Error(`Music request failed: ${response.status}`);
      const buffer = await this.context.decodeAudioData(
        await response.arrayBuffer(),
      );
      if (controller.signal.aborted)
        throw new DOMException("Preparation cancelled", "AbortError");
      return buffer;
    })().catch((error) => {
      if (this.preloaded.get(url) === prepared) this.preloaded.delete(url);
      throw error;
    });
    this.preloaded.set(url, prepared);
    return prepared.promise;
  }

  async decode() {
    if (this.buffer) return this.buffer;
    if (!this.loading) {
      const controller = new AbortController();
      this.controller = controller;
      this.loading = (async () => {
        const prepared = this.preloaded.get(this.src);
        let buffer;
        if (prepared) buffer = await prepared.promise;
        else {
          const response = await fetch(this.src, { signal: controller.signal });
          if (!response.ok)
            throw new Error(`Music request failed: ${response.status}`);
          buffer = await this.context.decodeAudioData(
            await response.arrayBuffer(),
          );
        }
        // A scene change or disposal may happen while decoding is in flight.
        if (controller.signal.aborted)
          throw new DOMException("Track replaced", "AbortError");
        this.buffer = buffer;
        return buffer;
      })();
    }
    return this.loading;
  }

  async play() {
    if (this.node) return;
    const generation = ++this.generation;
    try {
      const buffer = await this.decode();
      if (generation !== this.generation || this.context.state !== "running")
        return;
      const node = this.context.createBufferSource();
      node.buffer = buffer;
      node.loop = this.loop;
      node.playbackRate.value = 1;
      node.detune.value = 0;
      node.connect(this.destination);
      this.node = node;
      this.startedAt = this.context.currentTime;
      node.start(0, this.offset % buffer.duration);
      this.onplay?.();
    } catch (error) {
      if (generation !== this.generation || error.name === "AbortError") return;
      this.error = error;
      this.onerror?.();
      throw error;
    }
  }

  pause() {
    ++this.generation;
    if (!this.node) return;
    this.offset = this.currentTime;
    this.node.stop();
    this.node.disconnect();
    this.node = null;
  }

  dispose() {
    this.onplay = null;
    this.onerror = null;
    this.load();
    for (const prepared of this.preloaded.values()) prepared.controller.abort();
    this.preloaded.clear();
  }
}
