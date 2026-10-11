// Ease outdoor tracking in world space so starts, turns and stops do not jerk
// the background. Both endpoints are clamped, so easing stays inside the scene.
export function followingRoomCamera(scene, player, width, height, scale, previous, dt = 0) {
  if (!scene.cameraFollowSeconds) return null;
  const target = {
    scale,
    camX: Math.max(0, Math.min(scene.width - width / scale, player.x - width / scale / 2)),
    camY: Math.max(0, Math.min(scene.height - height / scale, player.y - height / scale * 0.55)),
    sceneId: scene.id, viewportWidth: width, viewportHeight: height, settling: false,
  };
  if (!previous || previous.sceneId !== scene.id || previous.scale !== scale ||
      previous.viewportWidth !== width || previous.viewportHeight !== height || dt <= 0)
    return target;
  const error = Math.max(Math.abs(previous.camX - target.camX), Math.abs(previous.camY - target.camY)) * scale;
  if (error < 0.15) return target;
  const blend = -Math.expm1(-dt / scene.cameraFollowSeconds);
  return { ...target,
    camX: previous.camX + (target.camX - previous.camX) * blend,
    camY: previous.camY + (target.camY - previous.camY) * blend,
    settling: true,
  };
}

// Small authored scenes can show their complete composition without tracking
// the player. Portrait screens retain the whole platform and both rail ends.
export function fixedRoomCamera(scene, width, height) {
  if (!scene.fixedCamera) return null;
  return { scale: Math.min(width / scene.width, height / scene.height),
    camX: 0, camY: 0, sceneId: scene.id,
    viewportWidth: width, viewportHeight: height, settling: false };
}

// Keep the complete viewport inside an authored convex room outline. Zoom is
// raised only where a tapering room cannot contain the preferred framing.
export function constrainedRoomCamera(scene, player, width, height, preferredScale, previous, dt = 0) {
  const region = scene.cameraRegion;
  if (!region) return null;
  const minY = Math.min(...region.map(([, y]) => y));
  const maxY = Math.max(...region.map(([, y]) => y));
  const horizontalSpan = y => {
    const xs = [];
    for (let i = 0; i < region.length; i++) {
      const [ax, ay] = region[i], [bx, by] = region[(i + 1) % region.length];
      if (ay === by) { if (y === ay) xs.push(ax, bx); continue; }
      if (y >= Math.min(ay, by) && y <= Math.max(ay, by))
        xs.push(ax + (bx - ax) * (y - ay) / (by - ay));
    }
    return [Math.min(...xs), Math.max(...xs)];
  };
  const fit = scale => {
    const viewW = width / scale, viewH = height / scale;
    const camY = Math.max(minY, Math.min(maxY - viewH, player.y - viewH * 0.55));
    const spans = [horizontalSpan(camY), horizontalSpan(camY + viewH)];
    const left = Math.max(...spans.map(s => s[0]));
    const right = Math.min(...spans.map(s => s[1]));
    if (right - left < viewW) return null;
    const camX = Math.max(left, Math.min(right - viewW, player.x - viewW / 2));
    // All accessible positions are inside the region; prefer room-safe framing
    // even near the wall, rather than centering the camera over empty space.
    if (player.x < camX || player.x > camX + viewW) return null;
    return { scale, camX, camY };
  };
  let low = Math.max(preferredScale, height / (maxY - minY));
  let target = fit(low);
  if (!target) {
    let high = low;
    for (let i = 0; i < 20 && !target; i++) target = fit(high *= 2);
    if (!target) throw Error("Room camera outline cannot frame this position.");
    // Solve the minimum fitting zoom continuously. Quantized zoom steps caused
    // visible jumps every few pixels when approaching the detector.
    for (let i = 0; i < 36; i++) {
      const middle = (low + high) / 2;
      const candidate = fit(middle);
      if (candidate) { high = middle; target = candidate; }
      else low = middle;
    }
  }
  const metadata = { sceneId: scene.id, viewportWidth: width, viewportHeight: height };
  if (!previous || previous.sceneId !== scene.id ||
      previous.viewportWidth !== width || previous.viewportHeight !== height || dt <= 0)
    return { ...target, ...metadata, settling: false };

  const oldWidth = width / previous.scale, newWidth = width / target.scale;
  const error = Math.max(Math.abs(previous.camX-target.camX),
    Math.abs(previous.camY-target.camY), Math.abs(oldWidth-newWidth)) * target.scale;
  if (error < 0.15) return { ...target, ...metadata, settling: false };
  const blend = -Math.expm1(-dt / 0.1);
  const mix = (from, to) => from + (to-from) * blend;
  // Interpolate the world-space viewport rectangle, not its zoom factor. Each
  // corner stays on a segment between two valid points inside the convex room.
  // Thus easing never reveals the tan exterior, even while the zoom changes.
  return { camX: mix(previous.camX,target.camX), camY: mix(previous.camY,target.camY),
    scale: width / mix(oldWidth,newWidth), ...metadata, settling: true };
}
