import { createServer, request } from "node:http";
import { chromium } from "playwright";
import assert from "node:assert/strict";

// Emulate the desktop preview: preserve its Host and Origin while forwarding.
const proxy = createServer((req, res) => {
  const upstream = request(
    {
      hostname: "127.0.0.1",
      port: 3210,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (reply) => {
      res.writeHead(reply.statusCode, reply.headers);
      reply.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.writeHead(502);
    res.end();
  });
  req.pipe(upstream);
});
await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--mute-audio"],
  });
  const page = await browser.newPage({ serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`http://localhost:${proxy.address().port}`);
  assert.equal(response.status(), 200);
  await page.getByRole("button", { name: "和熊猫一起走走" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await page.locator('[data-setting="pinyin"]').selectOption("false");
  await page.waitForFunction(
    () =>
      document.getElementById("save-status").textContent === "日记存好了",
  );
  assert.equal(
    await page.evaluate(
      async () =>
        (await (await fetch("/api/state")).json()).state.settings.pinyin,
    ),
    false,
  );
  await page.reload();
  await page.getByRole("button", { name: "和熊猫一起走走" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "设置", exact: true }).click();
  assert.equal(
    await page.locator('[data-setting="pinyin"]').inputValue(),
    "false",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Forwarded localhost preview loads, creates a session, saves settings, and restores them after reload.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => proxy.close(resolve));
}
