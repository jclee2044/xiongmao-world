// Coordinate separate local preview contexts through their shared game server.
// BroadcastChannel still covers same-origin/offline documents in Music itself.
export class MusicOwnership {
  constructor(onRevoke) {
    this.player = crypto.randomUUID();
    this.onRevoke = onRevoke;
    this.allowed = false;
    this.active = false;
    this.generation = 0;
  }
  async request(action) {
    try {
      const response = await fetch("/api/music-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: this.player, action }),
        signal: AbortSignal.timeout(1000),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      // The cached soundtrack remains available when playing offline.
      return null;
    }
  }
  async claim() {
    const generation = ++this.generation;
    clearTimeout(this.timer);
    this.active = true;
    this.allowed = false;
    let action = "claim";
    while (this.active && generation === this.generation) {
      const result = await this.request(action);
      action = "renew";
      if (!this.active || generation !== this.generation) return false;
      if (!result || result.granted) {
        this.allowed = true;
        this.poll();
        return true;
      }
      if (!result.retry) return false;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
  }
  poll() {
    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      const generation = this.generation;
      const result = await this.request("renew");
      if (!this.active || generation !== this.generation) return;
      if (result && !result.granted) {
        this.allowed = false;
        this.active = false;
        // Pause synchronously before acknowledging handoff to the next player.
        this.onRevoke();
        await this.request("release");
      } else this.poll();
    }, 750);
  }
  stop(mute = false) {
    this.active = false;
    this.allowed = false;
    ++this.generation;
    clearTimeout(this.timer);
    return this.request(mute ? "mute" : "release");
  }
}
