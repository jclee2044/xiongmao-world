// Additive save migration: historical XP is never recomputed or removed.
export const newRewards = () => ({ claims: {}, encounters: {}, platformXP: 0 });
export function validateRewards(value = newRewards()) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      !Number.isSafeInteger(value.platformXP) || value.platformXP < 0 || value.platformXP > 1000000)
    throw Error("Invalid rewards.");
  const clean = newRewards();
  clean.platformXP = value.platformXP;
  for (const field of ["claims", "encounters"]) {
    const entries = value[field];
    if (!entries || typeof entries !== "object" || Array.isArray(entries) || Object.keys(entries).length > 100000)
      throw Error("Invalid reward ledger.");
    for (const [key, count] of Object.entries(entries)) {
      if (!/^[a-zA-Z0-9:_-]{1,180}$/.test(key) || ["__proto__", "constructor", "prototype"].includes(key) ||
          !Number.isSafeInteger(count) || count < 0 || count > 1000000) throw Error("Invalid reward entry.");
      clean[field][key] = count;
    }
  }
  return clean;
}
export function mergeRewards(a, b) {
  const merged = newRewards();
  merged.platformXP = Math.max(a.platformXP, b.platformXP);
  for (const field of ["claims", "encounters"])
    for (const key of new Set([...Object.keys(a[field]), ...Object.keys(b[field])]))
      merged[field][key] = Math.max(a[field][key] || 0, b[field][key] || 0);
  return merged;
}
