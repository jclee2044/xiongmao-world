// Build quick questions from the line on screen, including generated NPC replies.
export function dialogueQuestions(reply) {
  const text = reply?.chinese || "";
  const clauses = text.match(/[^。！？!?，,；;]+/gu) || [text];
  const phrase = clauses.map(s => s.trim()).filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || text;
  const grammar = ["为什么", "还是", "什么", "怎么", "可以", "想", "吗", "吧", "了", "的"]
    .find(word => text.includes(word));
  return [
    "How can I respond to this?",
    `What does “${phrase.slice(0, 40)}” mean here?`,
    grammar
      ? `How is “${grammar}” used in this dialogue?`
      : `Help me say “${phrase.slice(0, 40)}” aloud.`,
  ];
}
