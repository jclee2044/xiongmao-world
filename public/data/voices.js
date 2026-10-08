// Keep the approved two-voice cast available without changing saves or assets.
// Set false for an immediate rollback; both browser and server use this switch.
export const CHARACTER_VOICES_ENABLED = true;
export const voiceProfiles = Object.freeze({
  "young-female": { gender: "female", model: "aishell3", speaker: "SSB0005", sid: 0 },
  "young-male": { gender: "male", model: "aishell3", speaker: "SSB0966", sid: 107 },
  "older-female": { gender: "female", model: "aishell3", speaker: "SSB0354", sid: 38 },
  "older-male": { gender: "male", model: "wnj", speaker: "WNJ", sid: 0 },
});

export function normalizeVoice(voice, enabled = CHARACTER_VOICES_ENABLED) {
  const profile = Object.hasOwn(voiceProfiles, voice) ? voice : voice === "female" ? "young-female" : "older-male";
  return enabled ? profile : voiceProfiles[profile].gender === "female" ? "young-female" : "older-male";
}

// Casting follows the rendered sprites, including the gray-haired visitor-0
// whose dialogue describes a student. See handoff/references/voice-casting.md.
export const npcVoiceProfiles = Object.freeze({
  mei: "young-female", lin: "young-male", qiao: "older-female",
  bo: "older-male", lan: "young-female", wei: "older-male",
  an: "young-female", hao: "young-male", yun: "older-female",
  "clothing-seller": "young-female", "clothing-customer": "young-male",
  "visitor-0": "older-male", "visitor-1": "young-female",
  "visitor-2": "older-male", "visitor-3": "young-female",
  "visitor-4": "older-male", "visitor-5": "older-female",
  guide: "young-female", waiter: "older-male", suyin: "older-female",
  lian: "young-female", diner: "young-male", "diner-friend": "older-female",
  baker: "older-female", reader: "young-male", gardener: "older-male",
  "silk-host": "older-female", "kid-one": "young-male",
  "kid-two": "young-female", "snack-host": "young-female",
});

export function voiceForNpc(id, appearance) {
  // The reader uses the older Bo portrait in the silk studio and painted
  // restaurant, but his own young portrait in the bookshop and museum.
  return npcVoiceProfiles[appearance] || npcVoiceProfiles[id] || "older-male";
}
