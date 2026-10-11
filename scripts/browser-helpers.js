import { scenes, interactionPoint } from "../public/game/world.js";
export async function enterWorld(page) {
  await page.locator("#begin").click();
  await page.locator("#world").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.getElementById("world").dataset.artReady === "true",
  );
}
export async function walkToStop(page, id, { sceneId } = {}) {
  const scene = sceneId === undefined
    ? Object.values(scenes).find((s) => s.interactables.some((o) => o.id === id))
    : scenes[sceneId];
  if (!scene) throw new Error(`Unknown map stop: ${id}`);
  if (!scene.interactables.some((o) => o.id === id))
    throw new Error(`Unknown map stop ${id} in scene ${sceneId}`);
  await page.waitForFunction(
    (sceneId) => document.getElementById("world").dataset.scene === sceneId,
    scene.id,
  );
  const destination = interactionPoint(
    scene.interactables.find((o) => o.id === id),
  );
  await page.getByRole("button", { name: "地图", exact: true }).click();
  await page.locator(`[data-map-stop="${id}"]`).last().click();
  await page.waitForFunction(
    ({ x, y }) => {
      const c = document.getElementById("world");
      return (
        c.dataset.routeLength === "0" &&
        Math.hypot(Number(c.dataset.x) - x, Number(c.dataset.y) - y) < 50
      );
    },
    destination,
    { timeout: 45000 },
  );
}
