// Ordered object graph: preserve missing/undefined, special numbers and aliases.
export function encode(value, seen = new Map()) {
  if (value === undefined) return ["undefined"];
  if (typeof value === "number" && (!Number.isFinite(value) || Object.is(value, -0))) return ["number", Object.is(value, -0) ? "-0" : String(value)];
  if (typeof value === "function") return ["function", value.toString()];
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return ["ref", seen.get(value)];
  const id = seen.size; seen.set(value, id);
  return [Array.isArray(value) ? "array" : "object", id,
    Object.keys(value).map((key) => [key, encode(value[key], seen)])];
}
