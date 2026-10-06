import { bridgeArt } from "./bridges.js";
import { pointInPolygon } from "./world.js";
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
export function paintWater(ctx, zone, time, animate) {
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
  {
    time = 0,
    animate = false,
    earth = null,
    water = null,
    bridges = null,
    market = null,
  } = {},
) {
  // Opaque earth, stone and planted beds: no translucent floor rectangles.
  ctx.fillStyle = earth || "#c4ac84";
  ctx.fillRect(view.x, view.y, view.w, view.h);
  for (let y = Math.floor(view.y / 30) * 30; y < view.y + view.h; y += 30)
    for (let x = Math.floor(view.x / 35) * 35; x < view.x + view.w; x += 35) {
      const n = Math.abs(Math.sin(x * 12.3 + y * 4.5));
      ctx.fillStyle = n > 0.5 ? "#dfc8a13a" : "#82684120";
      ctx.fillRect(x + n * 15, y + n * 12, 2 + n * 4, 1 + n * 2);
    }
  for (const z of scene.groundZones || []) {
    if (z.type === "canal" || z.type === "lake") continue;
    zonePath(ctx, z);
    ctx.fillStyle = z.type === "courtyard" ? paving : earth || "#c4ac84";
    ctx.fill();
    if (z.type !== "courtyard") {
      ctx.fillStyle = "#8095549c";
      ctx.fill();
    }
    if (z.type !== "courtyard") {
      ctx.save();
      zonePath(ctx, z);
      ctx.clip();
      for (let i = 0; i < 160; i++) {
        const x = z.x + ((i * 133.7) % z.w),
          y = z.y + ((i * 91.3) % z.h);
        ctx.fillStyle = i % 7 === 0 ? "#dec49b" : "#798b5f";
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + (i % 5), 1.8, i, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of scene.paths || []) {
    if (p.painted) continue;
    strokePath(ctx, p);
    ctx.strokeStyle = p.material === "pebble" ? "#c3b99e" : paving;
    ctx.lineWidth = p.width;
    ctx.stroke();
    if (p.material === "pebble") {
      for (let i = 1; i < p.points.length; i++) {
        const [ax, ay] = p.points[i - 1],
          [bx, by] = p.points[i];
        const d = Math.hypot(bx - ax, by - ay);
        for (let j = 0; j < d; j += 14) {
          const x = ax + ((bx - ax) * j) / d,
            y = ay + ((by - ay) * j) / d;
          ctx.fillStyle = j % 28 ? "#787f69" : "#e1d5b9";
          ctx.beginPath();
          ctx.ellipse(x, y, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  ctx.restore();
  for (const z of scene.groundZones || [])
    if (z.type === "lake") paintWater(ctx, z, time, animate);
  const canals = scene.canals || [];
  // Connected canals are painted as one union; there is no internal bank at a junction.
  if (canals?.length) {
    ctx.save();
    ctx.beginPath();
    for (const z of canals) {
      if (z.polygon) {
        z.polygon.forEach(([x, y], i) =>
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
        );
        ctx.closePath();
      } else ctx.rect(z.x, z.y, z.w, z.h);
    }
    ctx.clip();
    // Painted ripples use the same turquoise watercolor language as the market.
    ctx.fillStyle = water || "#438e94";
    ctx.fillRect(0, 0, scene.width, scene.height);
    if (animate) {
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#f9edc2";
      ctx.lineWidth = 1.2;
      for (let y = 20; y < scene.height; y += 85)
        for (let x = 20; x < scene.width; x += 105) {
          const shift = Math.sin(time * 0.35 + y + x) * 3;
          ctx.beginPath();
          ctx.ellipse(x + shift, y, 13, 2, -0.15, 0.1, Math.PI * 0.8);
          ctx.stroke();
        }
      ctx.globalAlpha = 1;
    }
    // Slow wooden boats pass under the bridges, following the canal centerline.
    for (const z of canals.filter((c) => c.h > c.w && !c.winding))
      for (let i = 0; i < 2; i++) {
        const x = z.x + z.w * (i ? 0.67 : 0.33),
          y = z.y + ((time * 13 + i * 1200 + 320) % (z.h - 180)) + 90;
        ctx.save();
        ctx.translate(x, y);
        if (i) ctx.rotate(Math.PI);
        ctx.fillStyle = "#385f5b66";
        ctx.beginPath();
        ctx.ellipse(4, 4, 30, 64, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#765131";
        ctx.strokeStyle = "#d1a66b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -63);
        ctx.quadraticCurveTo(43, -24, 23, 49);
        ctx.quadraticCurveTo(0, 71, -23, 49);
        ctx.quadraticCurveTo(-43, -24, 0, -63);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#c29b63";
        ctx.lineWidth = 2;
        for (let yy = -38; yy < 46; yy += 12) {
          ctx.beginPath();
          ctx.moveTo(-18, yy);
          ctx.lineTo(18, yy);
          ctx.stroke();
        }
        const roof = ctx.createLinearGradient(-22, 0, 22, 0);
        roof.addColorStop(0, "#8b663c");
        roof.addColorStop(0.5, "#c4a066");
        roof.addColorStop(1, "#795638");
        ctx.fillStyle = roof;
        ctx.fillRect(-22, -20, 44, 48);
        ctx.strokeStyle = "#ead0a0";
        for (let yy = -16; yy < 28; yy += 7) {
          ctx.beginPath();
          ctx.moveTo(-22, yy);
          ctx.lineTo(22, yy);
          ctx.stroke();
        }
        ctx.strokeStyle = "#af8554";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(15, 40);
        ctx.lineTo(48 + Math.sin(time * 1.5) * 9, 68);
        ctx.stroke();
        ctx.restore();
      }
    ctx.restore();
    const inWater = (x, y) =>
      canals.some((c) => pointInPolygon(x, y, c.polygon));
    for (const z of canals) {
      if (z.paintedBank) continue;
      const edges = z.polygon.map((a, i) => [
        ...a,
        ...z.polygon[(i + 1) % z.polygon.length],
      ]);
      for (const [ax, ay, bx, by] of edges) {
        const d = Math.hypot(bx - ax, by - ay),
          n = Math.ceil(d / 30);
        if (!d) continue;
        const nx = -(by - ay) / d,
          ny = (bx - ax) / d;
        for (let j = 0; j < n; j++) {
          const t = (j + 0.5) / n,
            x = ax + (bx - ax) * t,
            y = ay + (by - ay) * t;
          const marketPlate = scene.marketPlate;
          if (
            z.marketWest &&
            marketPlate &&
            x > marketPlate.x + 50 &&
            y >= marketPlate.y &&
            y <= marketPlate.y + marketPlate.h
          )
            continue;
          // Only the exposed boundary of the canal union gets a quay wall.
          // This removes internal banks at all rectangle/polygon junctions.
          if (
            inWater(x + nx * 3, y + ny * 3) === inWater(x - nx * 3, y - ny * 3)
          )
            continue;
          if (
            scene.bridges.some(
              (b) =>
                x >= b.x - 8 &&
                x <= b.x + b.w + 8 &&
                y >= b.y - 8 &&
                y <= b.y + b.h + 8,
            )
          )
            continue;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.atan2(by - ay, bx - ax));
          ctx.fillStyle = j % 2 ? "#baaf95" : "#ccc1a4";
          ctx.strokeStyle = "#837f6c";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-d / n / 2, -8, d / n, 16, 3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }
  if (scene.marketPlate && market?.complete && market.naturalWidth) {
    const p = scene.marketPlate;
    ctx.drawImage(market, p.x, p.y, p.w, p.h);
  }
  ctx.save();
  for (const bridge of scene.bridges || []) {
    const b = bridge;
    if (bridges?.complete && bridges.naturalWidth) {
      const plate = scene.marketPlate;
      const deck =
        b.id === "market-west-bridge" && plate
          ? { image: market, y: plate.y, scale: plate.w / 1536 }
          : null;
      const art = bridgeArt(bridges, b, deck);
      ctx.drawImage(art.canvas, b.x - art.pad, b.y - art.pad);
      continue;
    }
    ctx.fillStyle = "#2d50464d";
    ctx.fillRect(b.x + 7, b.y + 10, b.w, b.h);
    ctx.fillStyle = paving;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "#877e69";
    ctx.lineWidth = 9;
    ctx.beginPath();
    if (b.axis === "x") {
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.w, b.y);
      ctx.moveTo(b.x, b.y + b.h);
      ctx.lineTo(b.x + b.w, b.y + b.h);
    } else {
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x, b.y + b.h);
      ctx.moveTo(b.x + b.w, b.y);
      ctx.lineTo(b.x + b.w, b.y + b.h);
    }
    ctx.stroke();
    ctx.strokeStyle = "#e8d8b6";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "#9d947e77";
    ctx.lineWidth = 1;
    for (let j = 20; j < (b.axis === "x" ? b.w : b.h); j += 24) {
      ctx.beginPath();
      if (b.axis === "x") {
        ctx.moveTo(b.x + j, b.y + 8);
        ctx.lineTo(b.x + j, b.y + b.h - 8);
      } else {
        ctx.moveTo(b.x + 8, b.y + j);
        ctx.lineTo(b.x + b.w - 8, b.y + j);
      }
      ctx.stroke();
    }
    // Continuous masonry parapets share one material from landing to landing.
    // Each bridge is a single object, so there is no plate-edge clipping here.
    for (const side of [0, 1]) {
      if (b.axis === "x") {
        const y = b.y + b.h * side;
        ctx.fillStyle = "#a69a82";
        ctx.fillRect(b.x, y - 23, b.w, 23);
        ctx.fillStyle = "#d8ccb0";
        ctx.fillRect(b.x, y - 29, b.w, 8);
        ctx.strokeStyle = "#837863";
        ctx.lineWidth = 1;
        for (let x = b.x + 30; x < b.x + b.w; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, y - 21);
          ctx.lineTo(x, y - 2);
          ctx.stroke();
        }
      } else {
        const x = b.x + b.w * side;
        ctx.fillStyle = "#a69a82";
        ctx.fillRect(x - 8, b.y - 23, 16, b.h + 23);
        ctx.fillStyle = "#d8ccb0";
        ctx.fillRect(x - 8, b.y - 29, 8, b.h + 29);
        ctx.strokeStyle = "#837863";
        ctx.lineWidth = 1;
        for (let y = b.y; y < b.y + b.h; y += 30) {
          ctx.beginPath();
          ctx.moveTo(x - 8, y);
          ctx.lineTo(x + 8, y);
          ctx.stroke();
        }
      }
    }
    // Granite parapet posts, set outside the traversable bridge center.
    for (const fraction of [0, 0.33, 0.67, 1]) {
      for (const side of [0, 1]) {
        const x = b.x + (b.axis === "x" ? b.w * fraction : b.w * side);
        const y = b.y + (b.axis === "x" ? b.h * side : b.h * fraction);
        ctx.fillStyle = "#665e4e3b";
        ctx.fillRect(x - 6, y - 12, 21, 23);
        ctx.fillStyle = "#a89d85";
        ctx.fillRect(x - 9, y - 34, 18, 36);
        ctx.fillStyle = "#d8ccb0";
        ctx.strokeStyle = "#a19479";
        ctx.beginPath();
        ctx.roundRect(x - 12, y - 39, 24, 11, 3);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  ctx.restore();
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
