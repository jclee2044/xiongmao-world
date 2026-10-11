import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

await mkdir("test-results/station-departure", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
      serviceWorkers: "block",
    });
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    state.scene = "shantang";
    state.position = interactionPoint(
      scenes.shantang.interactables.find((o) => o.id === "station-traveler"),
    );
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      motion: !mobile,
    });
    assert.equal(
      (
        await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: remote.revision, state },
        })
      ).status(),
      200,
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/dialogue-variation", (route) =>
      route.fulfill({ json: route.request().postDataJSON().line }),
    );
    await page.goto(base);
    await enterWorld(page);
    await page.locator("#world").focus();
    await page.keyboard.press("e");
    await page.locator("#conversation").waitFor({ state: "visible" });
    await page.locator("#reply").fill("去车站要过桥吗？");
    await page.locator("#send").click();
    await page.waitForFunction(() => !document.querySelector("#send").disabled);
    assert.equal(
      await page.locator("#world").getAttribute("data-station-traveler-status"),
      "new",
    );
    await page
      .locator("#reply")
      .fill(
        mobile
          ? "Cross the bridge, then turn right."
          : "过桥以后，往右边走。售票处在门里左边。",
      );
    await page.locator("#send").click();
    await page
      .locator("#station-departure-close")
      .waitFor({ state: "visible" });
    assert.match(await page.locator("#npc-zh").innerText(), /谢谢.*再见/);
    await page.waitForFunction(
      () =>
        document.querySelector("#world").dataset.stationTravelerStatus ===
        "walking",
    );
    const distance = Number(
      await page
        .locator("#world")
        .getAttribute("data-station-traveler-distance"),
    );
    assert.equal(distance, 0, "wait for the learner to close the chat");
    await page.screenshot({
      path: `test-results/station-departure/${mobile ? "phone" : "desktop"}-goodbye.png`,
    });
    await page.locator("#station-departure-close").click();
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector("#world").dataset.stationTravelerDistance,
        ) > 250,
    );
    await page.screenshot({
      path: `test-results/station-departure/${mobile ? "phone" : "desktop"}-walking.png`,
    });
    if (mobile) {
      // Reduced motion freezes the gait, not essential travel. Reload midway
      // and check that the persisted journey continues away from the quay.
      await page.reload();
      await enterWorld(page);
      await page.waitForFunction(
        () =>
          Number(
            document.querySelector("#world").dataset.stationTravelerDistance,
          ) > 145,
      );
    }
    await page.waitForFunction(
      () =>
        document.querySelector("#world").dataset.stationTravelerStatus ===
        "entered",
      null,
      { timeout: 25000 },
    );
    assert.equal(
      await page.locator("#world").getAttribute("data-station-traveler-x"),
      "",
    );
    const cache = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("panda-world-v1")),
    );
    assert.equal(cache.state.adventure.stationTraveler, "entered");
    assert.ok(
      cache.state.journal.some((entry) =>
        entry.includes("Xiaocheng followed your directions"),
      ),
    );
    await page.reload();
    await enterWorld(page);
    await page.locator("#world").focus();
    await page.keyboard.press("e");
    assert.equal(
      await page.locator("#conversation").isVisible(),
      false,
      "no invisible NPC at his old position",
    );
    assert.equal(
      await page.locator("#world").getAttribute("data-station-traveler-status"),
      "entered",
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `${mobile ? "Phone/reduced motion" : "Desktop"}: directions, goodbye, walking, saved arrival and absent interaction pass.`,
    );
  }

  // Inspect actual renderer poses at the bridge and doorway, in addition to
  // following the live controller above. This doesn't alter a learner save.
  const page = await browser.newPage({
    viewport: { width: 1100, height: 820 },
  });
  await page.goto(base);
  await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { scenes } = await import("/game/world.js");
    const { stationDepartureRoute, stationDeparturePose } =
      await import("/game/station-departure.js");
    await prepareArt(scenes.shantang);
    document.body.innerHTML =
      '<canvas id="qa" style="width:1100px;height:820px;position:fixed;inset:0"></canvas>';
    window.qa = {
      draw,
      scene: scenes.shantang,
      route: stationDepartureRoute(scenes.shantang),
      pose: stationDeparturePose,
    };
  });
  for (const [name, progress] of [
    ["bridge", 0.22],
    ["plaza", 0.65],
    ["doorway", 0.975],
  ]) {
    const result = await page.evaluate((progress) => {
      const { draw, scene, route, pose } = window.qa;
      const actor = pose(scene, route.length * progress);
      const canvas = document.querySelector("#qa"),
        ctx = canvas.getContext("2d");
      const drawn = [];
      const original = ctx.drawImage;
      ctx.drawImage = function (image, ...args) {
        if (image.src?.includes("xiaocheng-walk")) drawn.push(args.slice(0, 4));
        return original.call(this, image, ...args);
      };
      draw(
        ctx,
        canvas,
        scene,
        { x: actor.x - 130, y: actor.y + 100 },
        { x: actor.x - 180, y: actor.y + 125 },
        {
          settings: { motion: true },
          animate: true,
          stationTraveler: actor,
          adventure: { stationTraveler: "walking" },
          time: 3,
        },
      );
      ctx.drawImage = original;
      return { drawn, opacity: actor.opacity, direction: actor.walkDirection };
    }, progress);
    // Actor masks may draw onto their own canvas at some positions.
    if (name === "doorway") assert.ok(result.drawn.length);
    await page.screenshot({
      path: `test-results/station-departure/${name}.png`,
    });
  }
  await page.close();
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
