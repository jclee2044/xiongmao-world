// Local previews can have separate origins/storage partitions while sharing
// this server. Handoff waits for the old player to acknowledge silence.
export function createMusicOwnership(now = Date.now) {
  const devices = new Map();
  return (device, { player, action }) => {
    if (
      !/^[a-f0-9-]{36}$/.test(player || "") ||
      !["claim", "renew", "release", "mute"].includes(action)
    )
      return null;
    const time = now();
    let state = devices.get(device);
    if (!state) {
      state = { owner: null, next: null, expires: 0, muted: false };
      devices.set(device, state);
    }
    if (state.expires <= time) state.owner = null;
    if (action === "mute") {
      state.muted = true;
      state.next = null;
    } else if (action === "claim") {
      state.muted = false;
      state.next = player;
      if (!state.owner) state.owner = player;
    } else if (action === "release" && state.owner === player) {
      state.owner = null;
    }
    if (
      action === "renew" &&
      !state.muted &&
      !state.owner &&
      state.next === player
    )
      state.owner = player;
    const granted =
      !state.muted &&
      state.owner === player &&
      (!state.next || state.next === player) &&
      action !== "release";
    if (granted) state.expires = time + 4000;
    // Keep a revoked owner's lease until it confirms its player is paused.
    return {
      granted,
      muted: state.muted,
      retry: !state.muted && state.next === player && action !== "release",
    };
  };
}
