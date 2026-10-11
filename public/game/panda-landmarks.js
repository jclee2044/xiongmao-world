import { pandaAreas, landmarkAreas, withinArea } from "../data/panda-areas.js";

export function createLandmarkPanda({
  generate,
  show,
  hide,
  random = Math.random,
  getFound = () => false,
  getBoatVisited = () => false,
  onBoatVisit = () => {},
  getPandaMoments = () => [],
  onPandaMoment = () => {},
  getStationJourney = () => ({}),
  getCompletedPractice = () => [],
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
    const areas = landmarkAreas(scene, getCompletedPractice(), getStationJourney()).filter(a =>
      a.id === "stuffie" ? !getFound("momo") :
      ["fox-plush", "rabbit-plush"].includes(a.id) ? !getFound(a.id) : true);
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
    // Record the first entry even if dialogue is disabled or the random roll
    // stays quiet. Later visits must never introduce the boat again.
    if (fresh.includes("boat")) {
      if (getBoatVisited()) fresh.splice(fresh.indexOf("boat"), 1);
      else {
        onBoatVisit();
      }
      entered.add("boat");
    }
    const dialogueId = (id) => {
      const first = pandaAreas[id].firstVisit;
      return first && !getPandaMoments().includes(first) ? first : id;
    };
    // Arrival regions wait for the scene/panel to finish before consuming an
    // entry, including the ambient dialogue on later boat trips.
    fresh.filter(id => enabled || (!pandaAreas[dialogueId(id)].always && !pandaAreas[id].firstVisit))
      .forEach((id) => entered.add(id));
    if (!enabled) {
      cancel();
      return;
    }
    // Crossing into the other pond half gets its own roll even within the
    // previous half's exit margin; returning across the boundary does not reroll.
    if (active && fresh.length && !areas.some(a => a.id === active && withinArea(a, point))) cancel();
    // One roll per entry, never per frame. Overlapping areas cannot stack bubbles.
    const id = fresh.find(id => pandaAreas[dialogueId(id)].always) || fresh[0];
    if (!id) return;
    const replyId = dialogueId(id);
    const area = pandaAreas[replyId];
    const guaranteed = area.always === true;
    if (guaranteed && active) cancel();
    if (active || (!guaranteed && random() >= 1 / 2)) return;
    const examples = area.examples;
    const fallback = examples[Math.floor(random() * examples.length)];
    active = id;
    const token = ++generation;
    if (area.storedOnly || random() < 0.5) {
      show(fallback);
      if (replyId !== id) onPandaMoment(replyId);
      return;
    }
    // The discovery hint appears immediately even while a new variation loads.
    if (guaranteed) show(fallback);
    const requestController = new AbortController();
    controller = requestController;
    const timeout = setTimeout(() => requestController.abort(), 6000);
    Promise.resolve()
      .then(() => generate(replyId, requestController.signal))
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
