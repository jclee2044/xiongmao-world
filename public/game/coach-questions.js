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

export const pandaSpeaker = '<div class="panda-speaker" lang="en"><img src="/assets/welcome/panda-240.webp" alt="" width="40" height="40"><span>Panda</span></div>';

// Capture the underlying screen, never the tutor dialog or hidden help words.
// Re-capture on each question: activities can change while a request is pending.
export function screenContext(root) {
  if (!root?.isConnected || (root.matches("dialog") && !root.open)) return null;
  const visible = el => {
    const r = el.getBoundingClientRect(), style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight &&
      style.visibility !== "hidden" && !el.closest('[hidden],details:not([open]) > :not(summary)');
  };
  const controls = [...root.querySelectorAll('button,a,select,input,textarea')]
    .filter(el => visible(el) && !el.matches('.help-word,[data-screen-help]') && el.type !== 'hidden')
    .slice(0, 60).map(el => ({
      label: (el.getAttribute('aria-label') || el.innerText || el.labels?.[0]?.innerText || el.placeholder || '').trim().slice(0, 180),
      meaning: (el.dataset.help || el.querySelector('.meaning')?.textContent || '').trim().slice(0, 250),
      disabled: Boolean(el.disabled),
      bottom: Math.round(el.getBoundingClientRect().bottom),
    })).filter(el => el.label);
  return {
    title: (root.querySelector('h2')?.textContent || 'Current screen').slice(0, 120),
    text: [...root.querySelectorAll('p,.activity-guide,.xp-award')].filter(el => visible(el) && !el.matches('[role=status],#dialog-status,#panel-audio-status,#practice-audio-status'))
      .map(el => el.innerText).join('\n').slice(0, 3500),
    controls,
  };
}
