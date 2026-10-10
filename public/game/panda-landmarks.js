import { pandaAreas, landmarkAreas, withinArea } from "../data/panda-areas.js";

export function createLandmarkPanda({
  generate,
  show,
  hide,
  random = Math.random,
  getFound = () => false,
}) {
  let sceneId,
    entered = new Set(),
    active = null,
    controller = null,
    generation = 0;
  function cancel() {
    generation++;
    controller?.abort();
    controller = null;
    if (active) hide();
    active = null;
  }
  function update(scene, point, enabled = true) {
    if (sceneId !== scene.id) {
      cancel();
      entered.clear();
      sceneId = scene.id;
    }
    const areas = landmarkAreas(scene).filter(a =>
      a.id === "stuffie" ? !getFound("momo") :
      a.id === "fox-plush" ? !getFound("fox-plush") : true);
    for (const id of entered) {
      if (!areas.some((a) => a.id === id && withinArea(a, point, 80))) {
        entered.delete(id);
        if (active === id) cancel();
      }
    }
    const fresh = [
      ...new Set(
        areas
          .filter((a) => withinArea(a, point) && !entered.has(a.id))
          .map((a) => a.id),
      ),
    ];
    fresh.filter(id => enabled || !pandaAreas[id].always).forEach((id) => entered.add(id));
    if (!enabled) {
      cancel();
      return;
    }
    // Crossing into the other pond half gets its own roll even within the
    // previous half's exit margin; returning across the boundary does not reroll.
    if (active && fresh.length && !areas.some(a => a.id === active && withinArea(a, point))) cancel();
    // One roll per entry, never per frame. Overlapping areas cannot stack bubbles.
    const id = fresh.find(id => pandaAreas[id].always) || fresh[0];
    if (!id) return;
    const guaranteed = pandaAreas[id].always === true;
    if (guaranteed && active) cancel();
    if (active || (!guaranteed && random() >= 1 / 2)) return;
    const examples = pandaAreas[id].examples;
    const fallback = examples[Math.floor(random() * examples.length)];
    active = id;
    const token = ++generation;
    if (random() < 0.5) {
      show(fallback);
      return;
    }
    // The discovery hint appears immediately even while a new variation loads.
    if (guaranteed) show(fallback);
    const requestController = new AbortController();
    controller = requestController;
    const timeout = setTimeout(() => requestController.abort(), 6000);
    Promise.resolve()
      .then(() => generate(id, requestController.signal))
      .then((result) => {
        if (token === generation) show(result?.chinese || fallback);
      })
      .catch(() => {
        if (token === generation) show(fallback);
      })
      .finally(() => clearTimeout(timeout));
  }
  return { update, cancel };
}
