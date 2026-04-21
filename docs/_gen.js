#!/usr/bin/env node
// Stamps out docs pages from a concise manifest.
// Run once: node _gen.js

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const NAV_ITEMS = [
  ['Get Started', [
    ['index',            'Overview',                    '/docs/'],
    ['requirements',     'Requirements',                '/docs/requirements.html'],
    ['install-windows',  'Install · Windows',           '/docs/install-windows.html'],
    ['install-mac',      'Install · Mac',               '/docs/install-mac.html'],
  ]],
  ['Connect', [
    ['oauth-google',     'Google (Gmail + Calendar)',   '/docs/oauth-google.html'],
    ['oauth-meta',       'Meta (FB + Instagram)',       '/docs/oauth-meta.html'],
    ['cms-connect',      'Your CMS / Email Tool',       '/docs/cms-connect.html'],
  ]],
  ['Use', [
    ['command-deck',     'Command Deck Tour',           '/docs/command-deck.html'],
    ['approvals',        'Approval Flow',               '/docs/approvals.html'],
    ['brand-voice',      'Brand Voice Setup',           '/docs/brand-voice.html'],
  ]],
  ['Help', [
    ['troubleshooting',  'Troubleshooting',             '/docs/troubleshooting.html'],
    ['faq',              'FAQ',                         '/docs/faq.html'],
    ['waitlist',         'Waitlist →',                  '/#waitlist'],
  ]],
];

function nav(activeSlug) {
  return [
    '<aside class="docs-nav">',
    '<a class="docs-brand" href="/"><div class="emblem">O</div><div><div class="name">OPENCLAW</div><div class="sub">DOCS</div></div></a>',
    ...NAV_ITEMS.flatMap(([group, items]) => [
      `<h4>${group}</h4><ul>`,
      ...items.map(([slug, title, href]) =>
        `<li><a href="${href}"${slug === activeSlug ? ' class="active"' : ''}>${title}</a></li>`),
      '</ul>',
    ]),
    '</aside>',
  ].join('');
}

