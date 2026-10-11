import { STATION_SCALE } from "../data/station-exterior.js";
import { stationBoardPhrases } from "./station-signs.js";

// The canvas retains the lettering for painted foreground clips. These DOM
// text controls share its geometry, adding selection and keyboard access.
export function createStationSignHelp(canvas, select) {
  const layer = document.createElement("div");
  layer.className = "station-sign-help";
  layer.hidden = true;
  const controls = stationBoardPhrases.map(phrase => {
    const control = document.createElement("span");
    control.className = "station-sign-phrase";
    control.dataset.worldSign = "";
    control.lang = "zh-CN";
    control.tabIndex = 0;
    control.setAttribute("role", "button");
    control.setAttribute("aria-haspopup", "dialog");
    control.setAttribute("aria-label", `Ask Panda about ${phrase.zh}`);
    control.title = `Ask Panda · ${phrase.zh}`;
    control.textContent = phrase.zh;
    control.style.width = `${phrase.w}px`;
    control.style.height = `${phrase.h}px`;
    control.style.fontSize = `${phrase.size}px`;
    control.addEventListener("click", () => {
      const selection = window.getSelection();
      if (!selection?.isCollapsed && control.contains(selection?.anchorNode)) return;
      select(phrase);
    });
    control.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      select(phrase);
    });
    layer.append(control);
    return control;
  });
  canvas.after(layer);
  return {
    update(scene, camera, available) {
      layer.hidden = scene.id !== "shantang" || !camera || !available;
      if (layer.hidden) return;
      const { scale, camX, camY, ox, oy } = camera;
      const zoom = STATION_SCALE * scale;
      controls.forEach((control, index) => {
        const phrase = stationBoardPhrases[index];
        const x = canvas.offsetLeft + (phrase.x * STATION_SCALE - camX + ox) * scale;
        const y = canvas.offsetTop + (phrase.y * STATION_SCALE - camY + oy) * scale;
        control.style.transform = `matrix(${zoom}, ${phrase.slope * zoom}, 0, ${zoom}, ${x}, ${y})`;
      });
    },
  };
}
