import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const store = new Store(":memory:");
const server = createApp({ store, providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
const table = scenes.shanghai.interactables.find((o) => o.id === "tea-table");
const guest = { x: table.x - 108, y: table.y + 6 };

try {
  for (const mobile of [false, true]) {
    for (const distance of [75, 200]) {
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1280, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        serviceWorkers: "block",
      });
      try {
        const remote = await (
          await context.request.get(base + "/api/state")
        ).json();
        const state = newState();
        state.position = { x: guest.x + distance, y: guest.y };
        state.adventure.tea = mobile ? "done" : "seated";
        Object.assign(state.settings, {
          voice: false,
          music: 0,
          ambience: 0,
          motion: false,
        });
        const save = await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: remote.revision, state },
        });
        assert.equal(save.status(), 200);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(base);
        await enterWorld(page);
        const point = await page.locator("#world").evaluate((canvas, guest) => {
          const d = canvas.dataset,
            r = canvas.getBoundingClientRect();
          window.teaApproachPositions = [];
          const sample = () => {
            window.teaApproachPositions.push({
              x: Number(d.x),
              y: Number(d.y),
            });
            if (d.paused !== "true") requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
          return {
            x:
              r.left +
              (guest.x - Number(d.camX) + Number(d.ox)) * Number(d.scale),
            y:
              r.top +
              (guest.y - 60 - Number(d.camY) + Number(d.oy)) * Number(d.scale),
          };
        }, guest);
        if (mobile) await page.touchscreen.tap(point.x, point.y);
        else await page.mouse.click(point.x, point.y);
        await page.locator("#conversation[open]").waitFor({ timeout: 5000 });
        assert.equal(await page.locator("#npc-name").textContent(), "小乔");
        const positions = await page.evaluate(
          () => window.teaApproachPositions,
        );
        const end = await page
          .locator("#world")
          .evaluate((c) => ({
            x: Number(c.dataset.x),
            y: Number(c.dataset.y),
          }));
        if (distance === 75) {
          assert.ok(
            Math.hypot(end.x - state.position.x, end.y - state.position.y) < 8,
            "clicking nearby seated Qiao opens dialogue immediately",
          );
        } else {
          assert.ok(
            Math.max(...positions.map((p) => p.x)) < state.position.x + 16,
            "the approach must not detour right to the old shop location",
          );
          assert.ok(
            end.x < state.position.x - 100,
            "the player walks left toward Qiao's chair",
          );
          assert.ok(Math.hypot(end.x - guest.x, end.y - guest.y) < 72);
        }
        assert.deepEqual(errors, []);
        console.log(
          `${mobile ? "Touch" : "Mouse"}: seated Qiao at ${distance}px opens at her current chair.`,
        );
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
