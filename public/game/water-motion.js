// World-anchored wavelets keep their positions when the camera moves. Callers
// clip to the water before drawing; bridges, plants and boats go on top.
export function paintWaterSurface(
  ctx,
  bounds,
  time,
  { view = bounds, spacing = 76, intensity = 1, flowX = 3.2, flowY = 1.4 } = {},
) {
  const left = Math.max(bounds.x, view.x) - spacing;
  const top = Math.max(bounds.y, view.y) - spacing;
  const right = Math.min(bounds.x + bounds.w, view.x + view.w) + spacing;
  const bottom = Math.min(bounds.y + bounds.h, view.y + view.h) + spacing;
  ctx.save();
  ctx.lineCap = "round";
  for (
    let row = Math.floor(top / spacing);
    row <= Math.ceil(bottom / spacing);
    row++
  ) {
    for (
      let col = Math.floor(left / spacing);
      col <= Math.ceil(right / spacing);
      col++
    ) {
      const seed = Math.sin(col * 17.31 + row * 9.73);
      const cycle = (time * 0.12 + (seed + 1) * 0.5) % 1;
      const fade = Math.sin(cycle * Math.PI) ** 2;
      const x =
        col * spacing + seed * spacing * 0.26 + ((cycle - 0.5) * flowX) / 0.12;
      const y =
        row * spacing +
        Math.cos(col * 8.2 + row) * spacing * 0.25 +
        ((cycle - 0.5) * flowY) / 0.12;
      const width = spacing * (0.22 + (seed + 1) * 0.08);
      const bend = Math.sin(time * 0.7 + seed * 4) * 2.2;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(245,239,203,${fade * 0.25 * intensity})`;
      ctx.beginPath();
      ctx.moveTo(x - width, y);
      ctx.bezierCurveTo(
        x - width * 0.35,
        y - 2 + bend,
        x + width * 0.4,
        y + 2 + bend,
        x + width,
        y - 1,
      );
      ctx.stroke();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(33,91,92,${fade * 0.07 * intensity})`;
      ctx.beginPath();
      ctx.moveTo(x - width * 0.65, y + 4);
      ctx.quadraticCurveTo(x, y + 6 + bend, x + width * 0.8, y + 3);
      ctx.stroke();
      if ((col + row * 3) % 7 === 0) {
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = `rgba(231,241,212,${fade * 0.23 * intensity})`;
        ctx.beginPath();
        ctx.ellipse(
          x + 9,
          y + 15,
          4 + cycle * 17,
          1.3 + cycle * 3.5,
          -0.12,
          0.2,
          Math.PI * 1.75,
        );
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// A slow current moves the underlying watercolor as well as its highlights.
export function waterPatternTransform(time, animate) {
  const t = animate ? time : 0;
  return new DOMMatrix()
    .translate(Math.sin(t * 0.18) * 3 + t * 1.1, t * 2.1)
    .scale(0.42);
}
