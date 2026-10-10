import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
const npc = scenes.shanghai.interactables.find((o) => o.id === "bo");
try {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1280, height: 900 },
  ]) {
    const mobile = viewport.width !== 1280;
    const context = await browser.newContext({
      viewport,
      isMobile: mobile,
      hasTouch: mobile,
      serviceWorkers: "block",
    });
    try {
      const remote = await (
        await context.request.get(base + "/api/state")
      ).json();
      const state = newState();
      state.position = { x: npc.x, y: npc.y + 170 };
      Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
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
      const cdp = await context.newCDPSession(page);
      const touch = async (type, y) => {
        const point =
          y === undefined
            ? null
            : await page.locator("#world").evaluate(
                (canvas, point) => {
                  const d = canvas.dataset,
                    r = canvas.getBoundingClientRect();
                  return {
                    x:
                      r.left +
                      (point.x - Number(d.camX) + Number(d.ox)) *
                        Number(d.scale),
                    y:
                      r.top +
                      (point.y - Number(d.camY) + Number(d.oy)) *
                        Number(d.scale),
                  };
                },
                { x: npc.x, y },
              );
        await cdp.send("Input.dispatchTouchEvent", {
          type,
          touchPoints: point ? [{ ...point, id: 1 }] : [],
        });
      };
      if (mobile) await touch("touchStart", npc.y + 40);
      else await page.keyboard.down("ArrowUp");
      try {
        await page.waitForFunction(
          (y) => Number(document.querySelector("#world").dataset.y) < y + 70,
          npc.y,
          { timeout: 5000 },
        );
      } catch (error) {
        assert.deepEqual(
          errors,
          [],
          "Approaching an NPC must not stop the game loop",
        );
        throw error;
      }
      if (mobile) await touch("touchMove", npc.y + 170);
      else {
        await page.keyboard.up("ArrowUp");
        await page.keyboard.down("ArrowDown");
      }
      await page.waitForFunction(
        (y) => Number(document.querySelector("#world").dataset.y) > y + 130,
        npc.y,
        { timeout: 5000 },
      );
      if (mobile) await touch("touchEnd");
      else await page.keyboard.up("ArrowDown");
      assert.deepEqual(errors, []);
      console.log(
        `Walking toward and away from an NPC passes at ${viewport.width} × ${viewport.height}.`,
      );
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
