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

// All 35 stationary NPC placements. Append new neighbors to preserve the
// existing characters' timing and lean directions.
const idleNeighbors = new Map(
  [
    "mei",
    "qiao",
    "lan",
    "an",
    "lian",
    "silk-host",
    "market-cook",
    "clothing-customer",
    "bakery-baker",
    "teahouse-qiao",
    "bookshop-bo",
    "museum-guide",
    "museum-artist",
    "shantang-host",
    "lion-grove-keeper",
    "humble-garden-keeper",
    "tiger-court-keeper",
    "silk-room-host",
    "yun",
    "bo",
    "wei",
    "hao",
    "snack-host",
    "market-baker",
    "clothing-seller",
    "bakery-diner-friend",
    "teahouse-diner",
    "teahouse-reader",
    "bookshop-reader",
    "restaurant-waiter",
    "museum-reader",
    "lion-grove-visitor",
    "humble-garden-visitor",
    "tiger-court-visitor",
    "silk-room-guest",
  ].map((id, index) => {
    const seed = [...id].reduce(
      (value, char) => (value * 31 + char.charCodeAt(0)) >>> 0,
      0,
    );
    return [
      id,
      {
        phase: (seed % 1000) / 100,
        period: 9 + (seed % 5),
        direction: index % 2 ? -1 : 1,
      },
    ];
  }),
);

export function npcIdlePose(actor, time, animate) {
  const idle = idleNeighbors.get(actor.id);
  if (!idle || !animate || actor.moving || actor.seated || actor.painted)
    return { sway: 0, settle: 0 };
  const phase = (time + idle.phase) % idle.period;
  // Ease into a weight shift, pause, then settle. Both gestures return to
  // neutral with zero velocity; the feet and interaction point stay planted.
  const pulse = (start, duration) => {
    const progress = (phase - start) / duration;
    return progress > 0 && progress < 1 ? Math.sin(progress * Math.PI) ** 2 : 0;
  };
  return {
    sway: idle.direction * 0.014 * pulse(0, 3.2),
    settle: 0.009 * pulse(4.5, 2.2),
  };
}

// Hold briefly at each end of the work stroke, then return through the
// intermediate pose. Each worker has a different phase in the two-second loop.
export function gardenWorkFrame(actor, time, animate) {
  if (!animate) return 0;
  const phase = [...actor.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8;
  return [0, 0, 1, 2, 2, 3, 0, 0][(Math.floor(time * 4) + phase) % 8];
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
