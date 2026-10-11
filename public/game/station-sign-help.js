import { WAITING_SCALE } from "../data/station-waiting.js";
import { waitingPhrasesForJourney } from "../data/station-waiting-signs.js";
import { STATION_SCALE } from "../data/station-exterior.js";
import { stationBoardPhrases } from "./station-signs.js";

// The canvas retains the lettering for painted foreground clips. These DOM
// text controls share its geometry, adding selection and keyboard access.
export function createStationSignHelp(canvas, select) {
  const layer = document.createElement("div");
  layer.className = "station-sign-help";
  layer.hidden = true;
  let controls = [], phrases = [], activeKey = null;
  function controlFor(phrase) {
    const control = document.createElement("span");
    control.className = "station-sign-phrase";
    control.dataset.worldSign = phrase.id || phrase.zh;
    control.lang = "zh-CN";
    control.tabIndex = 0;
    control.setAttribute("role", "button");
    control.setAttribute("aria-haspopup", "dialog");
    control.setAttribute("aria-label", `Ask Panda about ${phrase.zh}`);
    control.title = `Ask Panda · ${phrase.zh}`;
    control.textContent = phrase.zh;
    control.style.width = `${phrase.w}px`;
    control.style.height = `${phrase.h}px`;
    if (phrase.floorCorners) control.style.clipPath = `polygon(${phrase.floorCorners.map(([x,y]) => `${x/phrase.w*100}% ${y/phrase.h*100}%`).join(",")})`;
    control.style.fontSize = `${phrase.size}px`;
    if (phrase.id) control.style.fontFamily = phrase.layout === "mural"
      ? '"Station Brush", "Noto Serif CJK SC", serif'
      : '"Station Hand", "Station Brush", "Noto Sans CJK SC", sans-serif';
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
  }
  canvas.after(layer);
  return {
    update(scene, camera, available, journey) {
      const upstairs = scene.id === "station-waiting";
      layer.hidden = !["shantang", "station-waiting"].includes(scene.id) || !camera || !available;
      if (layer.hidden) return;
      const key = `${scene.id}:${upstairs && Boolean(journey?.boarding)}`;
      if (key !== activeKey) {
        activeKey = key;
        phrases = upstairs ? waitingPhrasesForJourney(journey) : stationBoardPhrases;
        layer.replaceChildren();
        controls = phrases.map(controlFor);
      }
      const { scale, camX, camY, ox, oy } = camera;
      const sceneScale = upstairs ? WAITING_SCALE : STATION_SCALE;
      const zoom = sceneScale * scale;
      controls.forEach((control, index) => {
        const phrase = phrases[index];
        const x = canvas.offsetLeft + (phrase.x * sceneScale - camX + ox) * scale;
        const y = canvas.offsetTop + (phrase.y * sceneScale - camY + oy) * scale;
        control.hidden = x + phrase.w * zoom < canvas.offsetLeft || x > canvas.offsetLeft + canvas.clientWidth ||
          y + phrase.h * zoom < canvas.offsetTop || y > canvas.offsetTop + canvas.clientHeight;
        control.style.transform = `matrix(${zoom}, ${phrase.slope * zoom}, 0, ${zoom}, ${x}, ${y})`;
      });
    },
  };
}
