// Long relaxed holds, then a short look/nod or passport-check sequence.
// Stable per-actor offsets keep colleagues from moving in unison.
export function stationEmployeeFrame(actor, time, motion = true) {
  if (!motion) return 0;
  let seed = 0;
  for (const char of actor.id || actor.appearance || "staff")
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const period = 7 + (seed % 5) * 0.6;
  const phase = ((time + (seed % 997) / 97) % period + period) % period;
  if (phase < period - 2.4) return 0;
  if (phase < period - 1.5) return 1;
  if (phase < period - 0.9) return 2;
  return 1;
}
