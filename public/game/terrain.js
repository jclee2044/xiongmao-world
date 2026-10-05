const plates = new WeakMap();
function zonePath(ctx, zone) {
  ctx.beginPath();
  if (zone.polygon) {
    zone.polygon.forEach(([x, y], i) =>
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
    );
    ctx.closePath();
  } else if (zone.shape === "ellipse")
    ctx.ellipse(
      zone.x + zone.w / 2,
      zone.y + zone.h / 2,
      zone.w / 2,
      zone.h / 2,
      0,
      0,
      Math.PI * 2,
    );
  else ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 45);
}
function softZone(ctx, zone, center, edge) {
  ctx.save();
  ctx.translate(zone.x + zone.w / 2, zone.y + zone.h / 2);
  ctx.scale(zone.w / 2, zone.h / 2);
  const gradient = ctx.createRadialGradient(0, 0, 0.1, 0, 0, 1);
  gradient.addColorStop(0, center);
  gradient.addColorStop(0.8, center);
  gradient.addColorStop(1, edge);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function strokePath(ctx, path) {
  ctx.beginPath();
  path.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
}
function paintWater(ctx, zone, time, animate) {
  ctx.save();
  ctx.lineJoin = "round";
  // The same polygon defines the water and its collider. Broad translucent bank
  // strokes soften the corners without painting a rectangular patch over paths.
  for (const [width, color] of [
    [48, "#899b7320"],
    [30, "#a9ad7c55"],
    [16, "#bcb39499"],
  ]) {
    zonePath(ctx, zone);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  zonePath(ctx, zone);
  const water = ctx.createLinearGradient(
    zone.x,
    zone.y,
    zone.x + zone.w * 0.4,
    zone.y + zone.h,
  );
  water.addColorStop(0, "#92b3a4");
  water.addColorStop(0.48, "#72a399");
  water.addColorStop(1, "#558780");
  ctx.fillStyle = water;
  ctx.fill();
  ctx.save();
  zonePath(ctx, zone);
  ctx.clip();
  for (let i = 0; i < 95; i++) {
    const x = zone.x + ((i * 137.31) % zone.w),
      y = zone.y + ((i * 71.53) % zone.h);
    const shift = animate ? Math.sin(time * 0.45 + i) * 6 : 0;
    ctx.fillStyle = i % 3 === 0 ? "#c9ddc514" : "#386e6b0c";
    ctx.beginPath();
    ctx.ellipse(
      x + shift,
      y,
      15 + (i % 18),
      1.5 + (i % 3),
      (i % 5) * 0.08,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    if (i % 7 === 0) {
      ctx.strokeStyle = "#d6e2bc55";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(x + shift, y, 18 + (i % 15), 2.8, 0, 0.2, Math.PI * 0.9);
      ctx.stroke();
    }
    if (i % 13 === 0) {
      ctx.fillStyle = "#aabc79aa";
      ctx.beginPath();
      ctx.ellipse(x, y + 5, 12, 5, -0.2, 0.12, Math.PI * 1.9);
      ctx.fill();
    }
  }
  ctx.restore();
  zonePath(ctx, zone);
  ctx.strokeStyle = "#dad0ad88";
  ctx.lineWidth = 5;
  ctx.stroke();
  if (zone.polygon)
    for (let i = 0; i < zone.polygon.length; i++) {
      const a = zone.polygon[i],
        b = zone.polygon[(i + 1) % zone.polygon.length];
      const count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 27);
      for (let j = 0; j < count; j++) {
        const t = (j + 0.35) / count,
          x = a[0] + (b[0] - a[0]) * t,
          y = a[1] + (b[1] - a[1]) * t;
        ctx.fillStyle = ["#bdb79d88", "#cfc2a799", "#a5ac8588"][(i + j) % 3];
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          6 + ((i + j) % 5),
          3 + (j % 3),
          (i + j) * 0.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  ctx.restore();
}
export function paintGround(
  ctx,
  scene,
  view,
  paving,
  { time = 0, animate = false } = {},
) {
  ctx.fillStyle = "#d3cfad";
  ctx.fillRect(view.x, view.y, view.w, view.h);
  // A low-contrast brush texture under gardens keeps the material related to the
  // painted stones without filling every courtyard with a large paved sheet.
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = paving;
  ctx.fillRect(view.x, view.y, view.w, view.h);
  ctx.restore();
  for (const zone of scene.groundZones || []) {
    if (
      zone.x + zone.w < view.x ||
      zone.x > view.x + view.w ||
      zone.y + zone.h < view.y ||
      zone.y > view.y + view.h
    )
      continue;
    if (["pond", "lake"].includes(zone.type)) {
      paintWater(ctx, zone, time, animate);
    } else if (["garden", "orchard", "bamboo-garden"].includes(zone.type)) {
      softZone(
        ctx,
        zone,
        zone.type === "orchard" ? "#bec99c" : "#aebd8d",
        "#bdc59600",
      );
      // Small irregular tufts and blossoms are anchored to world coordinates.
      for (let i = 0; i < 50; i++) {
        const px = zone.x + ((i * 137.13) % zone.w),
          py = zone.y + ((i * 87.31) % zone.h);
        if (
          ((px - zone.x - zone.w / 2) / (zone.w / 2)) ** 2 +
            ((py - zone.y - zone.h / 2) / (zone.h / 2)) ** 2 >
          0.85
        )
          continue;
        ctx.fillStyle = i % 9 === 0 ? "#e9c4ac66" : "#7b9e6b25";
        ctx.beginPath();
        ctx.ellipse(px, py, 6 + (i % 4), 2 + (i % 3), i % 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.save();
      ctx.fillStyle = paving;
      for (const [i, alpha] of [0.1, 0.16, 0.24, 0.35, 0.5, 1].entries()) {
        const inset = i * 4;
        ctx.globalAlpha = alpha;
        zonePath(ctx, {
          ...zone,
          x: zone.x + inset,
          y: zone.y + inset,
          w: zone.w - inset * 2,
          h: zone.h - inset * 2,
        });
        ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const path of scene.paths || []) {
    ctx.strokeStyle = paving;
    for (const [extra, alpha] of [
      [30, 0.07],
      [18, 0.18],
      [8, 0.25],
      [0, 0.45],
      [-6, 1],
    ]) {
      strokePath(ctx, path);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = path.width + extra;
      ctx.stroke();
    }
  }
  ctx.restore();
  // The edge apron continues the same walking material underneath the soft
  // image edge, including the two real exits from the detailed canal painting.
  if (scene.landmark) {
    const p = scene.landmark;
    const unit = p.w / 1254;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = paving;
    ctx.lineWidth = 190 * unit;
    ctx.beginPath();
    ctx.moveTo(p.x + 190 * unit, p.y + 100 * unit);
    ctx.lineTo(p.x + 200 * unit, p.y - 90 * unit);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x + p.w - 160 * unit, p.y + 895 * unit);
    ctx.lineTo(p.x + p.w + 90 * unit, p.y + 930 * unit);
    ctx.stroke();
    ctx.restore();
  }
}
export function blendedPlate(img) {
  if (plates.has(img)) return plates.get(img);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  const right = ctx.createLinearGradient(
    canvas.width - 145,
    0,
    canvas.width,
    0,
  );
  right.addColorStop(0, "#000");
  right.addColorStop(1, "#0000");
  ctx.fillStyle = right;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const top = ctx.createLinearGradient(0, 0, 0, 140);
  top.addColorStop(0, "#0000");
  top.addColorStop(1, "#000");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  plates.set(img, canvas);
  return canvas;
}
