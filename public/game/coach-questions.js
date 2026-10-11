// Build quick questions from the line on screen, including generated NPC replies.
export function dialogueQuestions(reply) {
  const text = reply?.chinese || "";
  const clauses = text.match(/[^。！？!?，,；;]+/gu) || [text];
  const phrase = clauses.map(s => s.trim()).filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || text;
  return [
    "How can I respond to this?",
    "Can you explain this dialogue to me?",
    `What does “${phrase.slice(0, 40)}” mean here?`,
  ];
}
