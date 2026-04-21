// chat-widget.js — OpenClaw support bot
// Embeds a bottom-right chat bubble. Click to open. Messages POST to /.netlify/functions/chat.
// Falls back gracefully if the function isn't reachable (local dev) by offering mailto.

(function () {
  const STATE = { open: false, history: [], loading: false };
  const ENDPOINT = '/.netlify/functions/chat';
  const CAL = 'mailto:openclaw@yorkisestevez.com?subject=OpenClaw%20install%20help&body=Tell%20us%20about%20your%20setup%20and%20where%20you%27re%20stuck.';

  // Inject styles (scoped with .oc-* to avoid clashing with docs/_shared.css)
  const style = document.createElement('style');
  style.textContent = `
    .oc-bubble{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;
      background:linear-gradient(135deg,#6B1E2E,#a33148);color:#D4AF63;display:grid;place-items:center;
      box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 24px rgba(212,175,99,.3);cursor:pointer;font-size:24px;
      border:1px solid #D4AF63;transition:all .2s}
    .oc-bubble:hover{transform:scale(1.07);box-shadow:0 8px 32px rgba(212,175,99,.5)}
    .oc-panel{position:fixed;bottom:92px;right:24px;z-index:9999;width:360px;max-width:calc(100vw - 32px);
      height:500px;max-height:calc(100vh - 120px);
      background:#12090d;border:1px solid #3a1e29;color:#F2EEE7;
      font-family:'JetBrains Mono',ui-monospace,monospace;
      clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);
      display:none;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)}
    .oc-panel.open{display:flex}
    .oc-hdr{padding:14px 16px;background:linear-gradient(180deg,#1b0f15,#251421);border-bottom:1px solid #3a1e29;
      display:flex;align-items:center;justify-content:space-between}
    .oc-hdr .title{font-family:'Unbounded',sans-serif;font-weight:900;font-size:12px;letter-spacing:.25em;color:#D4AF63}
    .oc-hdr .sub{font-size:9px;color:#8a7580;letter-spacing:.2em;margin-top:2px}
    .oc-close{background:none;border:none;color:#8a7580;font-size:18px;cursor:pointer;padding:0 4px}
    .oc-close:hover{color:#F2EEE7}
    .oc-body{flex:1;overflow-y:auto;padding:14px;font-size:13px;line-height:1.6}
    .oc-body::-webkit-scrollbar{width:4px}
    .oc-body::-webkit-scrollbar-thumb{background:#3a1e29}
    .oc-msg{margin:10px 0;max-width:85%}
    .oc-msg.user{margin-left:auto;padding:8px 12px;background:#6B1E2E;color:#F2EEE7;
      clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}
    .oc-msg.bot{color:#F2EEE7;padding:8px 0}
    .oc-msg.bot strong{color:#D4AF63}
    .oc-msg.bot a{color:#D4AF63}
    .oc-msg.bot code{background:#1b0f15;padding:1px 5px;border:1px solid #3a1e29;font-size:11px}
    .oc-typing{color:#8a7580;font-style:italic;padding:8px 0}
    .oc-form{border-top:1px solid #3a1e29;padding:10px;display:flex;gap:6px;background:#0a0508}
    .oc-input{flex:1;background:#12090d;border:1px solid #3a1e29;color:#F2EEE7;padding:10px;font-family:inherit;font-size:12px;outline:none}
    .oc-input:focus{border-color:#D4AF63}
    .oc-send{background:linear-gradient(135deg,#6B1E2E,#a33148);color:#D4AF63;border:1px solid #D4AF63;
      font-family:'Unbounded',sans-serif;font-weight:800;font-size:10px;letter-spacing:.15em;padding:0 14px;cursor:pointer}
    .oc-send:hover{background:linear-gradient(135deg,#a33148,#D4AF63);color:#0a0508}
    .oc-send:disabled{opacity:.4;cursor:wait}
    .oc-quick{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}
    .oc-quick button{font-size:10px;letter-spacing:.1em;padding:5px 8px;background:#1b0f15;color:#8a7580;
      border:1px dashed #3a1e29;cursor:pointer;font-family:inherit}
    .oc-quick button:hover{color:#D4AF63;border-color:#D4AF63}
    .oc-escalate{text-align:center;padding:14px;border-top:1px dashed #3a1e29;font-size:11px;color:#8a7580}
    .oc-escalate a{color:#D4AF63}
  `;
  document.head.appendChild(style);

  // Build DOM
  const bubble = document.createElement('div');
  bubble.className = 'oc-bubble';
  bubble.id = 'openclaw-chat-bubble';
  bubble.title = 'Ask OpenClaw';
  bubble.innerHTML = '💬';
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.className = 'oc-panel';
  panel.innerHTML = `
    <div class="oc-hdr">
      <div>
        <div class="title">OPENCLAW SUPPORT</div>
        <div class="sub">AI · INSTANT</div>
      </div>
      <button class="oc-close" aria-label="close">×</button>
    </div>
    <div class="oc-body" id="oc-body">
      <div class="oc-msg bot">
        <strong>Hey 👋</strong><br/>
        I'm the OpenClaw support agent. I've read every page of the docs.
        Ask me anything about install, OAuth, pricing, or troubleshooting — or pick a starter below.
      </div>
      <div class="oc-quick">
        <button data-q="What are the hardware requirements?">What hardware do I need?</button>
        <button data-q="How do I install on Windows?">Install on Windows</button>
        <button data-q="How do I connect Gmail?">Connect Gmail</button>
        <button data-q="What does it cost?">Pricing</button>
        <button data-q="My OAuth is failing with redirect_uri_mismatch">OAuth error</button>
      </div>
    </div>
    <form class="oc-form" id="oc-form">
      <input class="oc-input" id="oc-input" placeholder="Ask anything about OpenClaw…" autocomplete="off" />
      <button class="oc-send" id="oc-send" type="submit">SEND</button>
    </form>
    <div class="oc-escalate">
      Still stuck? <a href="${CAL}">Email support</a>
    </div>
  `;
  document.body.appendChild(panel);

  const body = panel.querySelector('#oc-body');
  const form = panel.querySelector('#oc-form');
  const input = panel.querySelector('#oc-input');
  const sendBtn = panel.querySelector('#oc-send');

  bubble.addEventListener('click', () => {
    STATE.open = !STATE.open;
    panel.classList.toggle('open', STATE.open);
    if (STATE.open) setTimeout(() => input.focus(), 50);
  });
  panel.querySelector('.oc-close').addEventListener('click', () => {
    STATE.open = false; panel.classList.remove('open');
  });

  // Quick questions
  body.querySelectorAll('.oc-quick button').forEach(b => {
    b.addEventListener('click', () => send(b.dataset.q));
  });

  // Form
  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    send(msg);
  });

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = 'oc-msg ' + role;
    // Allow markdown-ish: bold, inline code, newlines
    const html = String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>')
      .replace(/\n/g, '<br/>');
    el.innerHTML = html;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  async function send(msg) {
    if (STATE.loading) return;
    STATE.loading = true;
    sendBtn.disabled = true;
    addMsg('user', msg);
    STATE.history.push({ role: 'user', content: msg });
    const typing = addMsg('bot', '…thinking…');
    typing.classList.add('oc-typing');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ history: STATE.history.slice(-10) }),
      });
      const data = await res.json();
      typing.remove();
      if (data.error) {
        addMsg('bot', `Sorry — I hit an error.\n\nIf this keeps happening, <a href="${CAL}">email support</a> and we'll get back to you within a few hours.`);
      } else {
        const reply = data.reply || '(no response)';
        addMsg('bot', reply);
        STATE.history.push({ role: 'assistant', content: reply });
      }
    } catch (e) {
      typing.remove();
      addMsg('bot', `I'm offline right now (probably local dev).\n\n<a href="${CAL}">Email openclaw@yorkisestevez.com</a> and we'll reply within 4 hours.`);
    } finally {
      STATE.loading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }
})();
