import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3210");
  for (const size of [192, 512]) {
    const data = await page.evaluate(async (size) => {
      const img = new Image();
      img.src = "/assets/panda.png";
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f5efdf";
      ctx.fillRect(0, 0, size, size);
      const height = size * 0.7,
        width = (height * img.width) / img.height;
      ctx.drawImage(
        img,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height,
      );
      return canvas.toDataURL("image/png").split(",")[1];
    }, size);
    await writeFile(
      `public/assets/icon-${size}.png`,
      Buffer.from(data, "base64"),
    );
  }
  console.log("PWA icon sizes prepared from the supplied Panda sprite.");
} finally {
  await browser.close();
}
