// Nine-slice-style projection keeps each painted bridge's masonry at a natural
// scale while fitting its clear deck to the same geometry used for walking.
const cached = new Map();
export function bridgeArt(image, bridge, deck = null) {
  const sharedPaving = deck?.image?.complete && deck.image.naturalWidth;
  const materialKey = sharedPaving
    ? `${deck.image.src}:${deck.scale}:${deck.y - bridge.y}`
    : "bridge";
  const key = `${bridge.axis}:${bridge.w}:${bridge.h}:${materialKey}`;
  if (cached.has(key)) return cached.get(key);
  const pad = 160,
    canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bridge.w + pad * 2);
  canvas.height = Math.ceil(bridge.h + pad * 2);
  const ctx = canvas.getContext("2d");
  if (bridge.axis === "x") {
    const left = 28,
      right = 1018,
      scale = bridge.w / (right - left),
      step = 2;
    const lift = (x) =>
      Math.sin(Math.max(0, Math.min(1, x / bridge.w)) * Math.PI) *
      Math.min(28, bridge.w * 0.055);
    // Lay normal-sized stone courses over the clear deck. The generated
    // parapets and front arch retain their original masonry proportions.
    ctx.save();
    ctx.beginPath();
    for (let x = 0; x <= bridge.w; x += 2) ctx.lineTo(pad + x, pad - lift(x));
    ctx.lineTo(pad + bridge.w, pad + bridge.h);
    for (let x = bridge.w; x >= 0; x -= 2)
      ctx.lineTo(pad + x, pad + bridge.h - lift(x));
    ctx.closePath();
    ctx.clip();
    const paving = document.createElement("canvas");
    if (sharedPaving) {
      // Reuse the adjoining market lane's actual limestone, including its
      // cooler tones, wear and moss joints, with a matching stone size.
      // Mirror one clear paving strip vertically so its light/shade edges
      // meet continuously. The strip is wider than this bridge's clear deck.
      paving.width = 460;
      paving.height = 120;
      const stones = paving.getContext("2d");
      for (const [x, y, flipX, flipY] of [
        [0, 0, 1, 1],
        [460, 0, -1, 1],
        [0, 120, 1, -1],
        [460, 120, -1, -1],
      ]) {
        stones.save();
        stones.translate(x, y);
        stones.scale(flipX, flipY);
        stones.drawImage(deck.image, 330, 440, 230, 60, 0, 0, 230, 60);
        stones.restore();
      }
      const pattern = ctx.createPattern(paving, "repeat");
      pattern.setTransform(
        new DOMMatrix()
          .translate(pad, pad + deck.y + 440 * deck.scale - bridge.y)
          .scale(deck.scale),
      );
      ctx.fillStyle = pattern;
      ctx.fillRect(pad, pad - 30, bridge.w, bridge.h + 30);
    } else {
      paving.width = 110;
      paving.height = 39;
      paving
        .getContext("2d")
        .drawImage(image, 430, 350, 200, 70, 0, 0, 110, 39);
      ctx.fillStyle = ctx.createPattern(paving, "repeat");
      ctx.fillRect(pad, pad - 30, bridge.w, bridge.h + 30);
    }
    // A narrow coping course finishes the market landing. Its straight joint
    // separates the arched deck's courses from the flat stair-landing paving.
    if (sharedPaving) {
      ctx.save();
      ctx.translate(pad + bridge.w, pad);
      ctx.rotate(Math.PI / 2);
      for (let y = 0; y < bridge.h; y += bridge.h / 4)
        ctx.drawImage(image, 450, 428, 75, 18, y, 0, bridge.h / 4, 9);
      ctx.restore();
    }
    ctx.restore();
    for (let sx = left; sx < right; sx += step) {
      const t = (sx - left) / (right - left),
        edge = Math.abs(t * 2 - 1);
      const back = 338 + 115 * Math.pow(edge, 1.6),
        front = 430 + 105 * Math.pow(edge, 1.6);
      const rise = Math.sin(t * Math.PI) * Math.min(28, bridge.w * 0.055);
      const dx = pad + (sx - left) * scale,
        dw = step * scale + 0.6,
        top = pad - rise;
      // Back wall, generous uninterrupted walking deck, and complete front arch.
      ctx.drawImage(
        image,
        sx,
        270,
        step,
        back - 270,
        dx,
        top - (back - 270) * scale,
        dw,
        (back - 270) * scale,
      );
      ctx.drawImage(
        image,
        sx,
        front,
        step,
        670 - front,
        dx,
        top + bridge.h,
        dw,
        (670 - front) * scale,
      );
    }
  } else {
    // Preserve the second view's complete side masonry and perspective.
    // Extra width falls outside the clear deck, onto its parapets and abutments.
    ctx.drawImage(
      image,
      1090,
      18,
      445,
      972,
      pad - bridge.w * 0.4,
      pad - 30,
      bridge.w * 1.8,
      bridge.h + 70,
    );
  }
  const art = { canvas, pad };
  cached.set(key, art);
  return art;
}
