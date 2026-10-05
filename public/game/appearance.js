export const actorSizes = Object.freeze({
  player: 235,
  panda: 105,
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
