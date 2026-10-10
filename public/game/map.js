import { draw, prepareArt } from "./render.js";

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const districtNames = [
  "Riverside homes",
  "博物馆和花园",
  "Canal market",
  "小湖花园",
  "Lantern quay",
];

export function mapMarkup(scene, stops) {
  return `<div class="map-atlas">
    <p class="map-caption" lang="en">Explore the layout of ${escape(scene.title)}. Select a location below to highlight it on the map, or a map marker to find its button. Hear its Chinese name and see its meaning. Select a section for a closer look.</p>
    ${scene.districts?.length ? `<label lang="en" for="map-section">View a section</label><select id="map-section"><option value="">Whole town</option>${scene.districts.map((d, i) => `<option value="${i}">${escape(districtNames[i] || d.name)}</option>`).join("")}</select>` : ""}
    <div class="map-picture"><canvas id="district-map" class="district-map" role="img" aria-label="Detailed map of ${escape(scene.title)} showing buildings, paths, water and main destinations"></canvas><div class="map-markers"></div></div>
    <p class="map-legend" lang="en"><span class="map-you-key"></span> You are here </p>
    <p id="map-status" role="status" lang="en">Loading map artwork…</p>
    <div class="map-stops">${stops.map((o) => `<button data-map-stop="${escape(o.id)}" aria-pressed="false">${escape(o.name)}</button>`).join("")}</div>
  </div>`;
}

export function mountMap(world, state, stops, showWord) {
  const root = document.querySelector(".map-atlas");
  const canvas = root.querySelector("canvas");
  const markers = root.querySelector(".map-markers");
  const status = root.querySelector("#map-status");
  const panel = root.closest("dialog");
  let loaded = false;
  let selectedStop = null;
  let wordTimer;
  let wordAnchor = null;
  const showSelectionWord = () => {
    clearTimeout(wordTimer);
    if (!wordAnchor) return;
    // Wait for the slide to settle before positioning the word callout.
    wordTimer = setTimeout(() => {
      if (root.isConnected && wordAnchor?.isConnected)
        showWord?.(stops.find((s) => s.id === selectedStop).name, wordAnchor);
      wordAnchor = null;
    }, 150);
  };
  panel.addEventListener("scroll", showSelectionWord);
  const paint = () => {
    if (!root.isConnected || !loaded) return;
    const selected = root.querySelector("#map-section")?.value;
    root.classList.toggle("map-overview", !selected && !!world.scene.districts?.length);
    const scene = world.scene;
    const area = selected
      ? scene.districts[Number(selected)]
      : { x: 0, y: 0, w: scene.width, h: scene.height };
    canvas.parentElement.style.aspectRatio = `${area.w} / ${area.h}`;
    const camera = draw(
      canvas.getContext("2d"),
      canvas,
      scene,
      world.player,
      world.panda,
      {
        overview: area,
        settings: { ...state.settings, motion: false },
        adventure: state.adventure,
        found: state.found,
        guest: world.guest,
        hungryGuest: world.hungryGuest,
        seat: world.seat,
      },
    );
    const position = (element, point) => {
      const x = (point.x - camera.camX + camera.ox) * camera.scale;
      const y = (point.y - camera.camY + camera.oy) * camera.scale;
      const halfW = element.offsetWidth / 2 + 2, halfH = element.offsetHeight / 2 + 2;
      element.style.left = `${Math.max(halfW, Math.min(canvas.clientWidth - halfW, x))}px`;
      element.style.top = `${Math.max(halfH, Math.min(canvas.clientHeight - halfH, y))}px`;
    };
    const inside = (p) =>
      p.x >= area.x &&
      p.y >= area.y &&
      p.x <= area.x + area.w &&
      p.y <= area.y + area.h;
    markers.innerHTML =
      stops
        .map((o, i) =>
          inside(o)
            ? `<button class="map-pin${o.id === selectedStop ? " is-selected" : ""}" data-map-stop="${escape(o.id)}" aria-pressed="${o.id === selectedStop}" aria-label="${escape(o.name)}" title="${escape(o.name)}">${escape(o.name)}</button>`
            : "",
        )
        .join("") +
      (inside(world.player)
        ? `<span class="map-you" title="You are here" aria-label="You are here"></span>`
        : "");
    for (const pin of markers.querySelectorAll(".map-pin")) {
      position(
        pin,
        stops.find((stop) => stop.id === pin.dataset.mapStop),
      );
    }
    const playerPin = markers.querySelector(".map-you");
    if (playerPin) position(playerPin, world.player);
    for (const button of root.querySelectorAll(".map-stops button")) {
      const active = button.dataset.mapStop === selectedStop;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
      button.hidden = !inside(
        stops.find((s) => s.id === button.dataset.mapStop),
      );
    }
    status.textContent = "";
  };
  root.onclick = (event) => {
    const button = event.target.closest("[data-map-stop]");
    if (!button) return;
    selectedStop = button.dataset.mapStop;
    const fromMarker = button.classList.contains("map-pin");
    paint();
    const target = [...root.querySelectorAll(fromMarker ? ".map-stops button" : ".map-pin")]
      .find((el) => el.dataset.mapStop === selectedStop);
    if (!target) return;
    wordAnchor = target;
    const reducedMotion = state.settings.motion === false ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (fromMarker ? target : canvas.parentElement).scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: fromMarker ? "center" : "start",
      inline: "nearest",
    });
    showSelectionWord();
  };
  root.querySelector("#map-section")?.addEventListener("change", () => {
    clearTimeout(wordTimer);
    wordAnchor = null;
    paint();
  });
  const observer = new ResizeObserver(paint);
  observer.observe(canvas);
  // Disconnect when this panel is closed or its content is replaced.
  const cleanup = () => {
    clearTimeout(wordTimer);
    wordAnchor = null;
    panel.removeEventListener("scroll", showSelectionWord);
    observer.disconnect();
    removal.disconnect();
    panel.removeEventListener("close", cleanup);
  };
  const removal = new MutationObserver(() => {
    if (!root.isConnected) cleanup();
  });
  removal.observe(root.parentElement, { childList: true });
  panel.addEventListener("close", cleanup);
  prepareArt(world.scene)
    .then(() => {
      loaded = true;
      paint();
    })
    .catch((error) => {
      console.error("Map artwork failed", error);
      if (root.isConnected)
        status.textContent =
          "Some map artwork could not load. Reopen the map to retry; destinations are still available below.";
    });
}
