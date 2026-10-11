import { activityRound } from "../data/activities.js";

const instructions = {
  choice: [
    "Choose a reply",
    "Read the situation, then choose the Chinese reply that fits.",
    "Choose the matching reply.",
  ],
  listening: [
    "Practice listening",
    "Listen, then choose the answer. Replay or show the words whenever you need help.",
    "Choose the matching answer.",
  ],
  basket: [
    "Practice quantities",
    "Set the quantity of each fruit, then check your basket.",
    "Match every quantity on the shopping list.",
  ],
  order: [
    "Practice drink orders",
    "Listen to the order, choose how many cups of each drink to serve, then check.",
    "Match all the drinks and quantities.",
  ],
  expression: [
    "Share an idea",
    "Write a short reply, or choose a starter and edit it. Chinese, English, or a mixture is welcome.",
    "Submit a non-empty reply. This is not a scored test.",
  ],
  visit: [
    "Explore with a clue",
    "Listen to the clue, find the person, animal or object, then interact with it. Use the map for help.",
    "Visit and interact with each destination in order.",
  ],
  sequence: [
    "Put actions in order",
    "Tap the cards in order, then check. Tap a selected card to remove it.",
    "Put all the actions in the matching order.",
  ],
  tiles: [
    "Build a sentence",
    "Tap words in order and check your sentence, or write your own idea and share it.",
    "Build the matching sentence or submit your own reply.",
  ],
  matching: [
    "Match words and pictures",
    "Choose a Chinese word, then its picture. Matched pairs stay marked.",
    "Match every pair.",
  ],
  riddle: [
    "Solve lantern riddles",
    "Listen to each clue and choose a lantern answer. Hints are available.",
    "Answer all the riddles.",
  ],
  weaving: [
    "Practice colors and positions",
    "Listen to a square’s instruction, choose a thread color, then tap that square. Check the pattern when ready.",
    "Match all nine squares to their instructions.",
  ],
  market: [
    "Practice shopping",
    "Choose quantities from the shopping list and check your basket. Watch the total and budget.",
    "Match the shopping list within the practice budget.",
  ],
};
export function activityGuide(id, active) {
  const a = activityRound(id, active?.round || 0);
  const [purpose, how, complete] = instructions[a.type];
  const step = active?.step || 0;
  return {
    ...a,
    purpose,
    how,
    complete,
    next:
      a.type === "visit"
        ? a.steps[step].clue.meaning
        : [
              "choice",
              "basket",
              "expression",
              "sequence",
              "tiles",
              "market",
            ].includes(a.type)
          ? a.prompt?.meaning || how
          : how,
    target: a.type === "visit" ? a.steps[step].target : null,
    progress: a.steps
      ? `Step ${step + 1} of ${a.steps.length}`
      : a.type === "matching"
        ? `${active?.matches?.length || 0} of ${a.pairs.length} pairs matched`
        : "",
  };
}
