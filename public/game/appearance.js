export const actorSizes = Object.freeze({
  player: 170,
  panda: 90,
  momo: 70,
  mei: 175,
  lin: 260,
  yun: 230,
  qiao: 245,
  bo: 255,
  lan: 235,
  wei: 255,
  an: 230,
  hao: 245,
});
export const outfitColors = ["#b4a6c3", "#899b7c", "#d3a890", "#8ca6a2"];
export function appearanceRow(settings) {
  return Math.max(0, outfitColors.indexOf(settings.outfit));
}
export function walkFrame(distance) {
  return [0, 1, 2, 1][Math.floor(distance / 27) % 4];
}

// All player poses start with the same lavender outfit. Keep its painted
// highlights and shadows, but use one palette for walking, resting and sitting.
export function recolorOutfitPixels(data, color) {
  const target = outfitColors.includes(color) ? color : outfitColors[0];
  const rgb = target.match(/[a-f0-9]{2}/gi).map((v) => parseInt(v, 16));
  const garment = [];
  let luminance = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i + 3] > 80 &&
      data[i] > data[i + 1] + 5 &&
      data[i + 2] > data[i + 1] + 4 &&
      data[i] - data[i + 2] < 32
    ) {
      garment.push(i);
      luminance += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
  }
  if (!garment.length) return data;
  const center = luminance / garment.length;
  for (const i of garment) {
    const shade = (data[i] + data[i + 1] + data[i + 2]) / (3 * center);
    for (let channel = 0; channel < 3; channel++)
      data[i + channel] = Math.min(255, rgb[channel] * shade);
  }
  return data;
}

export function lianPose({
  seated = false,
  moving = false,
  distance = 0,
} = {}) {
  const frame = seated ? 5 : moving ? 1 + (Math.floor(distance / 18) % 4) : 0;
  return { col: frame % 3, row: Math.floor(frame / 3) };
}
