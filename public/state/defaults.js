import { newAdventure } from "../data/adventure.js";
import { defaultSettings } from "../data/settings.js";
import { newLearner } from "../data/learner.js";
import { newPractice } from "../data/activities.js";
import { scenes, MAP_VERSION } from "../game/world.js";

export const createInitialState = () => ({
  schema: 1,
  mapVersion: MAP_VERSION,
  scene: "shanghai",
  position: { ...scenes.shanghai.spawn },
  found: [],
  settings: { ...defaultSettings },
  settingsHistory: [],
  feedback: [],
  memories: {},
  learner: newLearner(),
  history: [],
  journal: [],
  practice: newPractice(),
  adventure: newAdventure(),
});
