const plates = new WeakMap();
function zonePath(ctx, zone) {
  ctx.beginPath();
  if (zone.shape === "ellipse")
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
    if (zone.type === "pond") {
      softZone(
        ctx,
        {
          ...zone,
          x: zone.x - 20,
          y: zone.y - 20,
          w: zone.w + 40,
          h: zone.h + 40,
        },
        "#8b9f86",
        "#a9b88c00",
      );
      zonePath(ctx, zone);
      ctx.fillStyle = "#699f99";
      ctx.fill();
      ctx.save();
      zonePath(ctx, zone);
      ctx.clip();
      for (let i = 0; i < 13; i++) {
        const x = zone.x + ((i * 79) % zone.w),
          y = zone.y + ((i * 43) % zone.h);
        const shift = animate ? Math.sin(time * 0.55 + i) * 5 : 0;
        ctx.strokeStyle = "#d8ecce55";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + shift, y, 22 + (i % 4) * 8, 4, 0, 0, Math.PI);
        ctx.stroke();
        if (i % 3 === 0) {
          ctx.fillStyle = "#b9c789";
          ctx.beginPath();
          ctx.ellipse(x, y + 8, 15, 8, -0.2, 0.15, Math.PI * 1.92);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (zone.type === "garden") {
      softZone(ctx, zone, "#aebd8d", "#bdc59600");
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
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = paving;
    ctx.lineWidth = 190;
    ctx.beginPath();
    ctx.moveTo(p.x + 190, p.y + 100);
    ctx.lineTo(p.x + 200, p.y - 90);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x + p.w - 160, p.y + 895);
    ctx.lineTo(p.x + p.w + 90, p.y + 930);
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
