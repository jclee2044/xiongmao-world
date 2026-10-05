import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
try {
  const page = await browser.newPage({ serviceWorkers: "block" });
  await page.goto("http://127.0.0.1:3210");
  const metadata = await page.evaluate(async () => {
    const output = {};
    const files = [
      "player-atlas",
      "mei",
      "lin",
      "yun",
      "momo",
      "neighbors",
      "player-walk",
      "props",
      "storefronts",
      "landmarks",
      "animals",
    ];
    for (const name of files) {
      const img = new Image();
      img.src = `/assets/${["props", "storefronts", "landmarks"].includes(name) ? "world" : "characters"}/${name}.webp`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const bounds = (left, top, right, bottom) => {
        let x0 = right,
          y0 = bottom,
          x1 = left,
          y1 = top;
        for (let y = top; y < bottom; y++)
          for (let x = left; x < right; x++)
            if (pixels[(y * img.width + x) * 4 + 3] > 24) {
              x0 = Math.min(x0, x);
              y0 = Math.min(y0, y);
              x1 = Math.max(x1, x);
              y1 = Math.max(y1, y);
            }
        if (x0 >= x1 || y0 >= y1)
          throw new Error(`Empty sprite cell: ${name} ${left},${top}`);
        return {
          x: Math.max(left, x0 - 2),
          y: Math.max(top, y0 - 2),
          w: Math.min(right, x1 + 3) - Math.max(left, x0 - 2),
          h: Math.min(bottom, y1 + 3) - Math.max(top, y0 - 2),
        };
      };
      const grid = (cols, rows) =>
        Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) =>
            bounds(
              Math.floor((img.width * col) / cols),
              Math.floor((img.height * row) / rows),
              Math.floor((img.width * (col + 1)) / cols),
              Math.floor((img.height * (row + 1)) / rows),
            ),
          ),
        );
      if (name === "player-atlas") {
        const rows = [];
        let start = null;
        for (let y = 0; y < img.height; y++) {
          let count = 0;
          for (let x = 0; x < img.width; x++)
            if (pixels[(y * img.width + x) * 4 + 3] > 24) count++;
          if (count > 8 && start === null) start = y;
          if ((count <= 8 || y === img.height - 1) && start !== null) {
            if (y - start > 50)
              rows.push([Math.max(0, start - 3), Math.min(img.height, y + 3)]);
            start = null;
          }
        }
        if (rows.length !== 4)
          throw new Error(`Expected 4 appearance rows: ${rows.length}`);
        output.player = rows.map(([top, bottom]) => [
          bounds(0, top, Math.floor(img.width / 2), bottom),
          bounds(Math.floor(img.width / 2), top, img.width, bottom),
        ]);
      } else if (name === "player-walk") output.walk = grid(3, 8);
      else if (name === "neighbors")
        output.neighbors = Object.fromEntries(
          ["qiao", "bo", "lan", "wei", "an", "hao"].map((id, i) => [
            id,
            grid(3, 2).flat()[i],
          ]),
        );
      else if (name === "props")
        output.props = Object.fromEntries(
          ["market", "bench", "planter", "sign", "well", "tea-table"].map(
            (id, i) => [id, grid(3, 2).flat()[i]],
          ),
        );
      else if (name === "storefronts")
        output.storefronts = Object.fromEntries(
          [
            "bakery",
            "dumpling",
            "bookshop",
            "tea-house",
            "flower-stall",
            "pavilion",
          ].map((id, i) => [id, grid(3, 2).flat()[i]]),
        );
      else if (name === "landmarks")
        output.landmarks = Object.fromEntries(
          [
            "pagoda",
            "moon-gate",
            "rockery",
            "museum",
            "bamboo",
            "lotus-bank",
          ].map((id, i) => [id, grid(3, 2).flat()[i]]),
        );
      else if (name === "animals")
        output.animals = Object.fromEntries(
          ["cat", "duck", "rabbit", "bird"].map((id, i) => [id, grid(3, 4)[i]]),
        );
      else output[name] = bounds(0, 0, img.width, img.height);
    }
    return output;
  });
  await writeFile(
    "public/data/art-bounds.js",
    "export default " + JSON.stringify(metadata, null, 2) + ";\n",
  );
  console.log(JSON.stringify(metadata));
} finally {
  await browser.close();
}
