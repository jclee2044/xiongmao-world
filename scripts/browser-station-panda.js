import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { pandaAreas, landmarkAreas } from "../public/data/panda-areas.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--mute-audio"] });
try {
  for (const [sceneId, areaId] of [["station-ticketing", "station-guide-ticket"], ["station-waiting", "station-panda-cafe"]]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    state.scene = sceneId;
    if (sceneId === "station-waiting") state.adventure.stationJourney = { booked: true, entry: "ready", revision: 5 };
    const area = landmarkAreas(scenes[sceneId]).find(a => a.id === areaId);
    state.position = sceneId === "station-ticketing" ? scenes[sceneId].spawn : { x: area.x, y: area.y };
    Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
    const saved = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    assert.equal(saved.status(), 200);
    const page = await context.newPage(), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto(base);
    await enterWorld(page);
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(200);
    await page.keyboard.up("ArrowRight");
    await page.locator("#panda-speech").waitFor({ state: "visible" });
    const message = await page.locator("#panda-message").textContent();
    assert.ok(pandaAreas[areaId].examples.includes(message), `${sceneId}: ${message}`);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Panda gives floor-one guidance and floor-two environmental comments in the browser.");
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
