// Adaptadores de IA. Cada uno recibe { prompt, image (base64 jpeg | null) } y devuelve { text } o lanza { status, code, message }.
const env = (k) => (process.env[k] || '').trim();
const classify = (status, msg) =>
  status === 429 ? 'quota'
  : status === 401 || status === 403 || /api key|invalid x-api-key|authentication/i.test(msg) ? 'badkey'
  : status === 404 || /model.*(not found|does not exist|not supported|decommissioned)/i.test(msg) ? 'model'
  : status >= 500 ? 'overloaded' : 'upstream';

async function post(url, headers, body, ms = 25000) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), ms);
  let r;
  try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ac.signal }); }
  catch (e) { clearTimeout(timer); throw e && e.name === 'AbortError' ? { status: 504, code: 'timeout', message: 'Sin respuesta en ' + ms / 1000 + ' s' } : { status: 502, code: 'net', message: 'No llego al proveedor de IA' }; }
  clearTimeout(timer);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j.error && (j.error.message || j.error)) || j.message || 'HTTP ' + r.status;
    throw { status: r.status === 429 ? 429 : 502, code: classify(r.status, String(msg)), message: String(msg).slice(0, 300) };
  }
  return j;
}

const chatContent = (p) => [{ type: 'text', text: p.prompt }].concat(p.image ? [{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + p.image } }] : []);

const PROVIDERS = {
  groq: {
    key: () => env('GROQ_API_KEY'),
    async run(p) {
      const j = await post('https://api.groq.com/openai/v1/chat/completions', { Authorization: 'Bearer ' + env('GROQ_API_KEY') },
        { model: env('GROQ_MODEL') || 'meta-llama/llama-4-scout-17b-16e-instruct', temperature: 0.2, max_tokens: 3000, messages: [{ role: 'user', content: chatContent(p) }] });
      return { text: (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '' };
    },
  },
  openai: {
    key: () => env('OPENAI_API_KEY'),
    async run(p) {
      const j = await post('https://api.openai.com/v1/chat/completions', { Authorization: 'Bearer ' + env('OPENAI_API_KEY') },
        { model: env('OPENAI_MODEL') || 'gpt-4o-mini', temperature: 0.2, max_tokens: 3000, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: chatContent(p) }] });
      return { text: (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '' };
    },
  },
  anthropic: {
    key: () => env('ANTHROPIC_API_KEY'),
    async run(p) {
      const content = (p.image ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.image } }] : []).concat([{ type: 'text', text: p.prompt }]);
      const j = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01' },
        { model: env('ANTHROPIC_MODEL') || 'claude-haiku-5-5', max_tokens: 3000, temperature: 0.2, messages: [{ role: 'user', content }] });
      return { text: (j.content || []).map((c) => c.text || '').join('') };
    },
  },
  gemini: {
    key: () => env('GEMINI_API_KEY'),
    async run(p) {
      const parts = [{ text: p.prompt }].concat(p.image ? [{ inline_data: { mime_type: 'image/jpeg', data: p.image } }] : []);
      const body = { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } };
      const t0 = Date.now(), errs = [], tried = [];
      const call = async (model) => {
        tried.push(model);
        try {
          const j = await post('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', { 'x-goog-api-key': env('GEMINI_API_KEY') }, body, Math.min(22000, 50000 - (Date.now() - t0)));
          const c = j.candidates && j.candidates[0];
          return { text: c && c.content && c.content.parts ? c.content.parts.map((x) => x.text || '').join('') : '' };
        } catch (e) {
          errs.push(model + ' → ' + e.message);
          if (!['model', 'overloaded', 'upstream', 'quota', 'timeout'].includes(e.code)) throw e;
          return { err: e };
        }
      };
      for (const m of [...new Set([env('GEMINI_MODEL'), 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter(Boolean))]) {
        if (Date.now() - t0 > 46000) break;
        const x = await call(m); if (!x.err) return x;
      }
      throw { status: 502, code: 'model', message: 'Gemini no respondió. ' + errs.join(' | ') };
    },
  },
};

// Orden de preferencia si hay varias claves: AI_PROVIDER manda; si no, groq > anthropic > openai > gemini.
function pick() {
  const forced = env('AI_PROVIDER').toLowerCase();
  if (forced && PROVIDERS[forced] && PROVIDERS[forced].key()) return forced;
  return ['groq', 'anthropic', 'openai', 'gemini'].find((n) => PROVIDERS[n].key()) || null;
}
module.exports = { PROVIDERS, pick };
