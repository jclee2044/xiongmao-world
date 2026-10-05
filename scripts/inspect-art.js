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
    for (const name of ["player-atlas", "mei", "lin", "yun", "momo"]) {
      const img = new Image();
      img.src = `/assets/characters/${name}.webp`;
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
          for (let x = left; x < right; x++) {
            if (pixels[(y * img.width + x) * 4 + 3] > 24) {
              x0 = Math.min(x0, x);
              y0 = Math.min(y0, y);
              x1 = Math.max(x1, x);
              y1 = Math.max(y1, y);
            }
          }
        return {
          x: Math.max(left, x0 - 2),
          y: Math.max(top, y0 - 2),
          w: Math.min(right, x1 + 3) - Math.max(left, x0 - 2),
          h: Math.min(bottom, y1 + 3) - Math.max(top, y0 - 2),
        };
      };
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
          throw new Error(`Expected four atlas rows; found ${rows.length}`);
        output.player = rows.map(([top, bottom]) => [
          bounds(0, top, Math.floor(img.width / 2), bottom),
          bounds(Math.floor(img.width / 2), top, img.width, bottom),
        ]);
      } else output[name] = bounds(0, 0, img.width, img.height);
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
