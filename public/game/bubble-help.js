// Mirror every rendered speech bubble with word-help controls. The shared word
// annotator supplies segmentation, contextual pinyin, definitions and audio.
export function createBubbleHelp(canvas, stopMovement) {
  const layer = document.createElement("div");
  layer.className = "bubble-help";
  canvas.after(layer);
  let controls = [];
  layer.addEventListener("pointerdown", stopMovement);
  layer.addEventListener("focusin", stopMovement);
  return {
    get reading() {
      return layer.matches(":hover") || layer.contains(document.activeElement) ||
        Boolean(document.querySelector("#word-callout:popover-open"));
    },
    update(bubbles, available) {
      layer.hidden = !available;
      if (!available) bubbles = [];
      while (controls.length > bubbles.length) controls.pop().remove();
      bubbles.forEach((bubble, index) => {
        let control = controls[index];
        if (!control) {
          control = document.createElement("span");
          control.className = "bubble-help-text";
          control.lang = "zh-CN";
          layer.append(control);
          controls.push(control);
        }
        if (control.dataset.text !== bubble.text) {
          control.dataset.text = bubble.text;
          control.textContent = bubble.text;
        }
        const x = canvas.offsetLeft + bubble.x;
        const y = canvas.offsetTop + bubble.y;
        control.hidden = bubble.x + bubble.width * bubble.scale < 0 ||
          bubble.x > canvas.clientWidth || bubble.y + 34 * bubble.scale < 0 ||
          bubble.y > canvas.clientHeight;
        control.style.width = `${bubble.width}px`;
        control.style.transform = `translate(${x}px, ${y}px) scale(${bubble.scale})`;
      });
    },
  };
}
