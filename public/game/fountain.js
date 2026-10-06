const ellipse = (ctx, x, y, rx, ry, fill, stroke) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};

export function fountainBirds(o, time, animate) {
  const t = animate ? time : 0;
  return [0, 1, 2, 3].map((i) => {
    const phase = t * (0.31 + i * 0.025) + i * 1.7;
    return {
      x: o.x + Math.cos(phase) * o.w * (0.33 + (i % 2) * 0.07),
      y: o.y - o.h * 0.48 + Math.sin(phase) * o.h * 0.18,
      wings: animate ? Math.sin(t * 7 + i * 2) : 0.35,
      facing: Math.sin(phase) > 0 ? -1 : 1,
    };
  });
}
export function drawFountainBirds(ctx, o, time, animate) {
  for (const bird of fountainBirds(o, time, animate)) {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.scale(bird.facing, 1);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ede6d4";
    ctx.strokeStyle = "#81735e";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-2, 1);
      ctx.quadraticCurveTo(
        side * 11,
        -7 - bird.wings * 6,
        side * 17,
        -3 - bird.wings * 12,
      );
      ctx.quadraticCurveTo(side * 10, 5, 0, 4);
      ctx.fill();
      ctx.stroke();
    }
    ellipse(ctx, 0, 2, 7, 4, "#faf3df", "#81735e");
    ellipse(ctx, 6, 0, 3.5, 3.5, "#faf3df");
    ellipse(ctx, 7, -0.5, 0.8, 0.8, "#433d31");
    ctx.strokeStyle = "#a9874e";
    ctx.beginPath();
    ctx.moveTo(9, 1);
    ctx.lineTo(12, 1);
    ctx.stroke();
    ctx.restore();
  }
}
export function drawFountain(ctx, o, time, animate) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const size = o.w / 260;
  ctx.scale(size, size);
  ctx.lineWidth = 2;
  ellipse(ctx, 5, 4, 132, 53, "#66584330");
  // Rounded limestone basin, with a shaded front and hand-cut stone joints.
  const stone = ctx.createLinearGradient(0, -70, 0, 25);
  stone.addColorStop(0, "#f3e4c5");
  stone.addColorStop(0.6, "#d3c3a6");
  stone.addColorStop(1, "#ab9c82");
  ellipse(ctx, 0, -2, 126, 48, stone, "#a69376");
  ellipse(ctx, 0, -24, 126, 48, "#edddbc", "#a69376");
  for (let i = 1; i < 10; i++) {
    const angle = (i * Math.PI) / 10;
    const x = Math.cos(angle) * 126;
    const y = -24 + Math.sin(angle) * 48;
    ctx.strokeStyle = "#a99a7e";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 21);
    ctx.stroke();
  }
  ellipse(ctx, 0, -25, 109, 36, "#c2af8c", "#fff0d1");
  const water = ctx.createLinearGradient(0, -60, 0, 12);
  water.addColorStop(0, "#5c9991");
  water.addColorStop(1, "#acd0bb");
  ellipse(ctx, 0, -22, 103, 31, water);
  for (let i = 0; i < 4; i++) {
    const phase = animate ? (time * 0.5 + i / 4) % 1 : i / 4;
    ctx.lineWidth = 1.5;
    ellipse(
      ctx,
      0,
      -22,
      18 + phase * 80,
      5 + phase * 24,
      null,
      `rgba(237,249,217,${0.55 * (1 - phase)})`,
    );
  }
  // A compact two-tier pedestal leaves the square's walking ring spacious.
  ctx.fillStyle = stone;
  ctx.fillRect(-13, -128, 26, 107);
  ellipse(ctx, 0, -25, 24, 10, "#c5b394", "#a69376");
  ellipse(ctx, 0, -91, 47, 15, "#b8aa8d", "#938a73");
  ellipse(ctx, 0, -99, 51, 17, "#e5d6b6", "#a69376");
  ellipse(ctx, 0, -101, 42, 11, "#80b5a8", "#f4e6c6");
  ellipse(ctx, 0, -138, 24, 9, "#d5c5a5", "#a69376");
  ellipse(ctx, 0, -143, 25, 9, "#f0e2c2", "#a69376");
  ellipse(ctx, 0, -145, 18, 5, "#8dbdb0");
  // Six small continuous arcs and sliding highlights suggest falling water.
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const endX = side * (55 + i * 20);
      ctx.strokeStyle = "#d9eee0b3";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(side * 8, -146);
      ctx.quadraticCurveTo(endX, -196 + i * 15, endX, -24 + i * 3);
      ctx.stroke();
      const phase = animate ? (time * 0.8 + i * 0.23) % 1 : 0.6;
      const startX = side * 8,
        controlY = -196 + i * 15;
      const x = (1 - phase) ** 2 * startX + (2 * phase - phase ** 2) * endX;
      const y =
        (1 - phase) ** 2 * -146 +
        2 * phase * (1 - phase) * controlY +
        phase ** 2 * (-24 + i * 3);
      ellipse(ctx, x, y, 2.2, 4.5, "#f5ffec");
      ellipse(ctx, endX, -24 + i * 3, 7 + phase * 5, 2.5, null, "#e9f5d5a6");
    }
    for (let i = 0; i < 3; i++) {
      const x = side * (26 + i * 7);
      ctx.strokeStyle = "#d1e9d5b3";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, -98);
      ctx.quadraticCurveTo(x + side * 7, -62, x + side * 8, -23);
      ctx.stroke();
    }
  }
  // Tiny moss patches soften the stone without hiding its complete rim.
  for (const [x, y] of [
    [-106, -8],
    [93, 3],
    [72, 17],
    [-78, 14],
  ]) {
    ellipse(ctx, x, y, 7, 2.5, "#85966a99");
    ellipse(ctx, x + 5, y - 1, 3, 2, "#a4ad7b99");
  }
  ctx.restore();
}
