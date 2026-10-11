// Keep the approved two-voice cast available without changing saves or assets.
// Set false for an immediate rollback; both browser and server use this switch.
export const CHARACTER_VOICES_ENABLED = true;
// Panda uses audition A: Kokoro zm_009 with light, nasal, playful effects.
export const PANDA_VOICE = "panda";
export const pandaVoiceProfile = Object.freeze({
  gender: "male", model: "kokoro", speaker: "zm_009", sid: 58,
  gain: 1.6, effect: "panda-light-v1",
});
export const voiceProfiles = Object.freeze({
  "young-female": { gender: "female", model: "aishell3", speaker: "SSB0005", sid: 0 },
  "young-male": { gender: "male", model: "aishell3", speaker: "SSB0966", sid: 107 },
  "older-female": { gender: "female", model: "aishell3", speaker: "SSB0354", sid: 38, gain: 3.2 },
  "older-male": { gender: "male", model: "wnj", speaker: "WNJ", sid: 0 },
  "female-kokoro-001": { gender: "female", model: "kokoro", speaker: "zf_001", sid: 3 },
  "female-kokoro-026": { gender: "female", model: "kokoro", speaker: "zf_026", sid: 17 },
  "male-kokoro-009": { gender: "male", model: "kokoro", speaker: "zm_009", sid: 58 },
  "male-kokoro-014": { gender: "male", model: "kokoro", speaker: "zm_014", sid: 63 },
  "male-kokoro-020": { gender: "male", model: "kokoro", speaker: "zm_020", sid: 66 },
  "male-kokoro-055": { gender: "male", model: "kokoro", speaker: "zm_055", sid: 81 },
  "male-kokoro-068": { gender: "male", model: "kokoro", speaker: "zm_068", sid: 91 },
  "older-male-kokoro": { gender: "male", model: "kokoro", speaker: "zm_015", sid: 64 },
});

export function normalizeVoice(voice, enabled = CHARACTER_VOICES_ENABLED) {
  if (voice === PANDA_VOICE) return PANDA_VOICE;
  const profile = Object.hasOwn(voiceProfiles, voice) ? voice : voice === "female" ? "young-female" : "older-male";
  return enabled ? profile : voiceProfiles[profile].gender === "female" ? "young-female" : "older-male";
}

// Casting follows the rendered sprites, including the gray-haired visitor-0
// whose dialogue describes a student. See handoff/references/voice-casting.md.
export const npcVoiceProfiles = Object.freeze({
  mei: "female-kokoro-001", lin: "male-kokoro-009", qiao: "female-kokoro-026",
  bo: "older-male", lan: "female-kokoro-001", wei: "older-male-kokoro",
  an: "female-kokoro-001", hao: "male-kokoro-014", yun: "older-female",
  "family-grandma": "older-female", "family-grandpa": "older-male-kokoro",
  "family-dad": "male-kokoro-014", "family-son": "young-male", "family-daughter": "young-female",
  "station-traveler": "male-kokoro-009",
  "traveler-yutong": "female-kokoro-001", "traveler-wenbo": "male-kokoro-020",
  "traveler-meifang": "older-female", "traveler-jiani": "female-kokoro-026",
  "traveler-rui": "male-kokoro-009", "traveler-guoliang": "older-male-kokoro",
  "traveler-yating": "female-kokoro-001", "traveler-huilan": "female-kokoro-026",
  "traveler-zihan": "male-kokoro-055",
  "clothing-seller": "female-kokoro-001", "clothing-customer": "male-kokoro-055",
  "visitor-0": "older-male", "visitor-1": "female-kokoro-001",
  "visitor-2": "older-male-kokoro", "visitor-3": "female-kokoro-001",
  "visitor-4": "older-male", "visitor-5": "older-female",
  guide: "female-kokoro-001", waiter: "older-male", suyin: "female-kokoro-026",
  lian: "female-kokoro-001", diner: "male-kokoro-020", "diner-friend": "female-kokoro-026",
  baker: "older-female", reader: "male-kokoro-055", gardener: "older-male-kokoro",
  "silk-host": "older-female", "kid-one": "young-male",
  "bamboo-worker": "male-kokoro-068", "rock-gardener": "female-kokoro-026",
  "courtyard-caretaker": "older-male-kokoro",
  "kid-two": "young-female", "snack-host": "female-kokoro-001",
});

export function voiceForNpc(id, appearance) {
  // The reader uses the older Bo portrait in the silk studio and painted
  // restaurant, but his own young portrait in the bookshop and museum.
  if (id === "reader" && appearance === "bo") return "older-male";
  // Shared sprites do not change a person's identity (or give children an adult voice).
  return npcVoiceProfiles[id] || npcVoiceProfiles[appearance] || "older-male";
}
