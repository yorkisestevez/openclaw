// Netlify Function — chat.js
// Proxies support-bot messages to Claude Haiku with the full OpenClaw docs as system context.
// Env vars needed in Netlify: ANTHROPIC_API_KEY
// Cost: ~$0.003 per conversation at Haiku rates. Budget ~$20-50/mo at launch volume.

const fs = require('fs');
const path = require('path');

const MODEL = 'claude-haiku-4-5';
const API = 'https://api.anthropic.com/v1/messages';
const MAX_HISTORY = 10;
const MAX_DOCS_BYTES = 60000; // ~15K tokens — fits Haiku happily, leaves room for system + history

// Lazy-loaded docs context
let DOCS_CONTEXT = null;
function loadDocs() {
  if (DOCS_CONTEXT) return DOCS_CONTEXT;
  const docsDir = path.resolve(__dirname, '..', '..', 'docs');
  const chunks = [];
  let bytes = 0;
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));
    for (const f of files) {
      const raw = fs.readFileSync(path.join(docsDir, f), 'utf8');
      // Extract just the <main> content, strip HTML
      const main = (raw.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || [, raw])[1];
      const text = main
        .replace(/<aside[\s\S]*?<\/aside>/gi, '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      const header = `\n\n=== /docs/${f.replace('.html','')} ===\n`;
      const combined = header + text;
      if (bytes + combined.length > MAX_DOCS_BYTES) break;
      chunks.push(combined);
      bytes += combined.length;
    }
  }
  DOCS_CONTEXT = chunks.join('');
  return DOCS_CONTEXT;
}

const SYSTEM_PROMPT = (docs) => `You are the OpenClaw support agent, embedded on openclaw.yorkisestevez.com.

OpenClaw is a local-first AI marketing toolkit. Pitch: "The marketing team your business can't afford yet." 13+ specialized AI agents (copywriter, social manager, review responder, invoice collector, etc.) that run on the user's own computer and publish through their existing stack.

Pricing: Starter $197/mo · Pro $497/mo · Agency $1,497/mo · Site migration one-time $3,500 · Self-host OSS $0.

Your job:
- Answer user questions about install, OAuth, pricing, and troubleshooting using the docs below as ground truth
- Be concise — 2-4 sentences for most answers, a code block if they need a command
- Link to the relevant /docs/ page when applicable — format as markdown links
- If a question is out of scope (sales deep-dive, custom engineering), suggest they email openclaw@yorkisestevez.com
- Never invent features or docs pages that don't exist
- Match the tone: direct, no-nonsense, confident

DOCS CONTEXT (all current pages):
${docs}

End of docs context.`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid json' }) }; }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  if (!history.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'empty history' }) };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({
      error: 'server not configured',
      reply: "I'm not wired up yet — the maintainer needs to set ANTHROPIC_API_KEY in Netlify. Please email openclaw@yorkisestevez.com and we'll get back to you.",
    }) };
  }

  try {
    const messages = history.map(m => ({ role: m.role, content: String(m.content || '').slice(0, 4000) }));
    const docs = loadDocs();
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT(docs),
        messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('anthropic error', data);
      return { statusCode: 502, headers, body: JSON.stringify({
        error: 'upstream', reply: "Sorry — I'm having trouble reaching the model. Try again in a sec, or email openclaw@yorkisestevez.com.",
      }) };
    }

    const reply = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    return { statusCode: 200, headers, body: JSON.stringify({ reply: reply || '(empty response)' }) };
  } catch (e) {
    console.error('chat handler error', e);
    return { statusCode: 500, headers, body: JSON.stringify({
      error: e.message, reply: "Something went wrong on my end. Email openclaw@yorkisestevez.com and we'll reply within a few hours.",
    }) };
  }
};