function page({ slug, title, kicker, h1, body }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — OpenClaw Docs</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Unbounded:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="_shared.css">
</head><body><div class="docs-wrap">
${nav(slug)}
<main class="docs-main">
<div class="kicker">${kicker}</div>
<h1>${h1}</h1>
${body}
<footer class="docs-foot">OPENCLAW DOCS · © 2026</footer>
</main></div>
<script src="/chat-widget.js" defer></script>
</body></html>`;
}

// ── Page content ──
const PAGES = {
  'oauth-meta': {
    title: 'Connect Meta', kicker: '· CONNECT · META ·', h1: 'Connect Meta (Facebook + Instagram)',
    body: `
<p>About 10 minutes. You'll create a Meta developer app, grant page + instagram permissions, and paste a permanent page token.</p>
<div class="callout"><strong>Quick path:</strong> if you've already set up a Meta app for any marketing tool, you can reuse its app ID + secret — just add a new OAuth redirect.</div>
<h2>Step 1 — Create a Meta Developer app</h2>
<ol>
  <li>Go to <a href="https://developers.facebook.com/apps/">developers.facebook.com/apps</a> → <strong>Create App</strong></li>
  <li>Use case: <strong>Other</strong> → Type: <strong>Business</strong></li>
  <li>Name: <code>OpenClaw Marketing</code> → Contact email → pick your Business portfolio (Golden Maple, etc.)</li>
</ol>
<h2>Step 2 — Add Facebook Login product</h2>
<ol>
  <li>Left sidebar → <strong>Add product</strong> → <strong>Facebook Login</strong></li>
  <li>Settings → Valid OAuth Redirect URIs → add <code>https://www.facebook.com/connect/login_success.html</code></li>
  <li>Save</li>
</ol>
<h2>Step 3 — Add your domain</h2>
<p>Basic Settings → App Domains → add <code>facebook.com</code>. This allows the Graph Explorer redirect.</p>
<h2>Step 4 — Grab app credentials</h2>
<p>App Settings → Basic. Copy the <strong>App ID</strong>. Click <strong>Show</strong> on App Secret and copy that too (needs your FB password).</p>
<h2>Step 5 — Generate a short-lived token</h2>
<ol>
  <li><a href="https://developers.facebook.com/tools/explorer/">Graph API Explorer</a></li>
  <li>Meta App: your app name</li>
  <li>User or Page: <strong>User Token</strong></li>
  <li>Add permissions: <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_posts</code>, <code>pages_manage_metadata</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>business_management</code></li>
  <li>Click <strong>Generate Access Token</strong> → Choose account → Approve all scopes → Select your Business portfolio</li>
  <li>Copy the resulting token (starts with <code>EAA</code>)</li>
</ol>
<h2>Step 6 — Exchange for a permanent page token</h2>
<pre><code>setx META_APP_ID "&lt;your-app-id&gt;"
setx META_APP_SECRET "&lt;your-app-secret&gt;"

cd skills/meta-toolkit
node meta.js refresh "&lt;the-short-lived-token-you-just-copied&gt;"</code></pre>
<p>This exchanges the short-lived token for a 60-day user token, then pulls a <strong>permanent page token</strong> (never expires until revoked). All three tokens save to <code>credentials/.env</code> and Windows env vars.</p>
<h2>Verify</h2>
<pre><code>node meta.js status
node meta.js verify</code></pre>
<p>You should see your FB Page + IG Business account with follower counts.</p>
<h3>Next</h3>
<p><a href="/docs/cms-connect.html">Connect your CMS / email tool →</a></p>` },

  'cms-connect': {
    title: 'CMS & Email Connections', kicker: '· CONNECT · STACK ·', h1: 'Connect your CMS + email tool',
    body: `
<div class="callout warn"><strong>Phase 3 feature.</strong> The CMS and email publishers (WordPress, Webflow, Mailchimp, Klaviyo) are on the roadmap for week 3 of beta. Current agents draft content that you copy-paste. Auto-publish launches soon.</div>
<h2>What's coming</h2>
<ul>
  <li><strong>WordPress</strong> — REST API via your app password. Blog posts and pages auto-published.</li>
  <li><strong>Webflow</strong> — CMS API v2. Collection items pushed on a schedule.</li>
  <li><strong>Mailchimp</strong> — Campaign sender for the EMAIL-MANAGER agent.</li>
  <li><strong>Klaviyo</strong> — Same, for Klaviyo users.</li>
  <li><strong>Google Business Profile</strong> — Weekly posts + Q&A answers (reuses the Google OAuth from Gmail).</li>
</ul>
<h2>Today's workaround</h2>
<p>The COPYWRITER and SEO-WRITER agents output their drafts to the <code>output/</code> folder in the skill directory. Copy-paste into your CMS until the auto-publishers ship.</p>
<h2>Beta priority</h2>
<p>If you're on Pro or Agency and have a specific CMS or ESP you need — email <a href="mailto:openclaw@yorkisestevez.com">openclaw@yorkisestevez.com</a> and we'll bump it up the build order.</p>` },

  'command-deck': {
    title: 'Command Deck Tour', kicker: '· USE ·', h1: 'Command Deck tour',
    body: `
<p>The Command Deck is your mission control. It shows every agent in your party, what they're doing right now, and lets you dispatch them on missions with one click.</p>
<h2>Anatomy</h2>
<ul>
  <li><strong>Top bar</strong> — current client, active agents, queue count, daily budget spent</li>
  <li><strong>Tenant tabs</strong> — switch between clients (Agency tier only)</li>
  <li><strong>Views</strong> — <code>ROSTER</code> (the 13 wired agents) or <code>LIBRARY</code> (the full 80-agent catalog)</li>
  <li><strong>Dispatch panel</strong> — select agents + set mission + launch</li>
  <li><strong>Live feed</strong> — real-time event stream (like a combat log)</li>
</ul>
<h2>Dispatching your first mission</h2>
<ol>
  <li>Click any agent card to add them to the party (cards glow gold)</li>
  <li>Pick a preset payload from the chips, OR type a JSON payload</li>
  <li>Click <strong>⚔ LAUNCH</strong></li>
  <li>Watch the Live Feed for real-time progress</li>
</ol>
<h2>Agent XP</h2>
<p>Each successful run earns an agent XP. Level-ups are cosmetic but help you spot which agents do the most lifting. Success rate tracks done ÷ (done + error).</p>
<h2>Approval flow</h2>
<p>If an agent's type is in <code>require_approval_types</code> (see <code>clients/&lt;slug&gt;/config.json</code>), it sits in <strong>AWAITING</strong> until you tap ✅. Everything else runs autonomously. See <a href="/docs/approvals.html">Approval Flow</a>.</p>
<h2>Library view</h2>
<p>Click <strong>📚 LIBRARY</strong>. 80 skills across REVENUE, CONTENT, ADS, INTEL, etc. Filter chips show live counts. Cards with ✅ READY can be dispatched via <strong>RUN NOW</strong>.</p>` },

  'approvals': {
    title: 'Approval Flow', kicker: '· USE ·', h1: 'Approval flow',
    body: `
<p>OpenClaw's approval flow is the difference between "AI that helps" and "AI that acts on your behalf." Every action type falls into one of two buckets.</p>
<h2>Auto-approved (read-only or safe)</h2>
<ul>
  <li>INBOX-MANAGER — triages mail, doesn't reply</li>
  <li>FOLLOW-UP-SPECIALIST — finds stale threads, doesn't send</li>
  <li>MEETING-PREP — reads calendar + email, drafts briefings</li>
  <li>COMPETITIVE-ANALYST — scrapes, doesn't post</li>
</ul>
<h2>Approval required (anything that sends)</h2>
<ul>
  <li>SOCIAL-MANAGER — posting to FB/IG</li>
  <li>EMAIL-DRAFTER — creating Gmail drafts (not sending; still approval-gated)</li>
  <li>INVOICE-COLLECTOR — drafting invoice follow-ups</li>
  <li>GBP-MANAGER — Google Business Profile posts</li>
  <li>ADS-MANAGER — Meta/Google ad publishing</li>
</ul>
<h2>Approve via Telegram</h2>
<p>When an agent drops an action in the approval queue, your @YorkisEstevez_bot DMs you with ✅ / ❌ / ✏️ buttons. Tap from phone. Done.</p>
<h2>Approve via Command Deck</h2>
<p>Queue panel shows all AWAITING actions with inline <strong>OK</strong> / <strong>X</strong> buttons. One click.</p>
<h2>Approve via CLI</h2>
<pre><code>cd skills/meta-orchestrator/trials
node fire.js &lt;client&gt; approve &lt;task_id&gt;</code></pre>
<h2>Configuring what needs approval</h2>
<p>Edit <code>clients/&lt;slug&gt;/config.json</code>:</p>
<pre><code>{
  "approval": {
    "require_approval_types": ["fb_post", "ig_post", "invoice_chase", "gmail_draft"],
    "auto_approve_types": ["inbox_triage", "follow_up_track", "meeting_prep"]
  }
}</code></pre>
<p>Move types between the arrays as you trust each agent more (or less).</p>` },

  'brand-voice': {
    title: 'Brand Voice', kicker: '· USE ·', h1: 'Brand voice learning',
    body: `
<p>Every time you approve a draft, that approved text becomes a voice sample the next agent reads. Your marketing gets more "you" every week.</p>
<h2>Where samples live</h2>
<pre><code>clients/&lt;client-slug&gt;/voice-samples/
├── approved/
│   ├── 2026-04-21_invoice-TEST-001.txt
│   └── 2026-04-28_fb-spring-cleanup.txt
└── README.md</code></pre>
<h2>Seed your voice (day 1)</h2>
<ol>
  <li>Copy 5–10 of your best recent emails or blog posts into <code>voice-samples/approved/</code></li>
  <li>Name them anything — the loader reads every <code>.txt</code> or <code>.md</code></li>
  <li>Cap: ~6 KB per file, 20 KB total for the context. Paste your best stuff, not everything.</li>
</ol>
<h2>Seed via BRAIN.md</h2>
<p>The brand-voice loader also reads <code>wiki/business/projects/&lt;slug&gt;/BRAIN.md</code>. Add a "Voice & Tone" section to your project's BRAIN and it flows in:</p>
<pre><code># Voice & Tone
- Confident, not salesy
- Plain English, no jargon
- Always name the specific product/neighborhood
- Never promise timelines we can't keep</code></pre>
<h2>Compound effect</h2>
<p>By month 3, with 30–50 approved drafts in the library, the COPYWRITER and EMAIL-MANAGER agents write material a blind reader can't tell you didn't write yourself.</p>` },

  'troubleshooting': {
    title: 'Troubleshooting', kicker: '· HELP ·', h1: 'Troubleshooting',
    body: `
<p>The most common install and runtime errors, with exact fixes. Hit the chatbot for anything not listed.</p>

<h2>Install errors</h2>
<h3>npm install fails with "Python not found"</h3>
<p>Some dependencies need Python for native builds. Windows: install <a href="https://www.python.org/downloads/">Python 3.11</a> and re-run. Mac: <code>brew install python</code>.</p>

<h3>ollama pull stalls at 0%</h3>
<p>Usually firewall or VPN. Disable VPN, try again. If Corporate firewall, ask IT to whitelist <code>*.ollama.com</code>.</p>

<h3>"port 5055 already in use"</h3>
<p>Another process is on that port. Find and kill, or use a different port: <code>node server.js 5056</code>.</p>

<h2>OAuth errors</h2>
<h3>Google: "app not verified / access blocked"</h3>
<p>You haven't added yourself as a test user. Go to <a href="https://console.cloud.google.com/auth/audience">Google Auth Platform → Audience → Test users → Add</a>.</p>

<h3>Google: "redirect_uri_mismatch"</h3>
<p>You created a Web app client instead of Desktop. Create a new OAuth client with type = <strong>Desktop app</strong>.</p>

<h3>Meta: "Can't load URL"</h3>
<p>Redirect URI isn't in the Meta app's Valid OAuth Redirects. Add <code>https://www.facebook.com/connect/login_success.html</code> in Facebook Login settings, and add <code>facebook.com</code> to App Domains in Basic Settings.</p>

<h3>Meta: /me/accounts returns empty</h3>
<p>Missing <code>business_management</code> scope. Re-run Graph Explorer and check that permission during auth. Also confirm your user is an admin on the Page + the Page's Business Portfolio.</p>

<h2>Runtime errors</h2>
<h3>Ollama: "model 'yorkis-brain' not found"</h3>
<p>The custom models aren't built on your install. They're aliases. The router resolves them to <code>qwen3.5:9b</code> — make sure that's pulled: <code>ollama pull qwen3.5:9b</code>.</p>

<h3>"ENOSPC: no space left"</h3>
<p>Disk full from Ollama models. Free 20 GB, or move Ollama models: <code>OLLAMA_MODELS=D:/ollama</code> env var.</p>

<h3>Command Deck shows 0 agents</h3>
<p>You're on the wrong client. Click the correct tenant tab at the top. Or the <code>clients/</code> folder is missing — restore from git.</p>

<h3>FB post: HTTP 190 "Session has expired"</h3>
<p>Page token expired (rare — they're ~14 months). Re-run Graph Explorer for a new short-lived token, then <code>node meta.js refresh &lt;new-token&gt;</code>.</p>

<h2>Still stuck?</h2>
<ul>
  <li>💬 Chatbot (bottom-right) — instant</li>
  <li>📧 <a href="mailto:openclaw@yorkisestevez.com">openclaw@yorkisestevez.com</a> — within 4 hours ET</li>
  <li>📞 Phone (in footer) — business hours ET</li>
</ul>` },

  'faq': {
    title: 'FAQ', kicker: '· HELP ·', h1: 'Frequently asked questions',
    body: `
<h2>How is this different from Lindy / Relevance AI / Gumloop?</h2>
<p>Those are cloud-first horizontal tools priced per token. Great for tech startups, painful for contractors. OpenClaw runs locally on your hardware, caps cloud spend, and is pre-wired for small-business marketing — not a "build-your-own-agent" framework.</p>

<h2>Does my data really stay on my computer?</h2>
<p>Yes. Local LLMs read and process everything on your machine. Your emails, client lists, voice samples — never leave. The only data that touches a cloud API is the specific prompt you choose to escalate to Claude, and the dashboard shows exactly what's sent.</p>

<h2>Will it replace a marketing employee?</h2>
<p>If you have zero marketers and can't afford one — yes. If you have a $5K/mo agency — probably not at the strategic level, but it replaces 60–70% of the execution. Many Pro customers fire their agency and keep a strategist on retainer.</p>

<h2>Do I need to code to use this?</h2>
<p>Starter tier: enough to follow a 20-min terminal walkthrough. Pro: we install it for you on a Zoom call. If you can use Gmail and read a recipe, Pro works.</p>

<h2>What happens if OpenClaw goes out of business?</h2>
<p>The core is MIT-licensed and on GitHub. Your install keeps working forever. Your tokens, your data, your voice samples — all on your machine. Vendor lock-in is structurally impossible.</p>

<h2>Can I cancel anytime?</h2>
<p>Yes. 30-day money-back on the first month. After that, monthly, cancel anytime via email. No contracts.</p>

<h2>What if my internet goes out?</h2>
<p>Local agents (inbox, CRM, content drafting) keep running. Publishing agents queue up posts and fire when you're back online.</p>

<h2>How do you handle multi-user teams?</h2>
<p>Currently single-user per install. Multi-user within one tenant is a v2 feature. Agency tier supports 10 separate tenants for separate clients.</p>

<h2>Is there an API?</h2>
<p>Everything's Node modules. You can <code>require()</code> any agent from your own scripts. A proper REST API is planned for Pro+ tiers.</p>

<h2>What's the roadmap?</h2>
<ol>
  <li>Phase 1 (now): public beta, Ontario contractors first</li>
  <li>Phase 2: CMS + email auto-publishers (WP, Webflow, Mailchimp, Klaviyo)</li>
  <li>Phase 3: Vertical packs (Dental, HVAC, Real Estate)</li>
  <li>Phase 4: Scheduled autonomous drainer + Telegram UI</li>
  <li>Phase 5: Multi-tenant hosted option for agencies</li>
</ol>

<h2>Can I contribute?</h2>
<p>Yes — MIT. PR against <a href="https://github.com/yorkisestevez/openclaw">the repo</a>. Agents, bug fixes, docs all welcome.</p>

<h2>What about compliance (SOC 2, HIPAA)?</h2>
<p>Not claimed. Position: "your data stays on your machine" is the real statement. Formal audits come after 50+ paying customers.</p>` },
};

// ── Generate ──
for (const [slug, data] of Object.entries(PAGES)) {
  const html = page({ slug, ...data });
  const out = path.join(ROOT, `${slug}.html`);
  fs.writeFileSync(out, html, 'utf8');
  console.log('wrote', out);
}
console.log('done —', Object.keys(PAGES).length, 'pages');
