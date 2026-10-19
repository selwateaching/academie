// Test helper loaded with `node --import`: replaces calls to api.anthropic.com with canned replies.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).startsWith('https://api.anthropic.com/')) return realFetch(url, init);
  const body = JSON.parse(init.body);
  const isDraft = /listening-comprehension/.test(body.system);
  const text = isDraft ? 'Here you go:\n' + JSON.stringify({
    mcq: [{ q: 'Where is Speaker 2 going?', options: ['School', 'The market', 'Home'], answer: 1 }],
    tf: [{ s: 'Speaker 2 wants vegetables.', answer: false }],
    gaps: [
      { sentence: 'I am going to the market to buy some fresh fruit.', word: 'fresh', alts: [] },
      { sentence: 'This sentence is not in the text.', word: 'text' },
    ],
  }) : 'Good morning. I like apples.';
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200, headers: { 'content-type': 'application/json' } });
};
